"use client"

import { motion } from "framer-motion"
import Link from "next/link"

const mantraLines = [
  "",
]

export function HeroSection() {
  return (
    <section
      className="relative overflow-hidden py-20 px-4 text-center bg-[#1a1a3e]"
    >
      {/* Radial saffron glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(255,215,0,0.14) 0%, transparent 70%)" }}
      />

      <div className="relative z-10 mx-auto max-w-2xl">
        {/* Devanagari subtitle */}
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mb-3 text-base tracking-widest text-[var(--gold)] opacity-80"
          style={{ fontFamily: "var(--font-devanagari)" }}
        >
          sri-guru-carana-padma, kevala-bhakati-sadma
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
          className="mb-8 text-lg font-medium text-[var(--lotus-pink)]"
        >
          HH Haladhara Swami Maharaja
        </motion.p>

        {/* Maha Mantra */}
        <div className="mb-10 flex flex-col items-center gap-1">
          {mantraLines.map((line, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -24 : 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55, delay: 0.35 + i * 0.12 }}
              className="text-lg font-semibold tracking-wider text-[var(--gold)]"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              {line}
            </motion.p>
          ))}
        </div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.85 }}
          className="flex flex-wrap justify-center gap-3"
        >
          <Link
            href="/audio"
            className="rounded-full border px-7 py-2.5 text-sm font-semibold text-[var(--deep-blue)] transition-colors hover:bg-[var(--cream-dark)]"
            style={{ background: "var(--cream)", borderColor: "rgba(255,255,255,0.35)" }}
          >
            Browse Audio
          </Link>
          <Link
            href="/video"
            className="rounded-full border px-7 py-2.5 text-sm font-semibold text-white/90 transition-colors hover:bg-white/10"
            style={{ borderColor: "rgba(255,255,255,0.35)" }}
          >
            Watch Video
          </Link>
          <Link
            href="/live"
            className="rounded-full border px-7 py-2.5 text-sm font-semibold text-[var(--lotus-pink)] transition-colors hover:bg-white/10"
            style={{ borderColor: "rgba(232,164,200,0.65)" }}
          >
            🔴 Live
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
