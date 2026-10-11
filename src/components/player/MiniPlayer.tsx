"use client"

import { usePlayerStore } from "@/store/playerStore"
import { formatDuration } from "@/lib/duration"
import { usePathname } from "next/navigation"
import { ChevronUp, Headphones, Pause, Play, RotateCcw, RotateCw, X } from "lucide-react"
import type { CSSProperties } from "react"

export function MiniPlayer() {
  const {
    currentTrack, isPlaying, isMiniPlayer, positionS, duration: liveDuration, trackProgress,
    pause, resume, seek, openFullScreen, hideMiniPlayer,
  } = usePlayerStore()
  const pathname = usePathname()

  // Video never uses this bar — it has its own inline controls on /video, or
  // the floating PiP player elsewhere; closing the PiP shouldn't reveal this.
  const isRedundantForVideo = currentTrack?.mediaType === "VIDEO"
  const isAdminRoute = pathname.startsWith("/admin")

  if (!currentTrack || !isMiniPlayer || isRedundantForVideo || isAdminRoute) return null

  // `duration` isn't persisted, so fall back to the saved/track length until audio loads.
  const duration = liveDuration || trackProgress[currentTrack.id]?.duration || currentTrack.duration || 0
  const pct = duration > 0 ? Math.min(100, (positionS / duration) * 100) : 0

  return (
    <div className="fixed inset-x-0 bottom-16 z-40 px-2 pb-2 md:bottom-0 md:px-4 md:pb-3">
      <div className="mini-dock mx-auto max-w-5xl" data-playing={isPlaying ? "true" : undefined}>
        <div className="mini-dock-glow" aria-hidden="true" />

        <input
          type="range"
          min={0}
          max={duration || 1}
          step={1}
          value={positionS}
          onChange={(e) => seek(Number(e.target.value))}
          className="mini-seek"
          style={{ "--pct": `${pct}%` } as CSSProperties}
          aria-label="Seek"
        />

        <div className="relative flex items-center gap-3 px-3 py-2.5 sm:px-4">
          <button onClick={openFullScreen} aria-label="Expand player" className="mini-thumb">
            {currentTrack.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentTrack.thumbnail} alt="" className="h-full w-full object-cover" />
            ) : (
              <Headphones size={20} className="text-[#f6d77a]" />
            )}
            {isPlaying && (
              <span className="now-eq" aria-hidden="true">
                <i /><i /><i /><i />
              </span>
            )}
          </button>

          <button onClick={openFullScreen} className="min-w-0 flex-1 text-left">
            <span className="mini-eyebrow">
              <span className="mini-eyebrow-dot" aria-hidden="true" />
              {isPlaying ? "Now playing" : "Paused"}
            </span>
            <p className="mini-title truncate">{currentTrack.title}</p>
            <p className="mini-sub font-iast truncate">
              HH Haladhara Svāmī
              <span className="hidden sm:inline">
                {" · "}
                <span className="tabular-nums">
                  {formatDuration(positionS)}{duration > 0 ? ` / ${formatDuration(duration)}` : ""}
                </span>
              </span>
            </p>
          </button>

          <div className="flex items-center gap-1 sm:gap-1.5">
            <button
              onClick={() => seek(Math.max(0, positionS - 15))}
              className="mini-btn mini-skip hidden min-[400px]:inline-flex"
              aria-label="Back 15s"
            >
              <RotateCcw size={17} strokeWidth={2.3} />
              <span>15</span>
            </button>

            <button
              onClick={() => (isPlaying ? pause() : resume())}
              className="mini-play"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying
                ? <Pause size={18} fill="currentColor" />
                : <Play size={18} fill="currentColor" className="ml-0.5" />}
            </button>

            <button
              onClick={() => seek(Math.min(duration, positionS + 15))}
              className="mini-btn mini-skip hidden min-[400px]:inline-flex"
              aria-label="Forward 15s"
            >
              <RotateCw size={17} strokeWidth={2.3} />
              <span>15</span>
            </button>

            <span className="mini-divider hidden sm:block" aria-hidden="true" />

            <button onClick={openFullScreen} className="mini-btn hidden sm:inline-flex" aria-label="Open full player">
              <ChevronUp size={18} />
            </button>

            <button
              onClick={() => {
                // Keep the track (and its position) so it stays in Continue Listening,
                // matching how closing the floating video player behaves.
                pause()
                hideMiniPlayer()
              }}
              className="mini-btn"
              aria-label="Close audio player"
            >
              <X size={17} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
