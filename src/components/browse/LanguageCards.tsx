import Link from "next/link"
import { ArrowRight, ListMusic, type LucideIcon } from "lucide-react"
import type { CSSProperties } from "react"

export const LANGUAGES = [
  { key: "Odia", native: "ଓଡ଼ିଆ", glyph: "ଓ", color: "#e8913a" },
  { key: "Hindi", native: "हिंदी", glyph: "ह", color: "#c97db0" },
  { key: "English", native: "English", glyph: "E", color: "#d4a437" },
] as const

export function LanguageCards({
  base,
  counts,
}: {
  base: "/audio" | "/video"
  counts: Record<string, number>
}) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
      {LANGUAGES.map(({ key, native, glyph, color }) => {
        const n = counts[key] ?? 0
        return (
          <Link
            key={key}
            href={`${base}/${key.toLowerCase()}`}
            className="lang-card group"
            style={{ "--lang": color } as CSSProperties}
          >
            <span className="lang-watermark" aria-hidden="true">{glyph}</span>
            <span className="lang-medallion" aria-hidden="true">{glyph}</span>
            <h2 className="lang-name">{key}</h2>
            <p className="lang-native">{native}</p>
            <div className="lang-foot">
              <span className="lang-count">
                <ListMusic size={12} />
                {n} playlist{n !== 1 ? "s" : ""}
              </span>
              <span className="lang-go" aria-hidden="true">
                <ArrowRight size={16} />
              </span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

export function ExploreTile({ href, icon: Icon, title, text }: { href: string; icon: LucideIcon; title: string; text: string }) {
  return (
    <Link href={href} className="explore-tile group">
      <span className="lecture-icon"><Icon size={18} /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-[var(--foreground)]">{title}</span>
        <span className="block text-xs text-[var(--muted)]">{text}</span>
      </span>
      <ArrowRight size={16} className="lecture-go" />
    </Link>
  )
}
