"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"

export function PlaylistScroller({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const update = useCallback(() => {
    const el = ref.current
    if (!el) return
    setCanPrev(el.scrollLeft > 4)
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(update)
    ro.observe(el)
    el.addEventListener("scroll", update, { passive: true })
    return () => {
      ro.disconnect()
      el.removeEventListener("scroll", update)
    }
  }, [update])

  const scrollBy = (dir: 1 | -1) => {
    const el = ref.current
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" })
  }

  return (
    <div className="relative mt-5">
      <div ref={ref} className="playlist-row scrollbar-hide">
        {children}
      </div>
      <button
        type="button"
        onClick={() => scrollBy(-1)}
        aria-label="Scroll playlists left"
        className="playlist-arrow left-0 -translate-x-1/2"
        data-hidden={canPrev ? undefined : "true"}
      >
        <ChevronLeft size={18} />
      </button>
      <button
        type="button"
        onClick={() => scrollBy(1)}
        aria-label="Scroll playlists right"
        className="playlist-arrow right-0 translate-x-1/2"
        data-hidden={canNext ? undefined : "true"}
      >
        <ChevronRight size={18} />
      </button>
    </div>
  )
}
