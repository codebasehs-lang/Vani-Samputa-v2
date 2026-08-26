import Link from "next/link"
import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { ABOUT_SLUGS } from "@/lib/aboutContent"

export const metadata: Metadata = { title: "About" }

export default async function AdminAboutPage() {
  const sections = await prisma.article.findMany({
    where: { slug: { startsWith: "about-" } },
    select: {
      id: true,
      slug: true,
      title: true,
      updatedAt: true,
      createdAt: true,
    },
  })

  const rank = new Map<string, number>(ABOUT_SLUGS.map((slug, index) => [slug, index]))
  const ordered = [...sections].sort((a, b) => {
    const aRank = rank.get(a.slug) ?? Number.MAX_SAFE_INTEGER
    const bRank = rank.get(b.slug) ?? Number.MAX_SAFE_INTEGER
    if (aRank !== bRank) return aRank - bRank
    return a.createdAt.getTime() - b.createdAt.getTime()
  })

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">About Sections ({ordered.length})</h1>
        <Link
          href="/admin/about/new"
          className="admin-gradient-accent rounded-full px-4 py-2 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          + New About Section
        </Link>
      </div>

      <div className="admin-panel divide-y divide-[var(--border)] overflow-hidden">
        {ordered.length === 0 && (
          <p className="px-4 py-8 text-sm text-[var(--muted)]">No About sections yet.</p>
        )}

        {ordered.map((section) => (
          <div key={section.id} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-[var(--foreground)]">{section.title}</p>
              <p className="text-[10px] text-[var(--muted)]">/{section.slug}</p>
            </div>
            <p className="hidden text-[10px] text-[var(--muted)] sm:block">
              Updated {new Date(section.updatedAt).toLocaleDateString("en-IN")}
            </p>
            <Link
              href={`/admin/about/${section.slug}`}
              className="text-xs font-medium"
              style={{ color: "var(--saffron)" }}
            >
              Edit
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}