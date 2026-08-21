"use client"

import { useEffect, useRef, useCallback } from "react"
import { usePlayerStore } from "@/store/playerStore"

interface Props {
  videoId: string
  startSeconds?: number
  autoplay?: boolean
  className?: string
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
  onPositionUpdate,
  onEnded,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mountedRef = useRef(true)

  const init = useCallback(() => {
    if (!mountedRef.current || !containerRef.current) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const YT = (window as any).YT
    playerRef.current = new YT.Player(containerRef.current, {
      videoId,
      playerVars: {
        start: Math.floor(startSeconds),
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
    }, 4_000)
  }, [videoId, startSeconds, autoplay, onPositionUpdate, onEnded])

  useEffect(() => {
    mountedRef.current = true
    loadYTApi(init)
    return () => {
      mountedRef.current = false
      if (timerRef.current) clearInterval(timerRef.current)
      playerRef.current?.destroy()
      playerRef.current = null
    }
  }, [init])

  return <div ref={containerRef} className={className ?? "w-full aspect-video"} />
}
