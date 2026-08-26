import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { ABOUT_SLUGS } from "@/lib/aboutContent"
import { PageHeader } from "@/components/PageHeader"

export const metadata: Metadata = { title: "About" }

function splitParagraphs(body: string) {
  return body
    .split(/\n\s*\n/g)
    .map((part) => part.trim())
    .filter(Boolean)
}

export default async function AboutPage() {
  const articles = await prisma.article.findMany({
    where: {
      slug: { startsWith: "about-" },
      publishedAt: { not: null, lte: new Date() },
    },
    select: {
      slug: true,
      title: true,
      body: true,
      coverUrl: true,
      createdAt: true,
    },
  })

  const rank = new Map<string, number>(ABOUT_SLUGS.map((slug, index) => [slug, index]))
  const ordered = [...articles].sort((a, b) => {
    const aRank = rank.get(a.slug) ?? Number.MAX_SAFE_INTEGER
    const bRank = rank.get(b.slug) ?? Number.MAX_SAFE_INTEGER
    if (aRank !== bRank) return aRank - bRank
    return a.createdAt.getTime() - b.createdAt.getTime()
  })

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader eyebrow="Spiritual Legacy" title="About" align="center" />

      {ordered.length === 0 && (
        <div className="empty-state py-16 text-center text-sm text-[var(--muted)]">
          About content is not available yet. Run db seed to load initial sections.
        </div>
      )}

      <div className="space-y-10">
        {ordered.map((article, index) => {
          const reverse = index % 2 === 1
          const paragraphs = splitParagraphs(article.body)

          return (
            <section key={article.slug} className="surface-panel overflow-hidden">
              <div className={`grid gap-0 md:grid-cols-2 ${reverse ? "md:[&>*:first-child]:order-2" : ""}`}>
                <div className="p-6 sm:p-8">
                  <h2 className="mb-4 text-2xl font-semibold text-[var(--foreground)]" style={{ fontFamily: "var(--font-serif)" }}>
                    {article.title}
                  </h2>
                  <div className="space-y-4 text-[15px] leading-7 text-[var(--muted)]">
                    {paragraphs.map((paragraph, paragraphIndex) => (
                      <p key={`${article.slug}-paragraph-${paragraphIndex}`}>{paragraph}</p>
                    ))}
                    {article.slug === "about-founder-of-taptajivanam" && (
                      <a
                        href="https://www.taptajivanam.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-accent inline-flex items-center px-4 py-2 text-sm"
                      >
                        Visit Taptajivanam {"->"}
                      </a>
                    )}
                  </div>
                </div>

                <div className="relative min-h-[260px] bg-[var(--background)]">
                  {article.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={article.coverUrl} alt={article.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-[var(--muted)]">Add Gurudeva image</div>
                  )}
                </div>
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
