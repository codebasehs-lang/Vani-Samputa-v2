"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { BookOpen, Headphones, PlayCircle } from "lucide-react"
import { SearchBar } from "@/components/home/SearchBar"
import { HeroLotus } from "@/components/home/HeroLotus"
import { HeroFigures, ParamparaRow } from "@/components/home/HeroParampara"

export function HeroSection() {
  return (
    <section
      className="hero-surface relative px-4 pb-28 pt-8 text-center sm:pb-32 sm:pt-10"
    >
      {/* Radial saffron glow */}
      <div className="hero-glow pointer-events-none absolute inset-0 overflow-hidden" />
      <HeroLotus />
      <HeroFigures />

      <div className="hero-content relative z-10 mx-auto max-w-2xl">
        <ParamparaRow />
        {/* Devanagari subtitle */}
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="hero-song-line mb-3 text-[var(--gold)]"
          aria-label="guru-mukha-padma-vakya, cittete koriya aikya..."
        >
          <span aria-hidden="true">guru-mukha-padma-vakya, cittete koriya aikya...</span>
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-iast mb-1 text-4xl font-semibold tracking-tight text-[var(--cream)] sm:text-5xl"
          style={{ fontFamily: "var(--font-iast)" }}
        >
          Vāṇī&nbsp;Saṃpuṭa
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="font-iast mb-3 text-lg font-medium text-[var(--lotus-pink)]"
        >
          HH Haladhara Svāmī Mahārāja
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scaleX: 0.4 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="hero-ornament mb-8"
          aria-hidden="true"
        >
          <span className="hero-ornament-line" />
          <span className="hero-ornament-gem">✦</span>
          <span className="hero-ornament-line" />
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="relative z-20 mb-8"
        >
          <SearchBar />
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.85 }}
          className="flex flex-wrap justify-center gap-3"
        >
          <Link href="/audio" className="hero-cta">
            <Headphones size={16} className="hero-cta-icon" />
            Browse Audio
          </Link>
          <Link href="/video" className="hero-cta">
            <PlayCircle size={16} className="hero-cta-icon" />
            Watch Video
          </Link>
          <Link href="/live" className="hero-cta">
            <span className="hero-live-dot" aria-hidden="true" />
            Live
          </Link>
          <a
            href="https://books.vanisamputa.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hero-cta hero-cta-books"
          >
            <BookOpen size={16} className="hero-cta-icon" />
            Books
          </a>
        </motion.div>
      </div>
    </section>
  )
}
