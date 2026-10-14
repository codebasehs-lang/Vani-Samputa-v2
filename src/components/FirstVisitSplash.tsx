"use client"

import { useEffect, useLayoutEffect, useState } from "react"
import { SplashVisual } from "@/components/SplashVisual"

const FIRST_VISIT_SPLASH_KEY = "vs-first-visit-desktop-splash-v1"
const FIRST_VISIT_SPLASH_DURATION_MS = 3600
const FIRST_VISIT_SPLASH_FADE_MS = 500

export function FirstVisitSplash() {
  const [visible, setVisible] = useState(false)
  const [fading, setFading] = useState(false)
  const [isPwa, setIsPwa] = useState(false)
  const [checking, setChecking] = useState(true)

  useLayoutEffect(() => {
    if (!checking) document.documentElement.removeAttribute("data-pwa-launch")
  }, [checking])

  useEffect(() => {
    const isDesktop = window.matchMedia("(min-width: 768px)").matches
    const standalone = window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && navigator.standalone === true)
    const mobilePwa = !isDesktop && standalone
    let showSplash = isDesktop || mobilePwa
    if (isDesktop) {
      const seen = window.localStorage.getItem(FIRST_VISIT_SPLASH_KEY) === "1"
      showSplash = !seen
      if (!seen) window.localStorage.setItem(FIRST_VISIT_SPLASH_KEY, "1")
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const duration = mobilePwa ? (reduceMotion ? 600 : 2600) : FIRST_VISIT_SPLASH_DURATION_MS
    const showTimer = window.setTimeout(() => {
      setIsPwa(mobilePwa)
      setVisible(showSplash)
      setChecking(false)
    }, 0)

    const fadeTimer = showSplash ? window.setTimeout(
      () => setFading(true),
      mobilePwa && reduceMotion ? duration : duration - FIRST_VISIT_SPLASH_FADE_MS
    ) : null
    return () => {
      window.clearTimeout(showTimer)
      if (fadeTimer !== null) window.clearTimeout(fadeTimer)
    }
  }, [])

  useEffect(() => {
    if (!visible || !fading) return
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const fadeMs = isPwa ? (reduceMotion ? 0 : 950) : FIRST_VISIT_SPLASH_FADE_MS
    const timer = window.setTimeout(() => setVisible(false), fadeMs)
    return () => window.clearTimeout(timer)
  }, [visible, fading, isPwa])

  useLayoutEffect(() => {
    if (!visible || !isPwa) return
    const overflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = overflow }
  }, [visible, isPwa])

  if (!visible && !checking) return null
  const pwa = checking || isPwa

  return (
    <SplashVisual
      variant={pwa ? "pwa" : "default"}
      onEnter={pwa ? () => setFading(true) : undefined}
      className={`fixed inset-0 z-[110] ${
        pwa
          ? fading ? "pwa-splash-exiting" : ""
          : `transition-opacity duration-500 ${fading ? "opacity-0" : "opacity-100"}`
      } ${checking ? "pwa-splash-boot" : ""}`}
      subtitle="Preparing your experience"
    />
  )
}
