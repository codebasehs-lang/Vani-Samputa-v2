import { prisma } from "@/lib/prisma"
import Link from "next/link"
import type { Metadata } from "next"
import { FileText } from "lucide-react"
import { DeleteArticleButton } from "@/components/admin/DeleteArticleButton"
import { ADMIN_COLORS, adminGradient } from "@/lib/adminColors"

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
          style={{ background: adminGradient(ADMIN_COLORS.articles) }}
          className="rounded-full px-4 py-2 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          + New Article
        </Link>
      </div>

      <div className="admin-panel overflow-hidden divide-y divide-[var(--border)]">
        {articles.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-full text-white"
              style={{ background: adminGradient(ADMIN_COLORS.articles) }}
            >
              <FileText size={22} strokeWidth={1.5} />
            </span>
            <p className="text-sm font-medium text-[var(--foreground)]">No articles yet</p>
            <p className="text-xs text-[var(--muted)]">Published articles will show up here.</p>
          </div>
        )}
        {articles.map((a) => (
          <div key={a.id} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.03]">
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
            <DeleteArticleButton id={a.id} />
          </div>
        ))}
      </div>
    </div>
  )
}
