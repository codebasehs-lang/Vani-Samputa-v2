"use client"

import { usePlayerStore } from "@/store/playerStore"
import { Play, Pause, RotateCcw, RotateCw, ChevronUp } from "lucide-react"

export function MiniPlayer() {
  const {
    currentTrack, isPlaying, positionS, duration,
    pause, resume, seek, openFullScreen,
  } = usePlayerStore()

  if (!currentTrack) return null

  const pct = duration > 0 ? (positionS / duration) * 100 : 0

  return (
    <div className="nav-surface fixed bottom-16 left-0 right-0 z-40 border-t border-[var(--border)] md:bottom-0">
      {/* Thin progress strip */}
      <div className="h-0.5 w-full bg-[var(--border)]">
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${pct}%`, background: "var(--accent)" }}
        />
      </div>

      <div className="flex items-center gap-3 px-4 py-2.5">
        {/* Thumbnail / icon */}
        <button onClick={openFullScreen} aria-label="Expand player">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg text-xl"
            style={{ background: "linear-gradient(135deg, #1a1a3e 0%, #2d2d5e 100%)" }}
          >
            {currentTrack.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentTrack.thumbnail} alt="" className="h-full w-full object-cover" />
            ) : currentTrack.mediaType === "AUDIO" ? "🎙️" : "🎬"}
          </div>
        </button>

        {/* Title — tap to expand */}
        <button onClick={openFullScreen} className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-semibold text-[var(--foreground)]">
            {currentTrack.title}
          </p>
          <p className="font-iast text-[10px] text-[var(--muted)]">HH Haladhara Svāmī</p>
        </button>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => seek(Math.max(0, positionS - 15))}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
            aria-label="Back 15s"
          >
            <RotateCcw size={18} strokeWidth={2.5} />
          </button>

          <button
            onClick={() => (isPlaying ? pause() : resume())}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--accent-fg)] transition-opacity hover:opacity-90"
            style={{ background: "var(--accent)" }}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying
              ? <Pause size={18} fill="currentColor" />
              : <Play size={18} fill="currentColor" />}
          </button>

          <button
            onClick={() => seek(Math.min(duration, positionS + 15))}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
            aria-label="Forward 15s"
          >
            <RotateCw size={18} strokeWidth={2.5} />
          </button>

          <button
            onClick={openFullScreen}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
            aria-label="Open full player"
          >
            <ChevronUp size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
