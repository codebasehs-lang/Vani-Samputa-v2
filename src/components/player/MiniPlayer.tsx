"use client"

import { usePlayerStore } from "@/store/playerStore"
import { Play, Pause, ArrowCounterClockwise, ArrowClockwise, CaretUp } from "phosphor-react"

export function MiniPlayer() {
  const {
    currentTrack, isPlaying, positionS, duration,
    pause, resume, seek, openFullScreen,
  } = usePlayerStore()

  if (!currentTrack) return null

  const pct = duration > 0 ? (positionS / duration) * 100 : 0

  return (
    <div
      className="fixed bottom-16 left-0 right-0 z-40 border-t border-[var(--border)] md:bottom-0"
      style={{ background: "var(--surface)" }}
    >
      {/* Thin progress strip */}
      <div className="h-0.5 w-full bg-[var(--border)]">
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${pct}%`, background: "var(--saffron)" }}
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
          <p className="text-[10px] text-[var(--muted)]">HH Haladhara Swami</p>
        </button>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => seek(Math.max(0, positionS - 15))}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
            aria-label="Back 15s"
          >
            <ArrowCounterClockwise size={18} weight="bold" />
          </button>

          <button
            onClick={() => (isPlaying ? pause() : resume())}
            className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-opacity hover:opacity-90"
            style={{ background: "var(--saffron)" }}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying
              ? <Pause size={18} weight="fill" />
              : <Play size={18} weight="fill" />}
          </button>

          <button
            onClick={() => seek(Math.min(duration, positionS + 15))}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
            aria-label="Forward 15s"
          >
            <ArrowClockwise size={18} weight="bold" />
          </button>

          <button
            onClick={openFullScreen}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
            aria-label="Open full player"
          >
            <CaretUp size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
