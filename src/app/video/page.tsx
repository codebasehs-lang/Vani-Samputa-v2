import { prisma } from "@/lib/prisma"
import type { Metadata } from "next"
import { Headphones, Languages, Library, ListVideo, Video } from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import { ExploreTile, LanguageCards } from "@/components/browse/LanguageCards"

export const metadata: Metadata = { title: "Video Lectures" }
export const dynamic = "force-dynamic"

async function getCounts() {
  const counts = await prisma.playlist.groupBy({
    by: ["language"],
    where: { mediaType: "VIDEO" },
    _count: { id: true },
  })
  return Object.fromEntries(counts.map((c) => [c.language, c._count.id]))
}

export default async function VideoPage() {
  const counts = await getCounts()
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0)

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <PageHeader
        icon={Video}
        eyebrow="Darśanam · Watch the teachings"
        title="Video Lectures"
        description="Recorded satsangs, festivals and yātrās with HH Haladhara Svāmī Mahārāja — choose a language to begin."
        crumbs={[{ label: "Home", href: "/" }, { label: "Video" }]}
        meta={[
          { label: `${total} playlist${total !== 1 ? "s" : ""}`, icon: ListVideo },
          { label: "3 languages", icon: Languages },
        ]}
      />

      <LanguageCards base="/video" counts={counts} />

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <ExploreTile href="/audio" icon={Headphones} title="Prefer to listen?" text="Browse audio lectures" />
        <ExploreTile href="/lectures" icon={Library} title="Standalone lectures" text="Talks outside any playlist" />
      </div>
    </div>
  )
}
