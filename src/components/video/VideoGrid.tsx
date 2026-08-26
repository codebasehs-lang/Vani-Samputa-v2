"use client"

import { useState, useCallback } from "react"
import { usePlayerStore, type Track } from "@/store/playerStore"
import { YouTubePlayer } from "@/components/player/YouTubePlayer"
import { Play, PictureInPicture, Volume2, VolumeX } from "lucide-react"

type Lecture = {
  id: string
  title: string
  url: string
  duration: number | null
  mediaType: "AUDIO" | "VIDEO"
  thumbnail: string | null
  language: string
}

export function VideoGrid({ lectures, playlistId }: { lectures: Lecture[]; playlistId: string }) {
  const { play, setPosition, setVideoProgress, playNext, videoProgressMap, currentTrack } =
    usePlayerStore()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [audioOnly, setAudioOnly] = useState(false)

  function toTrack(l: Lecture): Track {
    return {
      id: l.id,
      title: l.title,
      url: l.url,
      mediaType: "VIDEO",
      duration: l.duration ?? undefined,
      thumbnail: l.thumbnail ?? `https://img.youtube.com/vi/${l.url}/mqdefault.jpg`,
      playlistId,
    }
  }

  function selectVideo(lecture: Lecture) {
    setActiveId(lecture.id)
    play(toTrack(lecture))
    // scroll to player
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const activeLecture = lectures.find((l) => l.id === activeId)

  const handlePosition = useCallback(
    (s: number) => {
      setPosition(s)
      if (activeLecture) {
        const pct = activeLecture.duration ? Math.round((s / activeLecture.duration) * 100) : 0
        setVideoProgress(activeLecture.id, pct)
      }
    },
    [activeLecture, setPosition, setVideoProgress]
  )

  async function requestPiP() {
    // Access the internal video element of the YT iframe
    const iframe = document.querySelector<HTMLIFrameElement>(".yt-iframe iframe, iframe[src*='youtube']")
    try {
      const video = iframe?.contentDocument?.querySelector("video")
      await video?.requestPictureInPicture()
    } catch {
      // PiP may be blocked by cross-origin; ignore
    }
  }

  return (
    <div>
      {/* Inline player */}
      {activeId && activeLecture && (
        <div className="mb-8">
          <div
            className="yt-iframe relative w-full overflow-hidden rounded-2xl shadow-xl"
            style={audioOnly ? { opacity: 0, width: 1, height: 1, overflow: "hidden" } : {}}
          >
            <YouTubePlayer
              videoId={activeLecture.url}
              autoplay
              onPositionUpdate={handlePosition}
              onEnded={playNext}
            />
          </div>

          {audioOnly && (
            <div
              className="flex h-32 items-center justify-center rounded-2xl"
              style={{ background: "linear-gradient(135deg, #1a1a3e 0%, #2d2d5e 100%)" }}
            >
              <div className="text-center">
                <p className="text-2xl">🎙️</p>
                <p className="mt-1 text-xs text-white/60">Audio-only mode</p>
                <p className="mt-0.5 text-xs font-medium text-[#FFD700]">{activeLecture.title}</p>
              </div>
            </div>
          )}

          {/* Video controls row */}
          <div className="mt-3 flex items-center gap-3">
            <h2 className="flex-1 text-base font-semibold text-[var(--foreground)]">
              {activeLecture.title}
            </h2>
            <button
              onClick={() => setAudioOnly((v) => !v)}
              className="chip flex items-center gap-1.5 px-3 py-1.5 text-xs"
              aria-label="Toggle audio-only mode"
            >
              {audioOnly ? <VolumeX size={14} /> : <Volume2 size={14} />}
              {audioOnly ? "Show Video" : "Audio Only"}
            </button>
            <button
              onClick={requestPiP}
              className="chip flex items-center gap-1.5 px-3 py-1.5 text-xs"
              aria-label="Picture in Picture"
            >
              <PictureInPicture size={14} /> PiP
            </button>
          </div>
        </div>
      )}

      {/* Video grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {lectures.map((lecture) => {
          const thumb = `https://img.youtube.com/vi/${lecture.url}/mqdefault.jpg`
          const progress = videoProgressMap[lecture.id] ?? 0
          const isActive = activeId === lecture.id

          return (
            <button
              key={lecture.id}
              onClick={() => selectVideo(lecture)}
              data-active={isActive}
              className="surface-card group overflow-hidden text-left transition-transform hover:-translate-y-1"
            >
              {/* Thumbnail */}
              <div className="relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumb}
                  alt={lecture.title}
                  className="w-full aspect-video object-cover"
                  loading="lazy"
                />
                {/* Play overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full"
                    style={{ background: "var(--accent)" }}
                  >
                    <Play size={18} fill="currentColor" className="text-[var(--accent-fg)]" />
                  </div>
                </div>
                {/* Progress bar */}
                {progress > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
                    <div
                      className="h-full"
                      style={{ width: `${progress}%`, background: "var(--accent)" }}
                    />
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className={`text-sm font-medium line-clamp-2 ${isActive ? "text-[var(--accent)]" : "text-[var(--foreground)]"}`}>
                  {lecture.title}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
