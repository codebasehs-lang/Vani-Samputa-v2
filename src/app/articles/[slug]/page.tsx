import { notFound } from "next/navigation"
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

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      {article.coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={article.coverUrl} alt="" className="mb-8 h-64 w-full rounded-2xl object-cover sm:h-80" />
      )}
      <header className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Teachings</p>
        <h1 className="text-4xl font-bold leading-tight text-[var(--foreground)]" style={{ fontFamily: "var(--font-serif)" }}>
          {article.title}
        </h1>
        {article.publishedAt && <p className="mt-3 text-xs text-[var(--muted)]">{new Date(article.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>}
      </header>
      <div className="text-[var(--foreground)]">{renderMarkdown(article.body)}</div>
    </article>
  )
}
