import Link from "next/link"
import { prisma } from "@/lib/prisma"
import type { Metadata } from "next"
import { PageHeader } from "@/components/PageHeader"

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
      <PageHeader title="Standalone Lectures" description="Lectures that are not assigned to a playlist." />
      <div className="mb-8 flex flex-wrap gap-2">
        <Link href="/lectures" data-active={!tag} className="chip px-3 py-1.5 text-xs">All</Link>
        {categories.map((category) => (
          <Link key={category.id} href={`/lectures?tag=${category.slug}`} data-active={tag === category.slug} className="chip px-3 py-1.5 text-xs">
            {category.name}
          </Link>
        ))}
      </div>
      <div className="space-y-2">
        {lectures.map((lecture) => (
          <Link
            key={lecture.id}
            href={lecture.mediaType === "AUDIO" ? lecture.url : `https://www.youtube.com/watch?v=${lecture.url}`}
            target="_blank"
            rel="noreferrer"
            className="surface-card block p-4"
          >
            <p className="font-semibold text-[var(--foreground)]">{lecture.title}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">{lecture.language} · {lecture.mediaType}{lecture.categories.length ? ` · ${lecture.categories.map((category) => category.name).join(", ")}` : ""}</p>
          </Link>
        ))}
        {!lectures.length && (
          <div className="empty-state py-12 text-center text-sm text-[var(--muted)]">No standalone lectures found.</div>
        )}
      </div>
    </div>
  )
}