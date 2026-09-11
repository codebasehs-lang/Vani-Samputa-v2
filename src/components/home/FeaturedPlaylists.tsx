type Playlist = {
  id: string
  title: string
  language: string
  category: string
  mediaType: "AUDIO" | "VIDEO"
  coverUrl: string | null
}

const LANGUAGE_FLAGS: Record<string, string> = {
  Odia: "🟠",
  Hindi: "🔵",
  English: "🟢",
  Sanskrit: "🟡",
}

export function FeaturedPlaylists({ playlists }: { playlists: Playlist[] }) {
  if (!playlists.length) {
    return (
      <section className="px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <SectionHeader title="Playlists" />
          <p className="mt-6 text-center text-sm text-[var(--muted)]">
            Playlists will appear here once content is imported.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <SectionHeader title="Playlists" href="/audio" />
        <div className="mt-5 flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
          {playlists.map((pl) => (
            <PlaylistCard key={pl.id} playlist={pl} />
          ))}
        </div>
      </div>
    </section>
  )
}

function SectionHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold text-[var(--foreground)]">{title}</h2>
      {href && (
        <a href={href} className="text-sm font-medium" style={{ color: "var(--accent)" }}>
          See all →
        </a>
      )}
    </div>
  )
}

function PlaylistCard({ playlist }: { playlist: Playlist }) {
  const flag = LANGUAGE_FLAGS[playlist.language] ?? "🔘"
  const href = playlist.mediaType === "AUDIO" ? `/audio/playlist/${playlist.id}` : `/video/playlist/${playlist.id}`

  return (
    <a
      href={href}
      className="surface-card group flex-shrink-0 w-36 sm:w-44 overflow-hidden transition-transform hover:-translate-y-1"
    >
      {/* Cover */}
      <div
        className="flex h-36 sm:h-44 items-center justify-center text-4xl"
        style={{
          background: "linear-gradient(135deg, var(--deep-blue) 0%, var(--deep-blue-mid) 100%)",
        }}
      >
        {playlist.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={playlist.coverUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : playlist.mediaType === "AUDIO" ? "🎙️" : "🎬"}
      </div>

      <div className="p-2.5">
        <p className="truncate text-xs font-semibold text-[var(--foreground)]">{playlist.title}</p>
        <p className="mt-0.5 text-[10px] text-[var(--muted)]">
          {flag} {playlist.language} · {playlist.category}
        </p>
      </div>
    </a>
  )
}
