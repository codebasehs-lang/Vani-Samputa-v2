import { prisma } from "@/lib/prisma"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Articles" }

export default async function AdminArticlesPage() {
  const articles = await prisma.article.findMany({
    where: { NOT: { slug: { startsWith: "about-" } } },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Articles ({articles.length})</h1>
        <Link
          href="/admin/articles/new"
          className="rounded-full px-4 py-2 text-sm font-semibold text-white"
          style={{ background: "var(--saffron)" }}
        >
          + New Article
        </Link>
      </div>

      <div
        className="overflow-hidden rounded-xl border border-[var(--border)] divide-y divide-[var(--border)]"
        style={{ background: "var(--surface)" }}
      >
        {articles.length === 0 && (
          <p className="px-4 py-8 text-sm text-[var(--muted)]">No articles yet.</p>
        )}
        {articles.map((a) => (
          <div key={a.id} className="flex items-center gap-3 px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium text-[var(--foreground)]">{a.title}</p>
              <p className="text-[10px] text-[var(--muted)]">/{a.slug}</p>
            </div>
            <Link
              href={`/admin/articles/${a.id}`}
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
