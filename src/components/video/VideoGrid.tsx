"use client"

import { ShareButton } from "@/components/ShareButton"
import { LectureThumbnail } from "@/components/LectureThumbnail"
import { extractYouTubeId, youtubeThumbnailUrl } from "@/lib/youtube"
import { formatDuration } from "@/lib/duration"
import { isDocumentPiPSupported, registerVideoDock, requestDocumentPiP } from "@/lib/videoDock"
import { usePlayerStore, type Track } from "@/store/playerStore"
import { ChevronDown, ChevronUp, FileText, PictureInPicture2, Play, Volume2, VolumeX } from "lucide-react"
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"

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

const noopSubscribe = () => () => {}

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
  const { playPlaylist, seek, videoProgressMap, currentTrack, setVideoMini } =
    usePlayerStore()
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false)
  const [selectedId, setSelectedId] = useState<string | null>(
    initialVideoId && lectures.some((lecture) => lecture.id === initialVideoId) ? initialVideoId : null
  )
  const activeId = (
    mounted && currentTrack?.mediaType === "VIDEO" && currentTrack.playlistId === playlistId &&
    lectures.some((lecture) => lecture.id === currentTrack.id) ? currentTrack.id : null
  ) ?? selectedId
  const [audioOnly, setAudioOnly] = useState(false)
  const [transcriptVideoId, setTranscriptVideoId] = useState<string | null>(null)
  const showTranscript = activeId !== null && transcriptVideoId === activeId
  const dockRef = useRef<HTMLDivElement>(null)

  // Being on this page means the video is "open" again — so leaving it (e.g. to
  // Home) should show the floating PiP player, even if it was closed earlier.
  useEffect(() => {
    if (activeId && currentTrack?.id === activeId) {
      setVideoMini(true)
    }
  }, [activeId, currentTrack?.id, setVideoMini])

  // Arriving via a deep link (?video=...) for a lecture that isn't already the
  // globally active track — register it as "now playing" so the dock/mini-player
  // and position tracking stay in sync with what actually renders here.
  useEffect(() => {
    if (!initialVideoId) return
    const lecture = lectures.find((l) => l.id === initialVideoId)
    if (lecture) {
      const state = usePlayerStore.getState()
      playPlaylist(
        lectures.map(toTrack),
        lecture.id,
        state.currentTrack?.id === lecture.id ? state.positionS : state.trackProgress[lecture.id]?.positionS ?? 0,
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function toTrack(l: Lecture): Track {
    return {
      id: l.id,
      title: l.title,
      url: extractYouTubeId(l.url),
      mediaType: "VIDEO",
      duration: l.duration ?? undefined,
      thumbnail: l.thumbnail || youtubeThumbnailUrl(l.url),
      playlistId,
    }
  }

  function selectVideo(lecture: Lecture) {
    setSelectedId(lecture.id)
    setTranscriptVideoId(null)
    const state = usePlayerStore.getState()
    if (state.currentTrack?.id === lecture.id) {
      state.resume()
    } else {
      playPlaylist(lectures.map(toTrack), lecture.id, state.trackProgress[lecture.id]?.positionS ?? 0)
    }
    // scroll to player
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const activeLecture = lectures.find((l) => l.id === activeId)
  // The dock can only host the player once this lecture is genuinely the
  // globally active track — otherwise a different video may already be
  // playing (e.g. floating) elsewhere and must keep that slot.
  const isActivePlayback = Boolean(activeLecture) && currentTrack?.id === activeId

  // Register this page's player slot as the current dock target whenever its
  // lecture is the active track. The shared player node gets physically moved
  // here (not recreated), so playback position and audio continue seamlessly.
  useEffect(() => {
    if (!isActivePlayback || !activeId || !dockRef.current) return
    return registerVideoDock(dockRef.current, activeId)
  }, [isActivePlayback, activeId])

  const transcriptLines = useMemo(
    () => (activeLecture?.transcript ? parseTranscript(activeLecture.transcript) : []),
    [activeLecture?.transcript]
  )

  return (
    <div>
      {activeId && activeLecture ? (
        <div className="lg:grid lg:grid-cols-3 lg:gap-6 lg:items-start">
          {/* Main column: player, details, transcript */}
          <div className="lg:col-span-2">
            <div
              className="yt-iframe video-stage-frame relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-xl"
              style={audioOnly ? { opacity: 0, width: 1, height: 1, overflow: "hidden" } : {}}
            >
              {isActivePlayback ? (
                // The shared, always-running player gets physically docked here — never
                // recreated — so switching to/from the floating mini view or a Picture-in-
                // Picture window keeps playing from the same position without a restart.
                <div ref={dockRef} className="absolute inset-0" />
              ) : (
                <button
                  type="button"
                  onClick={() => selectVideo(activeLecture)}
                  className="absolute inset-0 flex items-center justify-center"
                  aria-label={`Play ${activeLecture.title}`}
                >
                  <LectureThumbnail
                    src={activeLecture.thumbnail || youtubeThumbnailUrl(activeLecture.url)}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <span className="btn-gold relative flex h-16 w-16 items-center justify-center rounded-full">
                    <Play size={24} fill="currentColor" className="ml-1" />
                  </span>
                </button>
              )}
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
                  <ShareButton
                    href={`/video/playlist/${playlistId}?video=${encodeURIComponent(activeLecture.id)}`}
                    title={activeLecture.title}
                    className="chip flex items-center gap-1.5 px-3 py-1.5 text-xs"
                    showLabel
                  />
                  <button
                    onClick={() => setAudioOnly((v) => !v)}
                    className="chip flex items-center gap-1.5 px-3 py-1.5 text-xs"
                    aria-label="Toggle audio-only mode"
                  >
                    {audioOnly ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    {audioOnly ? "Show Video" : "Audio Only"}
                  </button>
                  {isActivePlayback && isDocumentPiPSupported() && (
                    <button
                      onClick={requestDocumentPiP}
                      className="chip flex items-center gap-1.5 px-3 py-1.5 text-xs"
                      aria-label="Picture in Picture"
                    >
                      <PictureInPicture2 size={14} /> PiP
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Transcript — replaces a comments section */}
            <div className="surface-panel mt-5 p-4">
              <button
                onClick={() => setTranscriptVideoId(showTranscript ? null : activeId)}
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
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <p className="section-eyebrow">Up next in this playlist</p>
              <span className="text-[11px] font-semibold text-[var(--muted)]">{lectures.length} videos</span>
            </div>
            <div className="flex flex-col gap-2">
              {lectures.map((lecture) => {
                const thumb = lecture.thumbnail || youtubeThumbnailUrl(lecture.url)
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
                      <LectureThumbnail
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
                            style={{ width: `${progress}%`, background: "linear-gradient(90deg, #f6d77a, #d4a437)" }}
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
        <div className="playlist-grid">
          {lectures.map((lecture) => {
            const thumb = lecture.thumbnail || youtubeThumbnailUrl(lecture.url)
            const progress = videoProgressMap[lecture.id] ?? 0

            return (
              <button
                key={lecture.id}
                onClick={() => selectVideo(lecture)}
                className="playlist-card group text-left"
              >
                {/* Thumbnail */}
                <div className="relative overflow-hidden">
                  <LectureThumbnail
                    src={thumb}
                    alt={lecture.title}
                    className="w-full aspect-video object-cover"
                    loading="lazy"
                  />
                  {/* Play overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="btn-gold flex h-11 w-11 items-center justify-center rounded-full">
                      <Play size={18} fill="currentColor" className="ml-0.5" />
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
                        style={{ width: `${progress}%`, background: "linear-gradient(90deg, #f6d77a, #d4a437)" }}
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
