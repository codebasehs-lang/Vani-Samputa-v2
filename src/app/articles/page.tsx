import Link from "next/link"
import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"

export const metadata: Metadata = { title: "Articles" }

export default async function ArticlesPage() {
  const articles = await prisma.article.findMany({
    where: {
      publishedAt: { not: null, lte: new Date() },
      NOT: { slug: { startsWith: "about-" } },
    },
    orderBy: { publishedAt: "desc" },
    select: { slug: true, title: true, excerpt: true, coverUrl: true, publishedAt: true },
  })

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--saffron)]">Reflections &amp; teachings</p>
        <h1 className="text-3xl font-bold text-[var(--foreground)]" style={{ fontFamily: "var(--font-serif)" }}>
          Articles
        </h1>
      </div>

      {articles.length === 0 ? (
        <p className="py-16 text-center text-sm text-[var(--muted)]">No articles have been published yet.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <Link
              key={article.slug}
              href={`/articles/${article.slug}`}
              className="group overflow-hidden rounded-2xl border border-[var(--border)] transition-transform hover:-translate-y-0.5"
              style={{ background: "var(--surface)" }}
            >
              {article.coverUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={article.coverUrl} alt="" className="h-44 w-full object-cover" />
              )}
              <div className="p-5">
                <h2 className="text-lg font-semibold leading-tight text-[var(--foreground)] group-hover:text-[var(--saffron)]">
                  {article.title}
                </h2>
                {article.excerpt && <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--muted)]">{article.excerpt}</p>}
                {article.publishedAt && (
                  <p className="mt-4 text-xs text-[var(--muted)]">
                    {new Date(article.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
