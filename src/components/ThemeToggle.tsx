"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"

export function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false
    const stored = localStorage.getItem("vs-theme")
    return stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches
  })

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light")
  }, [dark])

  function toggle() {
    const next = !dark
    setDark(next)
    const theme = next ? "dark" : "light"
    document.documentElement.setAttribute("data-theme", theme)
    localStorage.setItem("vs-theme", theme)
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="icon-btn inline-flex items-center justify-center p-2"
    >
      {dark ? (
        <Sun size={20} className="text-[var(--gold)]" />
      ) : (
        <Moon size={20} className="text-[var(--deep-blue)]" />
      )}
    </button>
  )
}
