import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, CalendarDays, Clock } from "lucide-react"
import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { isAboutSlug } from "@/lib/aboutContent"

function renderInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={index}>{part.slice(2, -2)}</strong>
      : <span key={index}>{part}</span>
  )
}

function renderMarkdown(body: string) {
  return body.split(/\r?\n/).map((line, index) => {
    if (!line.trim()) return <div key={index} className="h-4" />
    if (line.startsWith("### ")) return <h3 key={index} className="mt-6 text-lg font-semibold">{renderInline(line.slice(4))}</h3>
    if (line.startsWith("## ")) return <h2 key={index} className="mt-8 text-2xl font-semibold">{renderInline(line.slice(3))}</h2>
    if (line.startsWith("# ")) return <h2 key={index} className="mt-8 text-2xl font-semibold">{renderInline(line.slice(2))}</h2>
    if (line.startsWith("- ")) return <li key={index} className="ml-5 list-disc leading-7">{renderInline(line.slice(2))}</li>
    return <p key={index} className="leading-8">{renderInline(line)}</p>
  })
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  if (isAboutSlug(slug)) {
    return { title: "Article" }
  }
  const article = await prisma.article.findUnique({ where: { slug }, select: { title: true, excerpt: true } })
  return { title: article?.title ?? "Article", description: article?.excerpt ?? undefined }
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (isAboutSlug(slug)) notFound()
  const article = await prisma.article.findFirst({
    where: { slug, publishedAt: { not: null, lte: new Date() } },
  })
  if (!article) notFound()

  const words = article.body.split(/\s+/).filter(Boolean).length
  const readMinutes = Math.max(1, Math.round(words / 200))

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/articles" className="section-action mb-5">
        <ArrowLeft size={14} /> All articles
      </Link>
      {article.coverUrl && (
        <div className="reading-cover">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={article.coverUrl} alt="" />
        </div>
      )}
      <header className={`reading-head ${article.coverUrl ? "" : "reading-head-plain"}`}>
        <p className="section-eyebrow mb-2">Teachings</p>
        <h1 className="reading-title">{article.title}</h1>
        <div className="mt-4 flex flex-wrap gap-2">
          {article.publishedAt && (
            <span className="event-meta">
              <CalendarDays size={13} />
              {new Date(article.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          )}
          <span className="event-meta"><Clock size={13} />{readMinutes} min read</span>
        </div>
        <div className="reading-rule" />
      </header>
      <div className="prose-vani px-1 sm:px-2">{renderMarkdown(article.body)}</div>
      <div className="about-divider mt-12" aria-hidden="true">✦</div>
    </article>
  )
}
