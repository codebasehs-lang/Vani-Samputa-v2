"use client"

import { usePlayerStore, type Track } from "@/store/playerStore"
import { formatDuration } from "@/lib/duration"
import { Headphones, History, Pause, Play, PlayCircle } from "lucide-react"
import Link from "next/link"
import { SectionHeading } from "./SectionHeading"

export function ContinueListening() {
  const { currentTrack, positionS, duration: liveDuration, trackProgress, pause, resume, isPlaying } = usePlayerStore()

  if (!currentTrack) return null

  // `duration` isn't persisted across reloads, so fall back to the saved per-track progress
  const duration = liveDuration || trackProgress[currentTrack.id]?.duration || currentTrack.duration || 0
  const percent = duration > 0 ? Math.min(100, Math.round((positionS / duration) * 100)) : 0
  const remaining = duration > 0 ? Math.max(0, duration - positionS) : 0
  const isAudio = currentTrack.mediaType === "AUDIO"
  const playlistHref = currentTrack.playlistId
    ? `/${isAudio ? "audio" : "video"}/playlist/${currentTrack.playlistId}${isAudio ? "" : `?video=${encodeURIComponent(currentTrack.id)}`}`
    : null

  return (
    <section className="px-4 py-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow="Pick up where you left off" title="Continue Listening" icon={History} />

        <div className="now-card" data-playing={isPlaying ? "true" : undefined}>
          <div className="now-card-glow" aria-hidden="true" />
          {playlistHref ? (
            <Link
              href={playlistHref}
              onClick={resume}
              className="relative flex min-w-0 flex-1 items-center gap-4 text-left sm:gap-5"
              aria-label={`Open playlist for ${currentTrack.title}`}
            >
              <TrackInfo track={currentTrack} isAudio={isAudio} isPlaying={isPlaying} />
            </Link>
          ) : (
            <div className="relative flex min-w-0 flex-1 items-center gap-4 sm:gap-5">
              <TrackInfo track={currentTrack} isAudio={isAudio} isPlaying={isPlaying} />
            </div>
          )}

          <div className="relative mt-4 flex items-center gap-4 sm:mt-0 sm:w-[44%] sm:shrink-0">
            <div className="min-w-0 flex-1">
              <div className="now-progress" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Listening progress">
                <div className="now-progress-fill" style={{ width: `${percent}%` }} />
              </div>
              <div className="mt-2 flex justify-between text-[11px] font-medium tabular-nums">
                <span className="text-[#f5ecd7]">
                  {formatDuration(positionS)}
                  {duration > 0 && <span className="text-[#f5ecd7]/55"> / {formatDuration(duration)}</span>}
                </span>
                <span className="text-[#e9c977]">
                  {duration > 0 ? `${formatDuration(remaining)} left · ${percent}%` : `${percent}%`}
                </span>
              </div>
            </div>

            <button
              onClick={() => (isPlaying ? pause() : resume())}
              className="now-play"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

function TrackInfo({ track, isAudio, isPlaying }: { track: Track; isAudio: boolean; isPlaying: boolean }) {
  const TypeIcon = isAudio ? Headphones : PlayCircle
  return (
    <>
      <div className="now-thumb">
        {track.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={track.thumbnail} alt="" className="h-full w-full object-cover" />
        ) : (
          <TypeIcon size={28} className="text-[#e9c977]" />
        )}
        {isPlaying && (
          <span className="now-eq" aria-hidden="true">
            <i /><i /><i /><i />
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <span className="now-pill">
          <TypeIcon size={11} />
          {isPlaying ? "Now playing" : isAudio ? "Audio lecture" : "Video lecture"}
        </span>
        <p className="mt-1.5 line-clamp-2 font-serif text-base font-semibold leading-snug text-white sm:text-lg">
          {track.title}
        </p>
      </div>
    </>
  )
}
