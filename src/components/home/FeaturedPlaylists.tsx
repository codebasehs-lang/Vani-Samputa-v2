import { Headphones, ListMusic, Play, PlayCircle } from "lucide-react"
import { PlaylistScroller } from "./PlaylistScroller"
import { SectionHeading } from "./SectionHeading"

type Playlist = {
  id: string
  title: string
  language: string
  category: string
  mediaType: "AUDIO" | "VIDEO"
  coverUrl: string | null
  lectures: { thumbnail: string | null; url: string; mediaType: "AUDIO" | "VIDEO" }[]
}

const LANGUAGE_COLORS: Record<string, string> = {
  Odia: "#f97316",
  Hindi: "#3b82f6",
  English: "#22c55e",
  Sanskrit: "#eab308",
}

export function FeaturedPlaylists({ playlists }: { playlists: Playlist[] }) {
  if (!playlists.length) {
    return (
      <section className="px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <SectionHeading eyebrow="Curated series" title="Playlists" icon={ListMusic} />
          <p className="mt-6 text-center text-sm text-[var(--muted)]">
            Playlists will appear here once content is imported.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow="Curated series" title="Playlists" icon={ListMusic} href="/audio" />
        <PlaylistScroller>
          {playlists.map((pl) => (
            <PlaylistCard key={pl.id} playlist={pl} />
          ))}
        </PlaylistScroller>
      </div>
    </section>
  )
}

function PlaylistCard({ playlist }: { playlist: Playlist }) {
  const isAudio = playlist.mediaType === "AUDIO"
  const TypeIcon = isAudio ? Headphones : PlayCircle
  const dot = LANGUAGE_COLORS[playlist.language] ?? "#94a3b8"
  const href = isAudio ? `/audio/playlist/${playlist.id}` : `/video/playlist/${playlist.id}`
  const firstLecture = playlist.lectures[0]
  const videoThumbnail = firstLecture?.mediaType === "VIDEO"
    ? firstLecture.thumbnail ?? `https://img.youtube.com/vi/${firstLecture.url}/mqdefault.jpg`
    : null
  const coverUrl = playlist.coverUrl ?? videoThumbnail

  return (
    <a href={href} className="playlist-card group">
      <div className="playlist-cover">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt=""
            className={`playlist-cover-img ${playlist.coverUrl ? "object-contain" : "object-cover"}`}
            loading="lazy"
          />
        ) : (
          <TypeIcon size={40} className="text-[#e9c977]" />
        )}
        <span className="playlist-badge">
          <TypeIcon size={11} />
          {isAudio ? "Audio" : "Video"}
        </span>
        <span className="playlist-play" aria-hidden="true">
          <Play size={16} fill="currentColor" className="ml-0.5" />
        </span>
      </div>

      <div className="px-3.5 pb-3.5 pt-3">
        <p className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-[var(--foreground)]">
          {playlist.title}
        </p>
        <div className="mt-2 flex items-center gap-2 text-[11px] text-[var(--muted)]">
          <span className="playlist-lang">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: dot }} />
            {playlist.language}
          </span>
          <span className="truncate">{playlist.category}</span>
        </div>
      </div>
    </a>
  )
}
