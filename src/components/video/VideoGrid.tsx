"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { usePlayerStore, type Track } from "@/store/playerStore"
import { YouTubePlayer } from "@/components/player/YouTubePlayer"
import { formatDuration } from "@/lib/duration"
import { Play, PictureInPicture, Volume2, VolumeX, FileText, ChevronDown, ChevronUp } from "lucide-react"

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

type TranscriptLine = { timeS: number | null; text: string }

// Lines optionally start with a "[MM:SS]" or "MM:SS" marker for seeking.
function parseTranscript(transcript: string): TranscriptLine[] {
  return transcript
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^\[?(\d{1,3}):(\d{2})\]?\s*(.*)$/)
      return match
        ? { timeS: Number(match[1]) * 60 + Number(match[2]), text: match[3] }
        : { timeS: null, text: line }
    })
}

export function VideoGrid({ lectures, playlistId, initialVideoId }: { lectures: Lecture[]; playlistId: string; initialVideoId?: string }) {
  const { play, seek, setPosition, setVideoProgress, playNext, videoProgressMap, currentTrack, setVideoMini } =
    usePlayerStore()
  // Start null on both server and client — the persisted store rehydrates from
  // localStorage only on the client, so reading it during the initial render
  // would mismatch the SSR-ed markup and trigger a hydration error.
  const [activeId, setActiveId] = useState<string | null>(
    initialVideoId && lectures.some((lecture) => lecture.id === initialVideoId) ? initialVideoId : null
  )
  const [audioOnly, setAudioOnly] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)

  // Collapse the transcript panel again whenever the active video changes.
  useEffect(() => {
    setShowTranscript(false)
  }, [activeId])

  // Being on this page means the video is "open" again — so leaving it (e.g. to
  // Home) should show the floating PiP player, even if it was closed earlier.
  useEffect(() => {
    if (activeId && currentTrack?.id === activeId) {
      setVideoMini(true)
    }
  }, [activeId, currentTrack?.id, setVideoMini])

  // Resume the previously-active video for this playlist after mount (client-only).
  useEffect(() => {
    const track = usePlayerStore.getState().currentTrack
    if (track?.mediaType === "VIDEO" && track.playlistId === playlistId && lectures.some((l) => l.id === track.id)) {
      setActiveId(track.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  const transcriptLines = useMemo(
    () => (activeLecture?.transcript ? parseTranscript(activeLecture.transcript) : []),
    [activeLecture?.transcript]
  )

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
      {activeId && activeLecture ? (
        <div className="lg:grid lg:grid-cols-3 lg:gap-6 lg:items-start">
          {/* Main column: player, details, transcript */}
          <div className="lg:col-span-2">
            <div
              className="yt-iframe relative w-full overflow-hidden rounded-2xl bg-black shadow-xl"
              style={audioOnly ? { opacity: 0, width: 1, height: 1, overflow: "hidden" } : {}}
            >
              <YouTubePlayer
                key={activeLecture.id}
                videoId={activeLecture.url}
                startSeconds={activeLecture.id === currentTrack?.id ? "live" : 0}
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

            {/* Title + channel row + actions */}
            <div className="mt-3">
              <h1 className="text-lg font-semibold text-[var(--foreground)] sm:text-xl">
                {activeLecture.title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/video-icon.jpg"
                      alt="HH Haladhara Svāmī"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">HH Haladhara Svāmī</p>
                    <p className="text-xs text-[var(--muted)]">
                      {activeLecture.language}
                      {activeLecture.duration ? ` · ${formatDuration(activeLecture.duration)}` : ""}
                    </p>
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-2">
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
            </div>

            {/* Transcript — replaces a comments section */}
            <div className="surface-panel mt-5 p-4">
              <button
                onClick={() => setShowTranscript((v) => !v)}
                className="flex w-full items-center justify-between gap-2 text-left"
                aria-expanded={showTranscript}
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                  <FileText size={16} /> Transcript
                </span>
                {showTranscript ? (
                  <ChevronUp size={16} className="text-[var(--muted)]" />
                ) : (
                  <ChevronDown size={16} className="text-[var(--muted)]" />
                )}
              </button>

              {showTranscript && (
                transcriptLines.length > 0 ? (
                  <div className="mt-3 max-h-96 space-y-0.5 overflow-y-auto pr-1">
                    {transcriptLines.map((line, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => line.timeS !== null && seek(line.timeS)}
                        disabled={line.timeS === null}
                        className="flex w-full items-start gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-[var(--accent)]/10 disabled:cursor-default disabled:hover:bg-transparent"
                      >
                        {line.timeS !== null && (
                          <span className="mt-0.5 shrink-0 text-xs font-semibold text-[var(--accent)]">
                            {formatDuration(line.timeS)}
                          </span>
                        )}
                        <span className="text-[var(--muted)]">{line.text}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-[var(--muted)]">No transcript available for this lecture yet.</p>
                )
              )}
            </div>
          </div>

          {/* Sidebar: up next in this playlist */}
          <aside className="mt-6 lg:col-span-1 lg:mt-0">
            <p className="mb-2 text-sm font-semibold text-[var(--foreground)]">Up next in this playlist</p>
            <div className="flex flex-col gap-2">
              {lectures.map((lecture) => {
                const thumb = lecture.thumbnail ?? `https://img.youtube.com/vi/${lecture.url}/mqdefault.jpg`
                const progress = videoProgressMap[lecture.id] ?? 0
                const isActive = activeId === lecture.id

                return (
                  <button
                    key={lecture.id}
                    onClick={() => selectVideo(lecture)}
                    data-active={isActive}
                    className="surface-card group flex gap-2.5 overflow-hidden p-2 text-left"
                  >
                    <div className="relative h-[70px] w-[124px] shrink-0 overflow-hidden rounded-lg">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={thumb}
                        alt={lecture.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                      {lecture.duration != null && (
                        <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[10px] font-medium text-white">
                          {formatDuration(lecture.duration)}
                        </span>
                      )}
                      {progress > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
                          <div
                            className="h-full"
                            style={{ width: `${progress}%`, background: "var(--accent)" }}
                          />
                        </div>
                      )}
                    </div>
                    <p
                      className={`line-clamp-3 text-xs font-medium ${isActive ? "text-[var(--accent)]" : "text-[var(--foreground)]"}`}
                    >
                      {lecture.title}
                    </p>
                  </button>
                )
              })}
            </div>
          </aside>
        </div>
      ) : (
        /* Browse grid — nothing selected yet */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lectures.map((lecture) => {
            const thumb = lecture.thumbnail ?? `https://img.youtube.com/vi/${lecture.url}/mqdefault.jpg`
            const progress = videoProgressMap[lecture.id] ?? 0

            return (
              <button
                key={lecture.id}
                onClick={() => selectVideo(lecture)}
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
                  {/* Duration badge */}
                  {lecture.duration != null && (
                    <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[10px] font-medium text-white">
                      {formatDuration(lecture.duration)}
                    </span>
                  )}
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
                  <p className="text-sm font-medium line-clamp-2 text-[var(--foreground)]">
                    {lecture.title}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

