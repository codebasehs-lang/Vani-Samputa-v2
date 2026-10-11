import Link from "next/link"
import { Headphones, ListMusic, Play, PlayCircle, Search } from "lucide-react"
import { PlaylistFavoriteButton } from "@/components/PlaylistFavoriteButton"

export type BrowseItem = {
  id: string
  title: string
  href: string
  cover: string | null
  /** Custom covers are often square art: show them whole rather than cropped. */
  contain: boolean
  count: number
  tags: string[]
}

type Category = { id: string; slug: string; name: string }

export function PlaylistBrowser({
  base,
  mediaType,
  items,
  categories,
  tag,
  q,
}: {
  base: string
  mediaType: "AUDIO" | "VIDEO"
  items: BrowseItem[]
  categories: Category[]
  tag?: string
  q?: string
}) {
  const isAudio = mediaType === "AUDIO"
  const TypeIcon = isAudio ? Headphones : PlayCircle
  const unit = isAudio ? "lecture" : "video"
  const tagHref = (slug?: string) => {
    const params = new URLSearchParams()
    if (slug) params.set("tag", slug)
    if (q) params.set("q", q)
    const s = params.toString()
    return s ? `${base}?${s}` : base
  }

  return (
    <>
      <div className="chip-row -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden">
        <Link href={tagHref()} data-active={!tag} className="pill-filter">All</Link>
        {categories.map((c) => (
          <Link key={c.id} href={tagHref(c.slug)} data-active={tag === c.slug} className="pill-filter">
            {c.name}
          </Link>
        ))}
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_250px] lg:items-start lg:gap-10">
        <div className="min-w-0">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <form action={base} method="GET" className="browse-search w-full sm:w-auto sm:flex-1">
              {tag && <input type="hidden" name="tag" value={tag} />}
              <Search size={16} aria-hidden="true" />
              <input type="search" name="q" defaultValue={q ?? ""} placeholder="Search playlists…" aria-label="Search playlists" />
              <button type="submit" className="btn-gold">Search</button>
            </form>
            <p className="text-xs font-semibold text-[var(--muted)]">
              {items.length} playlist{items.length !== 1 ? "s" : ""}
              {q && <> for “<span className="text-[var(--foreground)]">{q}</span>”</>}
            </p>
          </div>

          {items.length === 0 ? (
            <div className="empty-state flex flex-col items-center gap-3 px-6 py-16 text-center">
              <span className="lecture-icon"><ListMusic size={18} /></span>
              <p className="text-sm">No playlists found.</p>
              {(tag || q) && <Link href={base} className="pill-filter">Clear filters</Link>}
            </div>
          ) : (
            <div className="playlist-grid">
              {items.map((pl) => (
                <div key={pl.id} className="playlist-card group">
                  <Link href={pl.href} className="block">
                    <div className="playlist-cover">
                      {pl.cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={pl.cover}
                          alt=""
                          className={`playlist-cover-img ${pl.contain ? "object-contain" : "object-cover"}`}
                          loading="lazy"
                        />
                      ) : (
                        <TypeIcon size={40} className="text-[#e9c977]" />
                      )}
                      <span className="playlist-badge">
                        <TypeIcon size={11} />
                        {isAudio ? "Audio" : "Video"}
                      </span>
                      <span className="playlist-count">
                        <ListMusic size={11} />
                        {pl.count}
                      </span>
                      <span className="playlist-play" aria-hidden="true">
                        <Play size={16} fill="currentColor" className="ml-0.5" />
                      </span>
                    </div>
                    <div className="px-3.5 pb-3.5 pr-12 pt-3">
                      <p className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-[var(--foreground)]">
                        {pl.title}
                      </p>
                      <p className="mt-1.5 truncate text-[11px] text-[var(--muted)]">
                        {pl.count} {unit}{pl.count !== 1 ? "s" : ""}
                        {pl.tags.length > 0 && ` · ${pl.tags.join(", ")}`}
                      </p>
                    </div>
                  </Link>
                  <div className="absolute bottom-2.5 right-2">
                    <PlaylistFavoriteButton playlistId={pl.id} compact />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="hidden lg:sticky lg:top-24 lg:block">
          <div className="side-filter">
            <p className="section-eyebrow mb-3 px-1">Filter by category</p>
            <nav className="flex flex-col gap-0.5">
              <Link href={tagHref()} data-active={!tag} className="side-filter-link">All</Link>
              {categories.map((c) => (
                <Link key={c.id} href={tagHref(c.slug)} data-active={tag === c.slug} className="side-filter-link">
                  {c.name}
                </Link>
              ))}
            </nav>
          </div>
        </aside>
      </div>
    </>
  )
}
