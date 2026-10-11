import Link from "next/link"
import { prisma } from "@/lib/prisma"
import type { Metadata } from "next"
import { PageHeader } from "@/components/PageHeader"
import { ArrowUpRight, Headphones, Library, ListMusic, Video } from "lucide-react"

export const metadata: Metadata = { title: "Standalone Lectures" }

export default async function StandaloneLecturesPage({ searchParams }: { searchParams: Promise<{ tag?: string }> }) {
  const { tag } = await searchParams
  const [lectures, categories] = await Promise.all([
    prisma.lecture.findMany({
      where: { playlistId: null, ...(tag ? { categories: { some: { slug: tag } } } : {}) },
      include: { categories: { where: { active: true }, orderBy: { name: "asc" } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
  ])

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <PageHeader
        icon={Library}
        eyebrow="Single talks"
        title="Standalone Lectures"
        description="Individual lectures that are not part of any playlist — click to open on the original source."
        crumbs={[{ label: "Home", href: "/" }, { label: "Lectures" }]}
        meta={[{ label: `${lectures.length} lecture${lectures.length !== 1 ? "s" : ""}`, icon: ListMusic }]}
      />
      <div className="chip-row -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:flex-wrap">
        <Link href="/lectures" data-active={!tag} className="pill-filter">All</Link>
        {categories.map((category) => (
          <Link key={category.id} href={`/lectures?tag=${category.slug}`} data-active={tag === category.slug} className="pill-filter">
            {category.name}
          </Link>
        ))}
      </div>
      <div className="grid gap-3">
        {lectures.map((lecture) => {
          const Icon = lecture.mediaType === "AUDIO" ? Headphones : Video
          return (
            <Link
              key={lecture.id}
              href={lecture.mediaType === "AUDIO" ? lecture.url : `https://www.youtube.com/watch?v=${lecture.url}`}
              target="_blank"
              rel="noreferrer"
              className="lecture-row"
            >
              <span className="lecture-icon" data-media={lecture.mediaType}><Icon size={18} /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-[var(--foreground)] sm:text-[0.95rem]">{lecture.title}</span>
                <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--muted)]">
                  <span>{lecture.language}</span>
                  <span aria-hidden="true">·</span>
                  <span>{lecture.mediaType === "AUDIO" ? "Audio" : "Video"}</span>
                  {lecture.categories.map((category) => (
                    <span key={category.id} className="lecture-tag">{category.name}</span>
                  ))}
                </span>
              </span>
              <ArrowUpRight size={18} className="lecture-go" />
            </Link>
          )
        })}
        {!lectures.length && (
          <div className="empty-state flex flex-col items-center gap-3 py-14 text-center text-sm">
            <span className="lecture-icon"><Library size={18} /></span>
            No standalone lectures found.
          </div>
        )}
      </div>
    </div>
  )
}