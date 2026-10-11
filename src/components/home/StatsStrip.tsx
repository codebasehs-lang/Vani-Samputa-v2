"use client"

import { useEffect, useRef, useState } from "react"
import { animate, motion, useInView, useReducedMotion } from "framer-motion"
import { Globe2, Headphones, ListMusic, PlayCircle, type LucideIcon } from "lucide-react"

type Stat = { label: string; value: number; icon: LucideIcon }

function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: "-40px" })
  const reduce = useReducedMotion()
  const [shown, setShown] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (reduce) {
      const id = requestAnimationFrame(() => setShown(value))
      return () => cancelAnimationFrame(id)
    }
    const controls = animate(0, value, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setShown(Math.round(v)),
    })
    return () => controls.stop()
  }, [inView, reduce, value])

  return <span ref={ref}>{shown.toLocaleString()}</span>
}

export function StatsStrip({
  audioCount,
  videoCount,
  playlistCount,
}: {
  audioCount: number
  videoCount: number
  playlistCount: number
}) {
  const stats: Stat[] = [
    { label: "Audio Lectures", value: audioCount, icon: Headphones },
    { label: "Video Lectures", value: videoCount, icon: PlayCircle },
    { label: "Playlists", value: playlistCount, icon: ListMusic },
    { label: "Languages", value: 3, icon: Globe2 },
  ]

  return (
    <section className="relative z-[5] -mt-14 px-4 sm:-mt-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="stats-card mx-auto grid max-w-4xl grid-cols-2 sm:grid-cols-4"
      >
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="stats-item">
            <span className="stats-icon">
              <Icon size={18} strokeWidth={2} />
            </span>
            <span className="stats-value">
              <CountUp value={value} />
            </span>
            <span className="stats-label">{label}</span>
          </div>
        ))}
      </motion.div>
    </section>
  )
}
