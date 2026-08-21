import Link from "next/link"
import { prisma } from "@/lib/prisma"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Audio Lectures" }

const LANGUAGES = [
  { key: "Odia",    label: "Odia",    native: "ଓଡ଼ିଆ",  color: "#4A5D8F", emoji: "🪷" },
  { key: "Hindi",   label: "Hindi",   native: "हिंदी",    color: "#E8A4C8", emoji: "🌸" },
  { key: "English", label: "English", native: "English", color: "#FFD700", emoji: "✨" },
]

async function getCounts() {
  const counts = await prisma.playlist.groupBy({
    by: ["language"],
    where: { mediaType: "AUDIO" },
    _count: { id: true },
  })
  return Object.fromEntries(counts.map((c) => [c.language, c._count.id]))
}

export default async function AudioPage() {
  const counts = await getCounts()

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1
        className="mb-1 text-3xl font-bold"
        style={{ fontFamily: "var(--font-serif)", color: "var(--foreground)" }}
      >
        Audio Lectures
      </h1>
      <p className="mb-8 text-sm text-[var(--muted)]">
        Teachings of HH Haladhara Swami Maharaja in four languages
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {LANGUAGES.map(({ key, label, native, color, emoji }) => (
          <Link
            key={key}
            href={`/audio/${key.toLowerCase()}`}
            className="group relative overflow-hidden rounded-2xl border border-[var(--border)] p-6 transition-transform hover:-translate-y-1"
            style={{ background: "var(--surface)" }}
          >
            {/* Accent glow */}
            <div
              className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full opacity-20 blur-xl"
              style={{ background: color }}
            />
            <div className="relative">
              <span className="text-3xl">{emoji}</span>
              <h2 className="mt-3 text-xl font-bold" style={{ color }}>
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
