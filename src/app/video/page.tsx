import Link from "next/link"
import { prisma } from "@/lib/prisma"
import type { Metadata } from "next"
import { PageHeader } from "@/components/PageHeader"

export const metadata: Metadata = { title: "Video Lectures" }

const LANGUAGES = [
  { key: "Odia",    label: "Odia",    native: "ଓଡ଼ିଆ", color: "#4A5D8F", glyph: "ଓ" },
  { key: "Hindi",   label: "Hindi",   native: "हिंदी",   color: "#E8A4C8", glyph: "ह" },
  { key: "English", label: "English", native: "English", color: "#FFD700", glyph: "E" },
]

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

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <PageHeader title="Video Lectures" description="Teachings of HH Haladhara Svāmī Mahārāja" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {LANGUAGES.map(({ key, label, native, color, glyph }) => (
          <Link
            key={key}
            href={`/video/${key.toLowerCase()}`}
            className="surface-card group relative overflow-hidden p-6 transition-transform hover:-translate-y-1"
          >
            <div
              className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full opacity-20 blur-xl"
              style={{ background: color }}
            />
            <div className="relative">
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
                style={{
                  background: `color-mix(in oklab, ${color} 16%, transparent)`,
                  border: `1px solid color-mix(in oklab, ${color} 30%, transparent)`,
                }}
              >
                <span className="text-2xl font-bold leading-none" style={{ color }}>{glyph}</span>
              </div>
              <h2 className="text-xl font-bold" style={{ color }}>
                {label}
              </h2>
              <p className="text-sm font-medium text-[var(--muted)]">{native}</p>
              <p className="mt-2 text-xs text-[var(--muted)]">
                {counts[key] ?? 0} playlist{counts[key] !== 1 ? "s" : ""}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
