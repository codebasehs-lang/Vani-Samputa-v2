"use client"

import { useEffect, useRef, useCallback, type CSSProperties } from "react"
import { usePlayerStore } from "@/store/playerStore"

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
  onEnded?: () => void
}

// Module-level singleton to avoid loading the script multiple times
let ytApiState: "idle" | "loading" | "ready" = "idle"
const ytCallbacks: Array<() => void> = []

function loadYTApi(cb: () => void) {
  if (typeof window === "undefined") return
  if (ytApiState === "ready") { cb(); return }
  ytCallbacks.push(cb)
  if (ytApiState === "loading") return
  ytApiState = "loading"
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).onYouTubeIframeAPIReady = () => {
    ytApiState = "ready"
    ytCallbacks.forEach((fn) => fn())
    ytCallbacks.length = 0
  }
  const tag = document.createElement("script")
  tag.src = "https://www.youtube.com/iframe_api"
  document.head.appendChild(tag)
}

export function YouTubePlayer({
  videoId,
  startSeconds = 0,
  autoplay = true,
  className,
  style,
  onPositionUpdate,
  onEnded,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mountedRef = useRef(true)
  // Only used as the initial seek position — later prop updates (e.g. live position
  // reporting) must not re-trigger player creation, so it's frozen at mount time.
  const startSecondsRef = useRef(startSeconds)

  const init = useCallback(() => {
    if (!mountedRef.current || !containerRef.current) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const YT = (window as any).YT
    // Resolved here (not frozen earlier) so "live" reads the store after any
    // just-unmounted instance's cleanup has flushed its final position.
    const resolvedStart =
      startSecondsRef.current === "live"
        ? usePlayerStore.getState().positionS
        : startSecondsRef.current
    playerRef.current = new YT.Player(containerRef.current, {
      videoId,
      width: "100%",
      height: "100%",
      playerVars: {
        start: Math.floor(resolvedStart),
        autoplay: autoplay ? 1 : 0,
        rel: 0,
        modestbranding: 1,
        playsinline: 1,
      },
      events: {
        onStateChange: (e: { data: number }) => {
          if (e.data === 0) onEnded?.() // 0 = ended
        },
      },
    })

    timerRef.current = setInterval(() => {
      const pos: number = playerRef.current?.getCurrentTime?.() ?? 0
      onPositionUpdate?.(pos)
    }, 1_000)
  }, [videoId, autoplay, onPositionUpdate, onEnded])

  useEffect(() => {
    mountedRef.current = true
    loadYTApi(init)
    return () => {
      mountedRef.current = false
      if (timerRef.current) clearInterval(timerRef.current)
      // Flush the real position before teardown (e.g. switching to the mini player)
      // so the store never lags behind by up to a full poll interval.
      const pos: number | null = playerRef.current?.getCurrentTime?.() ?? null
      if (pos !== null) onPositionUpdate?.(pos)
      playerRef.current?.destroy()
      playerRef.current = null
    }
  }, [init, onPositionUpdate])

  // Honor seeks requested elsewhere (e.g. the Now Playing scrubber) so the store's
  // positionS never drifts from the real playhead — otherwise a later remount
  // (e.g. switching to the mini player) would resume from a stale/wrong position.
  useEffect(() => {
    return usePlayerStore.subscribe((s, prev) => {
      if (s.requestedPositionS !== null && s.requestedPositionS !== prev.requestedPositionS) {
        playerRef.current?.seekTo?.(s.requestedPositionS, true)
        usePlayerStore.getState().clearSeekRequest()
      }
    })
  }, [])

  return (
    <div className={className ?? "relative w-full aspect-video"} style={style}>
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />
    </div>
  )
}
