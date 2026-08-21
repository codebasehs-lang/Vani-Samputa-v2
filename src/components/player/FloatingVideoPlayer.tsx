"use client"

import { usePlayerStore } from "@/store/playerStore"
import { usePathname } from "next/navigation"
import { useCallback } from "react"
import { X, ArrowsOut } from "phosphor-react"
import { YouTubePlayer } from "@/components/player/YouTubePlayer"
import Link from "next/link"

export function FloatingVideoPlayer() {
  const { currentTrack, positionS, setPosition, setVideoProgress, playNext, setVideoMini } =
    usePlayerStore()
  const pathname = usePathname()

  // Pause saving position on video route — page has its own player
  const isOnVideoRoute = pathname.startsWith("/video")
  const isVisible =
    currentTrack?.mediaType === "VIDEO" && !isOnVideoRoute

  const handlePosition = useCallback(
    (s: number) => {
      setPosition(s)
      if (currentTrack) {
        const pct = currentTrack.duration
          ? Math.round((s / currentTrack.duration) * 100)
          : 0
        setVideoProgress(currentTrack.id, pct)
      }
    },
    [currentTrack, setPosition, setVideoProgress]
  )

  if (!isVisible || !currentTrack) return null

  return (
    <div
      className="fixed bottom-20 right-3 z-50 overflow-hidden rounded-xl shadow-2xl border border-white/10"
      style={{ width: 240, height: 135 + 36 }}
    >
      {/* Controls bar */}
      <div
        className="flex items-center justify-between px-2 py-1.5"
        style={{ background: "#1a1a3e" }}
      >
        <p className="truncate text-[10px] font-medium text-white/70 max-w-[140px]">
          {currentTrack.title}
        </p>
        <div className="flex items-center gap-1">
          <Link
            href={`/video/playlist/${currentTrack.playlistId ?? ""}`}
            className="p-0.5 text-white/50 hover:text-white transition-colors"
            aria-label="Expand"
          >
            <ArrowsOut size={14} />
          </Link>
          <button
            onClick={() => setVideoMini(false)}
            className="p-0.5 text-white/50 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* YouTube player */}
      <YouTubePlayer
        videoId={currentTrack.url}
        startSeconds={positionS}
        autoplay
        onPositionUpdate={handlePosition}
        onEnded={playNext}
        className="w-full"
        // 240×135 = 16:9
      />
    </div>
  )
}
