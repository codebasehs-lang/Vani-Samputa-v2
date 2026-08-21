import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { DeleteLectureButton } from "@/components/admin/DeleteLectureButton"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Lectures" }

export default async function AdminLecturesPage(
  { searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }
) {
  const { page: pageStr, q } = await searchParams
  const page = Math.max(1, Number(pageStr ?? 1))
  const take = 30
  const skip = (page - 1) * take

  const where = q
    ? { title: { contains: q } }
    : {}

  const [lectures, total] = await Promise.all([
    prisma.lecture.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: { playlist: { select: { title: true } } },
    }),
    prisma.lecture.count({ where }),
  ])

  const pages = Math.ceil(total / take)

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          Lectures <span className="text-sm font-normal text-[var(--muted)]">({total})</span>
        </h1>
        <Link
          href="/admin/lectures/new"
          className="rounded-full px-4 py-2 text-sm font-semibold text-white"
          style={{ background: "var(--saffron)" }}
        >
          + Add Lecture
        </Link>
      </div>

      {/* Search */}
      <form className="mb-4">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by title…"
          className="w-full max-w-xs rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--saffron)]"
        />
      </form>

      <div
        className="overflow-hidden rounded-xl border border-[var(--border)]"
        style={{ background: "var(--surface)" }}
      >
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--border)]">
            <tr>
              {["Type", "Title", "Language", "Playlist", "Added", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {lectures.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--muted)]">No lectures yet.</td></tr>
            )}
            {lectures.map((l) => (
              <tr key={l.id} className="hover:bg-black/[0.02]">
                <td className="px-4 py-2.5">{l.mediaType === "AUDIO" ? "🎙️" : "🎬"}</td>
                <td className="max-w-xs px-4 py-2.5">
                  <p className="truncate font-medium text-[var(--foreground)]">{l.title}</p>
                </td>
                <td className="px-4 py-2.5 text-[var(--muted)]">{l.language}</td>
                <td className="max-w-[140px] px-4 py-2.5 truncate text-[var(--muted)]">
                  {l.playlist?.title ?? "—"}
                </td>
                <td className="px-4 py-2.5 text-[var(--muted)]">
                  {new Date(l.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-2.5">
                  <DeleteLectureButton id={l.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="mt-4 flex gap-2">
          {Array.from({ length: pages }, (_, i) => (
            <Link
              key={i}
              href={`/admin/lectures?page=${i + 1}${q ? `&q=${q}` : ""}`}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                page === i + 1
                  ? "text-white"
                  : "border border-[var(--border)] text-[var(--muted)]"
              }`}
              style={page === i + 1 ? { background: "var(--saffron)" } : {}}
            >
              {i + 1}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
