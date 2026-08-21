"use client"

import { usePlayerStore } from "@/store/playerStore"
import { Play, Headphones, VideoCamera } from "phosphor-react"

export function ContinueListening() {
  const { currentTrack, positionS, duration, play, resume, isPlaying } = usePlayerStore()

  if (!currentTrack) return null

  const percent = duration > 0 ? Math.round((positionS / duration) * 100) : 0
  const isAudio = currentTrack.mediaType === "AUDIO"

  return (
    <section className="px-4 py-6">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">Continue Listening</h2>

        <div
          className="flex items-center gap-4 rounded-xl border border-[var(--border)] p-4 transition-colors hover:border-[var(--saffron)]/40"
          style={{ background: "var(--surface)" }}
        >
          {/* Icon */}
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg text-2xl"
            style={{ background: "linear-gradient(135deg, var(--deep-blue) 0%, var(--deep-blue-mid) 100%)" }}
          >
            {isAudio ? "🎙️" : "🎬"}
          </div>

          {/* Info + progress */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[var(--foreground)]">
              {currentTrack.title}
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--border)]">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${percent}%`, background: "var(--saffron)" }}
              />
            </div>
            <p className="mt-1 text-[10px] text-[var(--muted)]">
              {formatTime(positionS)} · {percent}% complete
            </p>
          </div>

          {/* Play button */}
          <button
            onClick={() => (isPlaying ? undefined : resume())}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition-opacity hover:opacity-90"
            style={{ background: "var(--saffron)" }}
            aria-label="Resume"
          >
            {isAudio ? (
              <Headphones size={18} weight="fill" />
            ) : (
              <Play size={18} weight="fill" />
            )}
          </button>
        </div>
      </div>
    </section>
  )
}

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, "0")}`
}
