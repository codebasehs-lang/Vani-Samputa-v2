"use client"

import { useSyncExternalStore } from "react"
import { usePlayerStore } from "@/store/playerStore"
import { formatDuration } from "@/lib/duration"
import { Clock3, Headphones, Play, PlayCircle } from "lucide-react"
import { SectionHeading } from "./SectionHeading"
import { LectureThumbnail } from "@/components/LectureThumbnail"

const noopSubscribe = () => () => {}

export function RecentlyPlayed() {
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false)
  const { history, currentTrack, trackProgress, play } = usePlayerStore()

  if (!mounted) return null

  // exclude the currently-playing track (it belongs in ContinueListening)
  const recent = history.filter((t) => t.id !== currentTrack?.id).slice(0, 6)

  if (!recent.length) return null

  return (
    <section className="px-4 py-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow="Your journey" title="Recently Played" icon={Clock3} />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {recent.map((track) => {
            const progress = trackProgress[track.id]
            const positionS = progress?.positionS ?? 0
            const duration = progress?.duration || track.duration || 0
            const percent = duration > 0 ? Math.min(100, Math.round((positionS / duration) * 100)) : 0
            const isAudio = track.mediaType === "AUDIO"
            const TypeIcon = isAudio ? Headphones : PlayCircle

            return (
              <button
                key={track.id}
                onClick={() => play(track, positionS)}
                aria-label={`Resume ${track.title} from ${formatDuration(positionS)}`}
                className="recent-card group"
              >
                <div className="recent-thumb">
                  <LectureThumbnail src={track.thumbnail} alt="" className="h-full w-full object-cover" loading="lazy" />
                  <span className="recent-thumb-play" aria-hidden="true">
                    <Play size={14} fill="currentColor" className="ml-0.5" />
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--foreground)]">{track.title}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="recent-type" data-type={isAudio ? "audio" : "video"}>
                      <TypeIcon size={10} />
                      {isAudio ? "Audio" : "Video"}
                    </span>
                    <span className="text-[10.5px] font-medium tabular-nums text-[var(--muted)]">
                      {formatDuration(positionS)}
                      {duration > 0 && ` · ${percent}%`}
                    </span>
                  </div>
                  {duration > 0 && (
                    <div className="recent-progress">
                      <div className="recent-progress-fill" style={{ width: `${percent}%` }} />
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
