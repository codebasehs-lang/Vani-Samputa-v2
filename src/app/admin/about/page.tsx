import { AdminPageHeader } from "@/components/admin/AdminPageHeader"
import { ABOUT_SLUGS } from "@/lib/aboutContent"
import { ADMIN_COLORS, adminGradient } from "@/lib/adminColors"
import { prisma } from "@/lib/prisma"
import { Info, Pencil, Plus } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

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
      <AdminPageHeader title="About" section="Settings" Icon={Info} color={ADMIN_COLORS.about} detail={`${ordered.length} sections`} actions={
        <Link
          href="/admin/about/new"
          style={{ background: adminGradient(ADMIN_COLORS.about) }}
          className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          <Plus size={16} />New section
        </Link>
      } />

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
              aria-label={`Edit ${section.title}`}
              title="Edit section"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[var(--accent)] hover:bg-[var(--admin-hover)]"
            >
              <Pencil size={16} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
