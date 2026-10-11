import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import type { Metadata } from "next"
import { Headphones, ListMusic } from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import { PlaylistBrowser, type BrowseItem } from "@/components/browse/PlaylistBrowser"

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
  { params, searchParams }: { params: Promise<{ language: string }>; searchParams: Promise<{ tag?: string; q?: string }> }
) {
  const { language } = await params
  const { tag, q } = await searchParams
  const lang = language.toLowerCase() as Lang
  if (!VALID_LANGUAGES.includes(lang)) notFound()

  const { label, native } = DISPLAY[lang]
  const dbLanguage = label  // stored as "Odia", "Hindi" etc.

  const [playlists, categories] = await Promise.all([prisma.playlist.findMany({
    where: {
      language: dbLanguage,
      mediaType: "AUDIO",
      lectures: { some: {} },
      ...(tag ? { categories: { some: { slug: tag } } } : {}),
      ...(q ? { title: { contains: q } } : {}),
    },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    include: { _count: { select: { lectures: true } }, categories: { where: { active: true }, orderBy: { name: "asc" } } },
  }), prisma.category.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] })])

  // Sort by each playlist's most recent lecture date, newest first.
  const latestDates = await prisma.lecture.groupBy({
    by: ["playlistId"],
    where: { playlistId: { in: playlists.map((pl) => pl.id) } },
    _max: { lectureDate: true },
  })
  const latestDateByPlaylist = new Map(latestDates.map((row) => [row.playlistId, row._max.lectureDate]))
  playlists.sort((a, b) => (latestDateByPlaylist.get(b.id)?.getTime() ?? 0) - (latestDateByPlaylist.get(a.id)?.getTime() ?? 0))


  const items: BrowseItem[] = playlists.map((pl) => ({
    id: pl.id,
    title: pl.title,
    href: `/audio/playlist/${pl.id}`,
    cover: pl.coverUrl,
    contain: true,
    count: pl._count.lectures,
    tags: pl.categories.map((c) => c.name),
  }))

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-10 lg:px-8">
      <PageHeader
        icon={Headphones}
        eyebrow={`${native} · Audio`}
        title={`${label} Lectures`}
        description={`Spiritual talks by HH Haladhara Svāmī Mahārāja in ${label}.`}
        crumbs={[{ label: "Home", href: "/" }, { label: "Audio", href: "/audio" }, { label }]}
        meta={[{ label: `${playlists.length} playlist${playlists.length !== 1 ? "s" : ""}`, icon: ListMusic }]}
      />
      <PlaylistBrowser base={`/audio/${lang}`} mediaType="AUDIO" items={items} categories={categories} tag={tag} q={q} />
    </div>
  )
}
