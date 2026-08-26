"use client"

import { useState } from "react"

type Verse = {
  sanskrit: string
  devanagari: string | null
  odia: string | null
  hindi: string | null
  english: string | null
  source: string | null
} | null

type Lang = "odia" | "hindi" | "english"

const SAMPLE_VERSE = {
  sanskrit: "sri-guru-carana-padma, kevala-bhakati-sadma",
  devanagari: "श्री गुरु चरण पद्म, केवल भक्ति सद्म",
  odia: "ଶ୍ରୀ ଗୁରୁ ଚରଣ ପଦ୍ମ, କେବଳ ଭକ୍ତି ସଦ୍ମ",
  hindi: "श्री गुरु चरण पद्म, केवल भक्ति सद्म",
  english: "At the lotus feet of the spiritual master lies the pure abode of devotion.",
  source: "HH Haladhara Svāmī Mahārāja",
}

const LANGS: { key: Lang; label: string }[] = [
  { key: "english",    label: "Quote" },
  { key: "odia",       label: "ଓଡ଼ିଆ" },
  { key: "hindi",      label: "हिंदी" },
]

export function DailyVerseWidget({ verse }: { verse: Verse }) {
  const [lang, setLang] = useState<Lang>("english")

  const activeVerse = verse ?? SAMPLE_VERSE

  const text =
    activeVerse[lang] ??
    activeVerse.english ??
    activeVerse.hindi ??
    activeVerse.odia ??
    ""

  return (
    <section className="px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <h2
          className="mb-5 text-center text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--accent)" }}
        >
          ✦ Quote of the Day ✦
        </h2>

        <div className="surface-panel p-6 text-center">
          {/* Language tabs */}
          <div className="mb-5 flex justify-center gap-1">
            {LANGS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setLang(key)}
                data-active={lang === key}
                className="chip px-3 py-1 text-xs"
              >
                {label}
              </button>
            ))}
          </div>

          {/* Verse text */}
          <p
            className={`leading-relaxed text-[var(--foreground)] ${
              lang === "hindi"
                ? "text-xl"
                : lang === "odia"
                ? "text-lg"
                : "text-base italic"
            }`}
            style={
              lang === "hindi" || lang === "odia"
                ? { fontFamily: "var(--font-devanagari)" }
                : { fontFamily: "var(--font-serif)" }
            }
          >
            {text}
          </p>

          {activeVerse.source && (
            <p className="mt-4 text-xs font-medium text-[var(--muted)]">{activeVerse.source}</p>
          )}
        </div>
      </div>
    </section>
  )
}
