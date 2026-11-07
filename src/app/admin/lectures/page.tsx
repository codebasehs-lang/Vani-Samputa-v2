import { AdminLecturesTable } from "@/components/admin/AdminLecturesTable"
import { AdminPageHeader } from "@/components/admin/AdminPageHeader"
import { ADMIN_COLORS, adminGradient } from "@/lib/adminColors"
import { prisma } from "@/lib/prisma"
import { BookOpen, Plus } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "Lectures" }

export default async function AdminLecturesPage(
  { searchParams }: { searchParams: Promise<{ page?: string; q?: string; sort?: string; dir?: string }> }
) {
  const { page: pageStr, q, sort, dir } = await searchParams
  const page = Math.max(1, Number(pageStr ?? 1))
  const take = 30
  const skip = (page - 1) * take

  const where = q
    ? { title: { contains: q } }
    : {}

  const sortField = sort === "title" ? "title" : "createdAt"
  const sortDir = dir === "asc" ? "asc" : "desc"

  const [lectures, total] = await Promise.all([
    prisma.lecture.findMany({
      where,
      orderBy: { [sortField]: sortDir },
      skip,
      take,
      include: { playlist: { select: { title: true } }, categories: { select: { name: true } } },
    }),
    prisma.lecture.count({ where }),
  ])

  const pages = Math.ceil(total / take)

  return (
    <div>
      <AdminPageHeader title="Lectures" section="Library" Icon={BookOpen} color={ADMIN_COLORS.lectures} detail={`${total.toLocaleString()} lectures`} actions={
        <Link
          href="/admin/lectures/new"
          style={{ background: adminGradient(ADMIN_COLORS.lectures) }}
          className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          <Plus size={16} />Add lecture
        </Link>
      } />

      <div className="mb-4 border-b border-[var(--border)] pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <form className="w-full max-w-xl">
            <label className="mb-1.5 block text-xs font-medium text-[var(--muted)]">Search Lectures</label>
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search by title..."
              className="admin-input w-full px-4 py-2.5 text-sm"
            />
          </form>

          <div>
            <p className="mb-1.5 text-xs text-[var(--muted)]">Sort by</p>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {([
                { label: "Newest", sortField: "createdAt", sortDir: "desc" },
                { label: "Oldest", sortField: "createdAt", sortDir: "asc" },
                { label: "Title A-Z", sortField: "title", sortDir: "asc" },
                { label: "Title Z-A", sortField: "title", sortDir: "desc" },
              ] as const).map((opt) => {
                const active = sortField === opt.sortField && sortDir === opt.sortDir
                return (
                  <Link
                    key={opt.label}
                    href={`/admin/lectures?sort=${opt.sortField}&dir=${opt.sortDir}${q ? `&q=${q}` : ""}`}
                    className={`rounded-full px-3 py-1 font-medium transition-colors ${active ? "admin-gradient-accent text-white" : "border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]"
                      }`}
                  >
                    {opt.label}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <AdminLecturesTable lectures={lectures} />

      {/* Pagination */}
      {pages > 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {Array.from({ length: pages }, (_, i) => (
            <Link
              key={i}
              href={`/admin/lectures?page=${i + 1}${q ? `&q=${q}` : ""}${sort ? `&sort=${sort}&dir=${dir}` : ""}`}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${page === i + 1
                ? "admin-gradient-accent text-white"
                : "border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
            >
              {i + 1}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
