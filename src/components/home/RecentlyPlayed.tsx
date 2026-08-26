"use client"

import { usePlayerStore } from "@/store/playerStore"
import { Play, Headphones, Video } from "lucide-react"

export function RecentlyPlayed() {
  const { history, currentTrack, play } = usePlayerStore()

  // exclude the currently-playing track (it belongs in ContinueListening)
  const recent = history.filter((t) => t.id !== currentTrack?.id).slice(0, 6)

  if (!recent.length) return null

  return (
    <section className="px-4 py-6">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">Recently Played</h2>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {recent.map((track) => (
            <button
              key={track.id}
              onClick={() => play(track)}
              className="surface-card group flex items-center gap-3 p-3 text-left hover:bg-[var(--accent)]/5"
            >
              {/* Thumbnail / icon */}
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-xl"
                style={{ background: "linear-gradient(135deg, #1a1a3e 0%, #2d2d5e 100%)" }}
              >
                {track.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={track.thumbnail} alt="" className="h-full w-full rounded-lg object-cover" />
                ) : track.mediaType === "AUDIO" ? (
                  "🎙️"
                ) : (
                  "🎬"
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--foreground)]">{track.title}</p>
                <p className="mt-0.5 flex items-center gap-1 text-[10px] text-[var(--muted)]">
                  {track.mediaType === "AUDIO" ? (
                    <Headphones size={10} />
                  ) : (
                    <Video size={10} />
                  )}
                  {track.mediaType === "AUDIO" ? "Audio" : "Video"}
                </p>
              </div>

              <Play
                size={16}
                fill="currentColor"
                className="shrink-0 text-[var(--accent)] opacity-0 transition-opacity group-hover:opacity-100"
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
