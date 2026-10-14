"use client"

import { useEffect, useSyncExternalStore } from "react"
import { usePlayerStore, type Track } from "@/store/playerStore"
import { OfflineDownloadButton } from "@/components/audio/OfflineDownloadButton"
import { FavoriteButton } from "@/components/FavoriteButton"
import { ShareButton } from "@/components/ShareButton"
import { Play, Pause, Plus } from "lucide-react"

const noopSubscribe = () => () => {}

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

function toTrack(lecture: Lecture, playlistId: string): Track {
  return {
    id: lecture.id,
    title: lecture.title,
    url: lecture.mediaType === "AUDIO" ? `/api/audio/${lecture.id}` : lecture.url,
    mediaType: lecture.mediaType,
    duration: lecture.duration ?? undefined,
    thumbnail: lecture.thumbnail ?? undefined,
    playlistId,
  }
}

export function PlaylistTrackList({
  lectures,
  playlistId,
  initialLectureId,
}: {
  lectures: Lecture[]
  playlistId: string
  initialLectureId?: string
}) {
  const { play, addToQueue, currentTrack, isPlaying, pause, resume, trackProgress } = usePlayerStore()
  // Progress lives in localStorage; only show it after hydration.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false)

  useEffect(() => {
    if (!initialLectureId) return
    const lecture = lectures.find((item) => item.id === initialLectureId)
    if (!lecture) return

    const state = usePlayerStore.getState()
    if (state.currentTrack?.id === lecture.id) state.resume()
    else state.play(toTrack(lecture, playlistId))
  }, [initialLectureId, lectures, playlistId])

  function playAll() {
    if (!lectures.length) return
    play(toTrack(lectures[0], playlistId))
    lectures.slice(1).forEach((lecture) => addToQueue(toTrack(lecture, playlistId)))
  }

  if (lectures.length === 0) {
    return (
      <p className="empty-state py-10 text-center text-sm text-[var(--muted)]">
        No lectures in this playlist yet.
      </p>
    )
  }

  const totalSeconds = lectures.reduce((sum, l) => sum + (l.duration ?? 0), 0)

  return (
    <div>
      <div className="track-toolbar">
        <button onClick={playAll} className="btn-gold inline-flex items-center gap-2 px-6 py-2.5 text-sm">
          <Play size={15} fill="currentColor" /> Play all
        </button>
        <p className="text-xs font-semibold text-[var(--muted)]">
          {lectures.length} lecture{lectures.length !== 1 ? "s" : ""}
          {totalSeconds > 0 && ` · ${formatDuration(totalSeconds)}`}
        </p>
      </div>

      <div className="track-list">
        {lectures.map((lecture, idx) => {
          const isActive = currentTrack?.id === lecture.id
          const track = toTrack(lecture, playlistId)
          const saved = mounted ? trackProgress[lecture.id] : undefined
          const total = saved?.duration || lecture.duration || 0
          const pct = saved && total ? Math.min(100, (saved.positionS / total) * 100) : 0
          const done = pct >= 97

          return (
            <div key={lecture.id} data-active={isActive} className="track-row group">
              <button
                onClick={() => (isActive ? (isPlaying ? pause() : resume()) : play(track))}
                aria-label={isActive ? (isPlaying ? "Pause" : "Resume") : `Play ${lecture.title}`}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <span className="track-num">
                  {isActive ? (
                    isPlaying
                      ? <Pause size={14} fill="currentColor" />
                      : <Play size={14} fill="currentColor" className="ml-0.5" />
                  ) : (
                    <>
                      <span className="track-num-idx">{idx + 1}</span>
                      <Play size={14} fill="currentColor" className="track-num-play ml-0.5" />
                    </>
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="track-title block truncate">{lecture.title}</span>
                  <span className="track-meta">
                    {lecture.duration ? <span>{formatDuration(lecture.duration)}</span> : null}
                    {done ? (
                      <span className="track-done">✓ Listened</span>
                    ) : pct > 1 ? (
                      <>
                        <span className="track-bar" aria-hidden="true"><span style={{ width: `${pct}%` }} /></span>
                        <span>{Math.round(pct)}%</span>
                      </>
                    ) : null}
                  </span>
                </span>
              </button>

              <div className="track-actions">
                <button
                  onClick={() => addToQueue(track)}
                  className="track-add icon-btn p-1.5"
                  aria-label="Add to queue"
                  title="Add to queue"
                >
                  <Plus size={16} />
                </button>
                <ShareButton
                  href={`/audio/playlist/${playlistId}?lecture=${encodeURIComponent(lecture.id)}`}
                  title={lecture.title}
                  className="icon-btn p-1.5"
                />
                <FavoriteButton lectureId={lecture.id} />
                {lecture.mediaType === "AUDIO" && (
                  <OfflineDownloadButton lectureId={lecture.id} title={lecture.title} />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
