import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { ABOUT_SLUGS } from "@/lib/aboutContent"
import { PageHeader } from "@/components/PageHeader"
import { ExternalLink, Flower2 } from "lucide-react"

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
      <PageHeader
        align="center"
        icon={Flower2}
        eyebrow="Spiritual legacy"
        title="About"
        description="The life, mission and teachings of HH Haladhara Svāmī Mahārāja — in service of Śrī Guru and Gaurāṅga."
        crumbs={[{ label: "Home", href: "/" }, { label: "About" }]}
      />

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
            <section key={article.slug} className="about-section" data-reverse={reverse}>
              <div className="min-w-0">
                <h2 className="about-title">{article.title}</h2>
                <div className="reading-rule" />
                <div className="about-body">
                  {paragraphs.map((paragraph, paragraphIndex) => (
                    <p key={`${article.slug}-paragraph-${paragraphIndex}`}>{paragraph}</p>
                  ))}
                </div>
                {article.slug === "about-founder-of-taptajivanam" && (
                  <a
                    href="https://www.taptajivanam.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-gold mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-sm"
                  >
                    Visit Taptajivanam <ExternalLink size={14} />
                  </a>
                )}
              </div>

              <div className="about-figure">
                <div className="about-frame">
                  {article.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={article.coverUrl} alt={article.title} loading="lazy" />
                  ) : (
                    <Flower2 size={48} />
                  )}
                </div>
              </div>
            </section>
          )
        })}
      </div>

      {ordered.length > 0 && (
        <div className="about-divider mt-12 text-lg italic" style={{ fontFamily: "var(--font-crimson), Georgia, serif" }} aria-hidden="true">✦ śrī guru-gaurāṅga jayataḥ ✦</div>
      )}
    </div>
  )
}
