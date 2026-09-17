"use client"

import { useEffect, useState } from "react"
import { SplashVisual } from "@/components/SplashVisual"

const FIRST_VISIT_SPLASH_KEY = "vs-first-visit-splash-v1"
const FIRST_VISIT_SPLASH_DURATION_MS = 3600
const FIRST_VISIT_SPLASH_FADE_MS = 500

export function FirstVisitSplash() {
  const [visible, setVisible] = useState(false)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const seen = window.localStorage.getItem(FIRST_VISIT_SPLASH_KEY) === "1"
    if (seen) return

    window.localStorage.setItem(FIRST_VISIT_SPLASH_KEY, "1")
    const showTimer = window.setTimeout(() => setVisible(true), 0)

    const fadeTimer = window.setTimeout(
      () => setFading(true),
      FIRST_VISIT_SPLASH_DURATION_MS - FIRST_VISIT_SPLASH_FADE_MS
    )
    const hideTimer = window.setTimeout(
      () => setVisible(false),
      FIRST_VISIT_SPLASH_DURATION_MS
    )

    return () => {
      window.clearTimeout(showTimer)
      window.clearTimeout(fadeTimer)
      window.clearTimeout(hideTimer)
    }
  }, [])

  if (!visible) return null

  return (
    <SplashVisual
      className={`fixed inset-0 z-[110] transition-opacity duration-500 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
      subtitle="Preparing your experience"
    />
  )
}
