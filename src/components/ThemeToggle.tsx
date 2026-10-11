"use client"

import { useSyncExternalStore } from "react"
import { Moon, Sun } from "lucide-react"

type Theme = "light" | "dark"

// Shared across every mounted ThemeToggle (header, admin bar, full-screen player…)
// so toggling one instance updates all the others immediately.
let currentTheme: Theme | null = null
const listeners = new Set<() => void>()

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
  listeners.forEach((notify) => notify())
}

function subscribe(notify: () => void) {
  if (currentTheme === null) {
    currentTheme = resolveInitialTheme()
    document.documentElement.setAttribute("data-theme", currentTheme)
  }
  listeners.add(notify)
  return () => { listeners.delete(notify) }
}

const getSnapshot = (): Theme => currentTheme ?? resolveInitialTheme()
// The server can't know the user's theme; React renders this during hydration
// and then switches to the client snapshot, avoiding a hydration mismatch.
const getServerSnapshot = (): Theme => "light"

export function ThemeToggle({ className = "icon-btn" }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const dark = theme === "dark"

  return (
    <button
      onClick={() => applyTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={`${className} inline-flex items-center justify-center p-2`}
    >
      {dark ? (
        <Sun key="sun" size={20} className="theme-icon text-[var(--gold)]" />
      ) : (
        <Moon key="moon" size={20} className="theme-icon text-[var(--deep-blue)]" />
      )}
    </button>
  )
}
