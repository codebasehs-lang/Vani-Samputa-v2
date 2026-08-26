import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import type { Metadata } from "next"
import { PageHeader } from "@/components/PageHeader"
import { PlaylistFavoriteButton } from "@/components/PlaylistFavoriteButton"

const VALID_LANGUAGES = ["odia", "hindi", "english"] as const
type Lang = (typeof VALID_LANGUAGES)[number]

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
  return { title: info ? `${info.label} Audio` : "Audio" }
}

export default async function LanguageAudioPage(
  { params, searchParams }: { params: Promise<{ language: string }>; searchParams: Promise<{ tag?: string }> }
) {
  const { language } = await params
  const { tag } = await searchParams
  const lang = language.toLowerCase() as Lang
  if (!VALID_LANGUAGES.includes(lang)) notFound()

  const { label, native } = DISPLAY[lang]
  const dbLanguage = label  // stored as "Odia", "Hindi" etc.

  const [playlists, categories] = await Promise.all([prisma.playlist.findMany({
    where: { language: dbLanguage, mediaType: "AUDIO", ...(tag ? { categories: { some: { slug: tag } } } : {}) },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    include: { _count: { select: { lectures: true } }, categories: { where: { active: true }, orderBy: { name: "asc" } } },
  }), prisma.category.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] })])

  // Group by category
  const grouped = playlists.reduce<Record<string, typeof playlists>>((acc, pl) => {
    const names = pl.categories.map((category) => category.name)
    for (const name of names.length ? names : [pl.category]) (acc[name] ??= []).push(pl)
    return acc
  }, {})

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {/* Breadcrumb */}
      <p className="mb-4 text-xs text-[var(--muted)]">
        <Link href="/audio" className="hover:underline">Audio</Link>
        {" / "}
        <span>{label}</span>
      </p>

      <PageHeader
        title={`${label} — ${native}`}
        description={`${playlists.length} playlist${playlists.length !== 1 ? "s" : ""}`}
      />
      <div className="mb-8 flex flex-wrap gap-2">
        <Link href={`/audio/${lang}`} data-active={!tag} className="chip px-3 py-1.5 text-xs">All</Link>
        {categories.map((category) => (
          <Link key={category.id} href={`/audio/${lang}?tag=${category.slug}`} data-active={tag === category.slug} className="chip px-3 py-1.5 text-xs">
            {category.name}
          </Link>
        ))}
      </div>

      {playlists.length === 0 && (
        <div className="empty-state py-16 text-center text-sm text-[var(--muted)]">
          No playlists yet — content will appear after import.
        </div>
      )}

      {Object.entries(grouped).map(([category, items]) => (
        <section key={category} className="mb-10">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
            {category}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((pl) => (
              <div
                key={pl.id}
                className="surface-card group relative overflow-hidden transition-transform hover:-translate-y-1"
              >
                <Link href={`/audio/playlist/${pl.id}`} className="block">
                  <div
                    className="flex h-28 items-center justify-center text-4xl"
                    style={{ background: "linear-gradient(135deg, #1a1a3e 0%, #2d2d5e 100%)" }}
                  >
                    🎙️
                  </div>
                  <div className="p-3 pr-11">
                    <p className="truncate text-sm font-semibold text-[var(--foreground)]">{pl.title}</p>
                    <p className="mt-0.5 text-[10px] text-[var(--muted)]">
                      {pl._count.lectures} lecture{pl._count.lectures !== 1 ? "s" : ""}
                    </p>
                  </div>
                </Link>
                <div className="absolute right-2 bottom-2">
                  <PlaylistFavoriteButton playlistId={pl.id} compact />
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
