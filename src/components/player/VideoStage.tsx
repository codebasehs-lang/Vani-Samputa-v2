"use client"

import { createPortal } from "react-dom"
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react"
import { usePathname } from "next/navigation"
import { X, Maximize2, Minimize2, PictureInPicture2, Scaling } from "lucide-react"
import Link from "next/link"
import { usePlayerStore } from "@/store/playerStore"
import { formatDuration } from "@/lib/duration"
import {
  YouTubePlayer,
  type YouTubePlayerHandle,
} from "@/components/player/YouTubePlayer"
import {
  getVideoDockSnapshot,
  isDocumentPiPSupported,
  onDocumentPiPRequest,
  subscribeVideoDock,
} from "@/lib/videoDock"

type PiPWindow = (Window & { document: Document }) | null

// A single, never-remounted YouTube player is portaled between three possible
// homes — the docked video-page slot, the floating mini bubble, or a real
// Document Picture-in-Picture window — so switching between them (or leaving
// the tab/app) never restarts playback or loses the current position.
export function VideoStage() {
  const { currentTrack, setPosition, setDuration, setVideoProgress, finishTrack, setVideoMini, isVideoMini,
    positionS, duration: liveDuration, trackProgress } =
    usePlayerStore()
  const [pipLarge, setPipLarge] = useState(false)
  const pipDuration =
    liveDuration || (currentTrack ? trackProgress[currentTrack.id]?.duration || currentTrack.duration || 0 : 0)
  const pipPct = pipDuration > 0 ? Math.min(100, (positionS / pipDuration) * 100) : 0
  const pathname = usePathname()
  const isAdminRoute = pathname.startsWith("/admin")

  // A plain DOM node (not a React-rendered element) that holds the shared player
  // and gets manually reparented between the dock/floating/PiP targets. Fully
  // configured inside the lazy initializer (not mutated afterwards) so it stays
  // a stable, once-created value for the lifetime of this component.
  const [portalHost] = useState<HTMLDivElement | null>(() => {
    if (typeof document === "undefined") return null
    const el = document.createElement("div")
    el.style.position = "absolute"
    el.style.inset = "0"
    el.style.width = "100%"
    el.style.height = "100%"
    return el
  })
  const playerRef = useRef<YouTubePlayerHandle>(null)
  const floatingSlotRef = useRef<HTMLDivElement>(null)
  const [pipWindow, setPipWindow] = useState<PiPWindow>(null)

  const dock = useSyncExternalStore(subscribeVideoDock, getVideoDockSnapshot, getVideoDockSnapshot)

  const isVideoTrack = currentTrack?.mediaType === "VIDEO"
  const isDocked = isVideoTrack && dock.element !== null && dock.trackId === currentTrack.id
  const isFloatingVisible =
    isVideoTrack && !isDocked && !isAdminRoute && isVideoMini && !pipWindow

  const handlePosition = useCallback(
    (s: number) => {
      if (currentTrack) {
        setPosition(s, currentTrack.id)
        const duration = usePlayerStore.getState().trackProgress[currentTrack.id]?.duration || currentTrack.duration || 0
        const pct = duration > 0 ? Math.min(100, Math.round((s / duration) * 100)) : 0
        setVideoProgress(currentTrack.id, pct)
      }
    },
    [currentTrack, setPosition, setVideoProgress]
  )

  const handleDuration = useCallback(
    (duration: number) => {
      if (currentTrack) setDuration(duration, currentTrack.id)
    },
    [currentTrack, setDuration]
  )

  const handleEnded = useCallback(() => {
    if (currentTrack) finishTrack(currentTrack.id)
  }, [currentTrack, finishTrack])

  // Resolve and apply the current target parent for the shared player node.
  useEffect(() => {
    if (!portalHost || currentTrack?.mediaType !== "VIDEO") return
    const target = pipWindow?.document.body ?? (isDocked ? dock.element : isFloatingVisible ? floatingSlotRef.current : null)
    if (!target || portalHost.parentElement === target) return

    const resumeAt =
      playerRef.current?.getCurrentTime() ?? usePlayerStore.getState().positionS
    // Persist the latest known position before any potential iframe reload.
    handlePosition(resumeAt)

    const restorePosition = () => {
      playerRef.current?.seekTo(resumeAt)
      handlePosition(resumeAt)
    }
    const iframe = portalHost.querySelector("iframe")
    iframe?.addEventListener("load", restorePosition, { once: true })
    target.appendChild(portalHost)
    requestAnimationFrame(restorePosition)

    // Some browsers recreate the underlying YouTube iframe when moving across
    // documents (main page <-> Document PiP). Retry seek briefly until the
    // player reports it is back near the captured position.
    const retryTimer = window.setInterval(() => {
      const current = playerRef.current?.getCurrentTime()
      if (typeof current !== "number" || !Number.isFinite(current)) return
      if (Math.abs(current - resumeAt) <= 1.5) {
        window.clearInterval(retryTimer)
        return
      }
      playerRef.current?.seekTo(resumeAt)
    }, 300)
    const retryTimeout = window.setTimeout(() => {
      window.clearInterval(retryTimer)
    }, 5_000)

    return () => {
      iframe?.removeEventListener("load", restorePosition)
      window.clearInterval(retryTimer)
      window.clearTimeout(retryTimeout)
    }
  }, [
    portalHost,
    pipWindow,
    isDocked,
    dock.element,
    isFloatingVisible,
    currentTrack?.mediaType,
    handlePosition,
  ])

  // Close a still-open PiP window if playback stops or the track disappears.
  useEffect(() => {
    if (pipWindow && (!currentTrack || currentTrack.mediaType !== "VIDEO")) {
      pipWindow.close()
    }
  }, [pipWindow, currentTrack])

  const openDocumentPiP = useCallback(async () => {
    if (currentTrack?.mediaType !== "VIDEO") return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const api = (window as any).documentPictureInPicture
    if (!api || !portalHost) return
    try {
      const win: Window & { document: Document } = await api.requestWindow({ width: 360, height: 240 })
      win.document.body.style.margin = "0"
      win.document.body.style.background = "#000"
      win.document.body.style.overflow = "hidden"
      win.document.documentElement.style.height = "100%"
      win.document.body.style.height = "100%"
      win.addEventListener("pagehide", () => setPipWindow(null), { once: true })
      setPipWindow(win)
    } catch {
      // User dismissed the permission prompt, or the browser doesn't actually support it — ignore.
    }
  }, [currentTrack?.mediaType, portalHost])

  // Lets pages that don't own the player (e.g. the video watch page) trigger a
  // real PiP window without needing direct access to the player instance.
  useEffect(() => onDocumentPiPRequest(() => void openDocumentPiP()), [openDocumentPiP])

  const showPlayer =
    isVideoTrack && Boolean(portalHost) && (isDocked || isFloatingVisible || pipWindow)

  return (
    <>
      {showPlayer && portalHost && currentTrack && createPortal(
        <YouTubePlayer
          ref={playerRef}
          key={currentTrack.id}
          videoId={currentTrack.url}
          startSeconds="live"
          autoplay
          onPositionUpdate={handlePosition}
          onDurationUpdate={handleDuration}
          onEnded={handleEnded}
          className="relative h-full w-full"
        />,
        portalHost
      )}

      {isFloatingVisible && currentTrack && (
        <div
          className="vpip fixed bottom-20 right-3 z-50 md:bottom-5 md:right-5"
          data-size={pipLarge ? "lg" : "sm"}
          role="region"
          aria-label="Floating video player"
        >
          <div className="vpip-glow" aria-hidden="true" />

          <div className="vpip-head">
            <span className="vpip-badge">
              <span className="vpip-dot" aria-hidden="true" />
              Video
            </span>
            <p className="vpip-title truncate" title={currentTrack.title}>{currentTrack.title}</p>
          </div>

          <div className="vpip-frame">
            <div ref={floatingSlotRef} className="absolute inset-0" />
            <div className="vpip-progress" aria-hidden="true">
              <span style={{ width: `${pipPct}%` }} />
            </div>
          </div>

          <div className="vpip-bar">
            <span className="vpip-time tabular-nums">
              {formatDuration(positionS)}
              {pipDuration > 0 && <span className="vpip-time-muted"> / {formatDuration(pipDuration)}</span>}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPipLarge((v) => !v)}
                className="vpip-btn hidden sm:inline-flex"
                aria-label={pipLarge ? "Make player smaller" : "Make player larger"}
                title={pipLarge ? "Smaller" : "Larger"}
              >
                {pipLarge ? <Minimize2 size={14} /> : <Scaling size={14} />}
              </button>
              {isDocumentPiPSupported() && (
                <button
                  onClick={() => void openDocumentPiP()}
                  className="vpip-btn"
                  aria-label="Picture in Picture"
                  title="Pop out"
                >
                  <PictureInPicture2 size={14} />
                </button>
              )}
              <Link
                href={currentTrack.playlistId ? `/video/playlist/${currentTrack.playlistId}?video=${encodeURIComponent(currentTrack.id)}` : "/video"}
                className="vpip-btn vpip-btn-gold"
                aria-label="Expand"
                title="Open video page"
              >
                <Maximize2 size={14} />
              </Link>
              <button
                onClick={() => setVideoMini(false)}
                className="vpip-btn"
                aria-label="Close"
                title="Close"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
