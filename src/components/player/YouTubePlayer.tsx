"use client"

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
} from "react"
import { usePlayerStore } from "@/store/playerStore"
import { toast } from "sonner"
import { extractYouTubeId } from "@/lib/youtube"

export type YouTubePlayerHandle = {
  getCurrentTime: () => number | null
  seekTo: (seconds: number) => void
}

interface Props {
  videoId: string
  // "live" defers to the store's positionS at actual init time, so a resume
  // (e.g. switching to/from the mini player) picks up the freshest flushed
  // position rather than a value snapshotted before that flush happened.
  startSeconds?: number | "live"
  autoplay?: boolean
  className?: string
  style?: CSSProperties
  onPositionUpdate?: (s: number) => void
  onDurationUpdate?: (s: number) => void
  onEnded?: () => void
}

// Module-level singleton to avoid loading the script multiple times
let ytApiState: "idle" | "loading" | "ready" = "idle"
const ytCallbacks: Array<{ ready: () => void; fail: () => void }> = []

function loadYTApi(cb: () => void, onError: () => void) {
  if (typeof window === "undefined") return
  if (ytApiState === "ready") { cb(); return }
  ytCallbacks.push({ ready: cb, fail: onError })
  if (ytApiState === "loading") return
  ytApiState = "loading"
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).onYouTubeIframeAPIReady = () => {
    ytApiState = "ready"
    ytCallbacks.forEach((callback) => callback.ready())
    ytCallbacks.length = 0
  }
  const tag = document.createElement("script")
  tag.src = "https://www.youtube.com/iframe_api"
  tag.onerror = () => {
    ytApiState = "idle"
    const pending = ytCallbacks.splice(0)
    pending.forEach((callback) => callback.fail())
    tag.remove()
  }
  document.head.appendChild(tag)
}

export const YouTubePlayer = forwardRef<YouTubePlayerHandle, Props>(function YouTubePlayer({
    videoId: rawVideoId,
    startSeconds = 0,
    autoplay = true,
    className,
    style,
    onPositionUpdate,
    onDurationUpdate,
    onEnded,
  }, ref) {
  const videoId = extractYouTubeId(rawVideoId)
  const validVideoId = /^[\w-]{11}$/.test(videoId)
  const [playbackError, setPlaybackError] = useState<{ videoId: string; message: string } | null>(null)
  const errorMessage = !validVideoId
    ? "This lecture has an invalid YouTube video ID. Please ask an administrator to check its URL."
    : playbackError?.videoId === videoId ? playbackError.message : null
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mountedRef = useRef(true)
  const readyRef = useRef(false)
  // Only used as the initial seek position — later prop updates (e.g. live position
  // reporting) must not re-trigger player creation, so it's frozen at mount time.
  const startSecondsRef = useRef(startSeconds)

  useImperativeHandle(ref, () => ({
    getCurrentTime() {
      if (!readyRef.current) return null
      const position = playerRef.current?.getCurrentTime?.()
      return typeof position === "number" && Number.isFinite(position) ? position : null
    },
    seekTo(seconds: number) {
      playerRef.current?.seekTo?.(seconds, true)
    },
  }), [])

  const init = useCallback(() => {
    if (!validVideoId || !mountedRef.current || !containerRef.current || playerRef.current) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const YT = (window as any).YT
    // Resolved here (not frozen earlier) so "live" reads the store after any
    // just-unmounted instance's cleanup has flushed its final position.
    const resolvedStart =
      startSecondsRef.current === "live"
        ? usePlayerStore.getState().positionS
        : startSecondsRef.current
    // YouTube replaces its target node with an iframe; keep React's host intact.
    const target = document.createElement("div")
    containerRef.current.appendChild(target)
    playerRef.current = new YT.Player(target, {
      videoId,
      width: "100%",
      height: "100%",
      playerVars: {
        start: Math.floor(resolvedStart),
        autoplay: autoplay && usePlayerStore.getState().isPlaying ? 1 : 0,
        rel: 0,
        modestbranding: 1,
        playsinline: 1,
      },
      events: {
        onError: (event: { data: number }) => {
          const message = event.data === 101 || event.data === 150
            ? "This video cannot be embedded. Please open it on YouTube."
            : event.data === 100
              ? "This video is unavailable or private. Please check it on YouTube."
              : event.data === 153
                ? "YouTube could not verify this player. Please open the lecture on YouTube."
                : `YouTube could not play this lecture (error ${event.data}). Please try it on YouTube.`
          setPlaybackError({ videoId, message })
          const state = usePlayerStore.getState()
          if (state.currentTrack?.mediaType === "VIDEO" && extractYouTubeId(state.currentTrack.url) === videoId) state.pause()
        },
        onReady: () => {
          readyRef.current = true
          playerRef.current?.seekTo?.(resolvedStart, true)
          onDurationUpdate?.(playerRef.current?.getDuration?.())
          if (autoplay && usePlayerStore.getState().isPlaying) {
            playerRef.current?.playVideo?.()
          } else if (!usePlayerStore.getState().isPlaying) {
            playerRef.current?.pauseVideo?.()
          }
        },
        onAutoplayBlocked: () => {
          usePlayerStore.getState().pause()
          toast.info("Your browser paused autoplay. Press Play to continue the lecture.")
        },
        onStateChange: (e: { data: number }) => {
          if (e.data === 0) onEnded?.() // 0 = ended
          // Flush the position immediately on state changes like pause (2) or play (1)
          if (e.data === 1 || e.data === 2) {
            const pos = playerRef.current?.getCurrentTime?.()
            if (readyRef.current && typeof pos === "number" && Number.isFinite(pos)) {
              onPositionUpdate?.(pos)
            }
            const state = usePlayerStore.getState()
            if (state.currentTrack?.mediaType === "VIDEO" && extractYouTubeId(state.currentTrack.url) === videoId) {
              if (e.data === 1 && !state.isPlaying) state.resume()
              if (e.data === 2 && state.isPlaying) state.pause()
            }
          }
        },
      },
    })

    timerRef.current = setInterval(() => {
      const pos = playerRef.current?.getCurrentTime?.()
      if (readyRef.current && typeof pos === "number" && Number.isFinite(pos)) {
        onPositionUpdate?.(pos)
      }
    }, 1_000)
  }, [videoId, validVideoId, autoplay, onPositionUpdate, onDurationUpdate, onEnded])

  useEffect(() => {
    const container = containerRef.current
    mountedRef.current = true
    if (validVideoId) loadYTApi(init, () => {
      if (!mountedRef.current) return
      setPlaybackError({ videoId, message: "Could not load the YouTube player. Check your connection or open the lecture on YouTube." })
    })
    return () => {
      mountedRef.current = false
      if (timerRef.current) clearInterval(timerRef.current)
      // Flush the real position before teardown (e.g. switching to the mini player)
      // so the store never lags behind by up to a full poll interval.
      const pos = playerRef.current?.getCurrentTime?.()
      if (readyRef.current && typeof pos === "number" && Number.isFinite(pos)) {
        onPositionUpdate?.(pos)
      }
      playerRef.current?.destroy()
      playerRef.current = null
      readyRef.current = false
      container?.replaceChildren()
    }
  }, [init, onPositionUpdate, validVideoId, videoId])

  // Flush progress when the page is hidden, backgrounded, or navigating away (especially on mobile/PWA).
  useEffect(() => {
    const flush = () => {
      const pos = playerRef.current?.getCurrentTime?.()
      if (readyRef.current && typeof pos === "number" && Number.isFinite(pos)) {
        onPositionUpdate?.(pos)
      }
    }
    document.addEventListener("visibilitychange", flush)
    window.addEventListener("pagehide", flush)
    return () => {
      document.removeEventListener("visibilitychange", flush)
      window.removeEventListener("pagehide", flush)
    }
  }, [onPositionUpdate])

  // Honor seeks requested elsewhere (e.g. the Now Playing scrubber) so the store's
  // positionS never drifts from the real playhead — otherwise a later remount
  // (e.g. switching to the mini player) would resume from a stale/wrong position.
  useEffect(() => {
    return usePlayerStore.subscribe((s, prev) => {
      if (s.currentTrack?.mediaType !== "VIDEO" || extractYouTubeId(s.currentTrack.url) !== videoId || !readyRef.current) return
      if (s.isPlaying !== prev.isPlaying) {
        if (s.isPlaying) playerRef.current?.playVideo?.()
        else playerRef.current?.pauseVideo?.()
      }
      if (s.requestedPositionS !== null && s.requestedPositionS !== prev.requestedPositionS) {
        playerRef.current?.seekTo?.(s.requestedPositionS, true)
        usePlayerStore.getState().clearSeekRequest()
      }
    })
  }, [videoId])

  return (
    <div className={className ?? "relative w-full aspect-video"} style={style}>
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />
      {errorMessage && (
        <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/90 px-6 text-center text-sm text-white">
          <p>{errorMessage}</p>
          {validVideoId && (
            <a
              href={`https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[var(--accent)] px-4 py-2 font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Open on YouTube
            </a>
          )}
        </div>
      )}
    </div>
  )
})
