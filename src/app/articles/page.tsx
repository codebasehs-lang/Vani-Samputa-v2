import Link from "next/link"
import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/PageHeader"
import { ArrowRight, BookOpen, CalendarDays, Newspaper } from "lucide-react"

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
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader
        icon={Newspaper}
        eyebrow="Reflections & teachings"
        title="Articles"
        description="Essays, transcriptions and realisations drawn from the teachings of HH Haladhara Svāmī Mahārāja."
        crumbs={[{ label: "Home", href: "/" }, { label: "Articles" }]}
        meta={articles.length ? [{ label: `${articles.length} article${articles.length !== 1 ? "s" : ""}`, icon: BookOpen }] : undefined}
      />

      {articles.length === 0 ? (
        <div className="empty-state flex flex-col items-center gap-3 py-16 text-center text-sm">
          <span className="lecture-icon"><Newspaper size={18} /></span>
          No articles have been published yet.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <Link key={article.slug} href={`/articles/${article.slug}`} className="article-card group">
              <div className="article-cover">
                {article.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={article.coverUrl} alt="" loading="lazy" />
                ) : (
                  <BookOpen size={42} />
                )}
                {article.publishedAt && (
                  <span className="article-date">
                    <CalendarDays size={11} />
                    {new Date(article.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h2 className="article-title">{article.title}</h2>
                {article.excerpt && <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--muted)]">{article.excerpt}</p>}
                <span className="article-more">
                  Read article <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
