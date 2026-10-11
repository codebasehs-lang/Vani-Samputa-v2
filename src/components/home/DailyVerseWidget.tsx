"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Check, Copy, Quote } from "lucide-react"
import { toast } from "sonner"

type Verse = {
  sanskrit: string | null
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
  { key: "english", label: "English" },
  { key: "odia",    label: "ଓଡ଼ିଆ" },
  { key: "hindi",   label: "हिंदी" },
]

export function DailyVerseWidget({ verse }: { verse: Verse }) {
  const [lang, setLang] = useState<Lang>("english")
  const [copied, setCopied] = useState(false)

  const activeVerse = verse ?? SAMPLE_VERSE
  const source = activeVerse.source || "HH Haladhara Svāmī Mahārāja"

  const text =
    activeVerse[lang] ??
    activeVerse.english ??
    activeVerse.hindi ??
    activeVerse.odia ??
    ""

  const isIndic = lang === "hindi" || lang === "odia"

  async function copy() {
    try {
      await navigator.clipboard.writeText(`“${text}”\n— ${source}`)
      setCopied(true)
      toast.success("Quote copied")
      setTimeout(() => setCopied(false), 1800)
    } catch {
      toast.error("Couldn't copy the quote")
    }
  }

  return (
    <section className="px-4 pb-6 pt-14 sm:pt-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-3xl"
      >
        <div className="quote-heading">
          <span className="quote-rule" aria-hidden="true" />
          <h2>Quote of the Day</h2>
          <span className="quote-rule" aria-hidden="true" />
        </div>

        <figure className="quote-card">
          <Quote className="quote-mark" aria-hidden="true" />

          <button onClick={copy} className="quote-action" aria-label={copied ? "Quote copied" : "Copy quote"}>
            {copied ? <Check size={14} strokeWidth={2.6} /> : <Copy size={14} strokeWidth={2.4} />}
            <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
          </button>

          <div className="quote-tabs" role="tablist" aria-label="Quote language">
            {LANGS.map(({ key, label }) => (
              <button
                key={key}
                role="tab"
                aria-selected={lang === key}
                onClick={() => setLang(key)}
                className="quote-tab"
                data-active={lang === key}
              >
                {lang === key && (
                  <motion.span
                    layoutId="quote-tab-pill"
                    className="quote-tab-pill"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative">{label}</span>
              </button>
            ))}
          </div>

          <div className="relative flex min-h-[5.5rem] items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.blockquote
                key={lang}
                initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
                transition={{ duration: 0.35 }}
                className={`quote-text ${isIndic ? "quote-text-indic" : ""}`}
                style={{ fontFamily: isIndic ? "var(--font-devanagari)" : "var(--font-serif)" }}
              >
                {text}
              </motion.blockquote>
            </AnimatePresence>
          </div>

          <div className="quote-divider" aria-hidden="true">
            <span />✦<span />
          </div>

          <figcaption className="quote-footer">
            <span className="quote-source">{source}</span>
          </figcaption>
        </figure>
      </motion.div>
    </section>
  )
}
