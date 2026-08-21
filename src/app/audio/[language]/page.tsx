import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import type { Metadata } from "next"

const VALID_LANGUAGES = ["odia", "hindi", "english"] as const
type Lang = (typeof VALID_LANGUAGES)[number]

const DISPLAY: Record<Lang, { label: string; native: string }> = {
  odia:    { label: "Odia",    native: "ଓଡ଼ିଆ" },
  hindi:   { label: "Hindi",   native: "हिंदी" },
  english: { label: "English", native: "English" },
}

export async function generateMetadata(
  { params }: { params: Promise<{ language: string }> }
): Promise<Metadata> {
  const { language } = await params
  const info = DISPLAY[language as Lang]
  return { title: info ? `${info.label} Audio` : "Audio" }
}

export default async function LanguageAudioPage(
  { params }: { params: Promise<{ language: string }> }
) {
  const { language } = await params
  const lang = language.toLowerCase() as Lang
  if (!VALID_LANGUAGES.includes(lang)) notFound()

  const { label, native } = DISPLAY[lang]
  const dbLanguage = label  // stored as "Odia", "Hindi" etc.

  const playlists = await prisma.playlist.findMany({
    where: { language: dbLanguage, mediaType: "AUDIO" },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    include: { _count: { select: { lectures: true } } },
  })

  // Group by category
  const grouped = playlists.reduce<Record<string, typeof playlists>>((acc, pl) => {
    ;(acc[pl.category] ??= []).push(pl)
    return acc
  }, {})

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {/* Breadcrumb */}
      <p className="mb-4 text-xs text-[var(--muted)]">
        <Link href="/audio" className="hover:underline">Audio</Link>
        {" / "}
        <span>{label}</span>
      </p>

      <h1
        className="mb-1 text-3xl font-bold"
        style={{ fontFamily: "var(--font-serif)", color: "var(--foreground)" }}
      >
        {label} — {native}
      </h1>
      <p className="mb-8 text-sm text-[var(--muted)]">
        {playlists.length} playlist{playlists.length !== 1 ? "s" : ""}
      </p>

      {playlists.length === 0 && (
        <p className="py-16 text-center text-sm text-[var(--muted)]">
          No playlists yet — content will appear after import.
        </p>
      )}

      {Object.entries(grouped).map(([category, items]) => (
        <section key={category} className="mb-10">
          <h2
            className="mb-4 text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--saffron)" }}
          >
            {category}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((pl) => (
              <Link
                key={pl.id}
                href={`/audio/playlist/${pl.id}`}
                className="group overflow-hidden rounded-xl border border-[var(--border)] transition-transform hover:-translate-y-1"
                style={{ background: "var(--surface)" }}
              >
                <div
                  className="flex h-28 items-center justify-center text-4xl"
                  style={{ background: "linear-gradient(135deg, #1a1a3e 0%, #2d2d5e 100%)" }}
                >
                  🎙️
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                    {pl.title}
                  </p>
                  <p className="mt-0.5 text-[10px] text-[var(--muted)]">
                    {pl._count.lectures} lecture{pl._count.lectures !== 1 ? "s" : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
