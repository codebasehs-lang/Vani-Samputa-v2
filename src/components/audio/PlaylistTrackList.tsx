"use client"

import { usePlayerStore, type Track } from "@/store/playerStore"
import { OfflineDownloadButton } from "@/components/audio/OfflineDownloadButton"
import { FavoriteButton } from "@/components/FavoriteButton"
import { Play, Pause, Plus } from "lucide-react"

type Lecture = {
  id: string
  title: string
  url: string
  duration: number | null
  mediaType: "AUDIO" | "VIDEO"
  thumbnail: string | null
  language: string
  transcript?: string | null
}

function formatDuration(s: number | null) {
  if (!s) return ""
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  return h > 0
    ? `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`
    : `${m}:${sec.toString().padStart(2, "0")}`
}

export function PlaylistTrackList({
  lectures,
  playlistId,
}: {
  lectures: Lecture[]
  playlistId: string
}) {
  const { play, addToQueue, currentTrack, isPlaying, pause, resume } = usePlayerStore()

  function toTrack(l: Lecture): Track {
    return {
      id: l.id,
      title: l.title,
      url: l.url,
      mediaType: l.mediaType as "AUDIO" | "VIDEO",
      duration: l.duration ?? undefined,
      thumbnail: l.thumbnail ?? undefined,
      playlistId,
    }
  }

  function playAll() {
    if (!lectures.length) return
    play(toTrack(lectures[0]))
    lectures.slice(1).forEach((l) => addToQueue(toTrack(l)))
  }

  if (lectures.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-[var(--muted)]">
        No lectures in this playlist yet.
      </p>
    )
  }

  return (
    <div>
      {/* Play all */}
      <button onClick={playAll} className="btn-accent mb-4 inline-flex items-center gap-2 px-5 py-2 text-sm">
        <Play size={14} fill="currentColor" /> Play All
      </button>

      <div className="flex flex-col divide-y divide-[var(--border)]">
        {lectures.map((lecture, idx) => {
          const isActive = currentTrack?.id === lecture.id
          const track = toTrack(lecture)

          return (
            <div
              key={lecture.id}
              className={`group flex items-center gap-3 py-3 ${isActive ? "text-[var(--accent)]" : "text-[var(--foreground)]"}`}
            >
              {/* Track number / play indicator */}
              <div className="flex w-6 shrink-0 justify-center">
                {isActive ? (
                  <button onClick={() => (isPlaying ? pause() : resume())} aria-label="Play/Pause">
                    {isPlaying
                      ? <Pause size={16} fill="currentColor" />
                      : <Play size={16} fill="currentColor" />}
                  </button>
                ) : (
                  <span className="text-xs text-[var(--muted)] group-hover:hidden">{idx + 1}</span>
                )}
                {!isActive && (
                  <button
                    onClick={() => play(track)}
                    aria-label={`Play ${lecture.title}`}
                    className="hidden group-hover:block text-[var(--accent)]"
                  >
                    <Play size={16} fill="currentColor" />
                  </button>
                )}
              </div>

              {/* Title */}
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-medium ${isActive ? "text-[var(--accent)]" : ""}`}>
                  {lecture.title}
                </p>
                {lecture.duration && (
                  <p className="text-[10px] text-[var(--muted)]">{formatDuration(lecture.duration)}</p>
                )}
              </div>

              {/* Add to queue */}
              <button
                onClick={() => addToQueue(track)}
                className="shrink-0 p-1 text-[var(--muted)] opacity-0 transition-opacity group-hover:opacity-100 hover:text-[var(--foreground)]"
                aria-label="Add to queue"
              >
                <Plus size={16} />
              </button>
              <FavoriteButton lectureId={lecture.id} />
              {lecture.mediaType === "AUDIO" && (
                <OfflineDownloadButton url={lecture.url} title={lecture.title} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
