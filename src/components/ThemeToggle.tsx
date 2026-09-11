"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"

type Theme = "light" | "dark"

// Shared across every mounted ThemeToggle (header, admin bar, full-screen player…)
// so toggling one instance updates all the others immediately.
let currentTheme: Theme | null = null
const listeners = new Set<(theme: Theme) => void>()

function resolveInitialTheme(): Theme {
  if (typeof window === "undefined") return "light"
  const stored = localStorage.getItem("vs-theme")
  if (stored === "dark" || stored === "light") return stored
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function applyTheme(theme: Theme) {
  currentTheme = theme
  document.documentElement.setAttribute("data-theme", theme)
  localStorage.setItem("vs-theme", theme)
  listeners.forEach((notify) => notify(theme))
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => currentTheme ?? resolveInitialTheme())

  useEffect(() => {
    if (currentTheme === null) {
      currentTheme = resolveInitialTheme()
      document.documentElement.setAttribute("data-theme", currentTheme)
    }
    setTheme(currentTheme)
    listeners.add(setTheme)
    return () => { listeners.delete(setTheme) }
  }, [])

  const dark = theme === "dark"

  return (
    <button
      onClick={() => applyTheme(dark ? "light" : "dark")}
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
