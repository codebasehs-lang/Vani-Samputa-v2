import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import type { Metadata } from "next"
import { ListVideo, Video } from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import { PlaylistBrowser, type BrowseItem } from "@/components/browse/PlaylistBrowser"

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


  const items: BrowseItem[] = playlists.map((pl) => ({
    id: pl.id,
    title: pl.title,
    href: `/video/playlist/${pl.id}${pl.lectures[0] ? `?video=${pl.lectures[0].id}` : ""}`,
    cover: pl.lectures[0]?.thumbnail ?? (pl.lectures[0]?.url ? `https://img.youtube.com/vi/${pl.lectures[0].url}/mqdefault.jpg` : null),
    contain: false,
    count: pl._count.lectures,
    tags: pl.categories.map((c) => c.name),
  }))

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-10 lg:px-8">
      <PageHeader
        icon={Video}
        eyebrow={`${native} · Video`}
        title={`${label} Lectures`}
        description={`Video lectures by HH Haladhara Svāmī Mahārāja in ${label}.`}
        crumbs={[{ label: "Home", href: "/" }, { label: "Video", href: "/video" }, { label }]}
        meta={[{ label: `${playlists.length} playlist${playlists.length !== 1 ? "s" : ""}`, icon: ListVideo }]}
      />
      <PlaylistBrowser base={`/video/${lang}`} mediaType="VIDEO" items={items} categories={categories} tag={tag} q={q} />
    </div>
  )
}
