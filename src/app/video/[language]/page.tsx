import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import type { Metadata } from "next"
import { ListMusic } from "lucide-react"
import { PlaylistFavoriteButton } from "@/components/PlaylistFavoriteButton"

const VALID = ["odia", "hindi", "english"] as const
type Lang = (typeof VALID)[number]
const DISPLAY: Record<Lang, { label: string; native: string }> = {
  odia:    { label: "Odia",    native: "ଓଡ଼ିଆ" },
  hindi:   { label: "Hindi",   native: "हिंदी" },
  english: { label: "English", native: "English" },
}

export async function generateMetadata(
  { params }: { params: Promise<{ language: string }> }
): Promise<Metadata> {
  const { language } = await params
  const info = DISPLAY[language as Lang]
  return { title: info ? `${info.label} Video` : "Video" }
}

export default async function LanguageVideoPage(
  { params, searchParams }: { params: Promise<{ language: string }>; searchParams: Promise<{ tag?: string; q?: string }> }
) {
  const { language } = await params
  const { tag, q } = await searchParams
  const lang = language.toLowerCase() as Lang
  if (!VALID.includes(lang)) notFound()

  const { label, native } = DISPLAY[lang]

  const [playlists, categories] = await Promise.all([prisma.playlist.findMany({
    where: {
      language: label,
      mediaType: "VIDEO",
      lectures: { some: {} },
      ...(tag ? { categories: { some: { slug: tag } } } : {}),
      ...(q ? { title: { contains: q } } : {}),
    },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    include: {
      _count: { select: { lectures: true } },
      categories: { where: { active: true }, orderBy: { name: "asc" } },
      lectures: { orderBy: { sortOrder: "asc" }, take: 1, select: { id: true, thumbnail: true, url: true } },
    },
  }), prisma.category.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] })])

  // Sort by each playlist's most recent lecture date, newest first.
  const latestDates = await prisma.lecture.groupBy({
    by: ["playlistId"],
    where: { playlistId: { in: playlists.map((pl) => pl.id) } },
    _max: { lectureDate: true },
  })
  const latestDateByPlaylist = new Map(latestDates.map((row) => [row.playlistId, row._max.lectureDate]))
  playlists.sort((a, b) => (latestDateByPlaylist.get(b.id)?.getTime() ?? 0) - (latestDateByPlaylist.get(a.id)?.getTime() ?? 0))

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-10 lg:px-8">
      {/* Language hero banner */}
      <div className="surface-panel relative mb-6 overflow-hidden px-5 py-4 sm:px-6 sm:py-5">
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full"
          style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--accent) 24%, transparent), transparent 70%)" }}
        />

        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <p className="text-xs text-[var(--muted)]">
              <Link href="/video" className="hover:underline">Video</Link>
              {" / "}
            </p>
            <h1 className="font-serif text-base font-bold text-[var(--foreground)]">{label}</h1>
            <span className="text-sm text-[var(--muted)]">— {native}</span>
            <span className="text-xs text-[var(--muted)]">· Video lectures by HH Haladhara Svāmī in {label}</span>
          </div>
          <div className="chip flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[var(--accent)]">
            🎬 {playlists.length} playlist{playlists.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Mobile: horizontal chip row */}
      <div className="mb-8 flex flex-wrap gap-2 lg:hidden">
        <Link href={`/video/${lang}`} data-active={!tag} className="chip px-3 py-1.5 text-xs">All</Link>
        {categories.map((category) => (
          <Link key={category.id} href={`/video/${lang}?tag=${category.slug}`} data-active={tag === category.slug} className="chip px-3 py-1.5 text-xs">
            {category.name}
          </Link>
        ))}
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_260px] lg:items-start lg:gap-10">
        <div className="min-w-0">
          <form action={`/video/${lang}`} method="GET" className="mb-6 flex max-w-md gap-2">
            {tag && <input type="hidden" name="tag" value={tag} />}
            <input
              type="search"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search playlists..."
              className="admin-input w-full px-4 py-2.5 text-sm"
            />
            <button
              type="submit"
              className="shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold text-white"
              style={{ background: "var(--accent)" }}
            >
              Search
            </button>
          </form>

          {playlists.length === 0 && (
            <div className="empty-state py-16 text-center text-sm text-[var(--muted)]">
              No playlists found.
            </div>
          )}

          {playlists.length > 0 && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {playlists.map((pl) => (
                <div
                  key={pl.id}
                  className="surface-card group relative overflow-hidden transition-transform hover:-translate-y-1"
                >
                  <Link href={`/video/playlist/${pl.id}${pl.lectures[0] ? `?video=${pl.lectures[0].id}` : ""}`} className="block">
                    <div className="relative aspect-video w-full overflow-hidden">
                      {(() => {
                        const first = pl.lectures[0]
                        const thumb = first?.thumbnail ?? (first?.url ? `https://img.youtube.com/vi/${first.url}/mqdefault.jpg` : null)
                        return thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumb}
                            alt=""
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          <div
                            className="flex h-full items-center justify-center text-5xl"
                            style={{ background: "linear-gradient(135deg, #1a1a3e 0%, #2d2d5e 100%)" }}
                          >
                            🎬
                          </div>
                        )
                      })()}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/75 px-2 py-1 text-xs font-semibold text-white">
                        <ListMusic size={12} />
                        {pl._count.lectures}
                      </div>
                    </div>
                    <div className="p-4 pr-12">
                      <p className="truncate text-base font-semibold text-[var(--foreground)]">{pl.title}</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        Playlist · {pl._count.lectures} video{pl._count.lectures !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </Link>
                  <div className="absolute right-2 top-2">
                    <PlaylistFavoriteButton playlistId={pl.id} compact />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop: sidebar filter panel */}
        <aside className="hidden lg:sticky lg:top-24 lg:block">
          <div className="surface-panel p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
              Filter by Category
            </p>
            <div className="flex flex-col gap-1">
              <Link href={`/video/${lang}`} data-active={!tag} className="filter-item block px-3 py-2 text-sm">
                All
              </Link>
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/video/${lang}?tag=${category.slug}`}
                  data-active={tag === category.slug}
                  className="filter-item block px-3 py-2 text-sm"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

