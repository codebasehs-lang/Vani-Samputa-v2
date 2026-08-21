"use client"

import { useEffect, useState } from "react"
import { DownloadSimple, X } from "phosphor-react"

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function InstallPrompt() {
  const [event, setEvent] = useState<InstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handler = (nextEvent: Event) => {
      nextEvent.preventDefault()
      setEvent(nextEvent as InstallPromptEvent)
      setVisible(true)
    }
    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  if (!visible || !event) return null

  async function install() {
    const installEvent = event
    if (!installEvent) return
    await installEvent.prompt()
    await installEvent.userChoice
    setEvent(null)
    setVisible(false)
  }

  return (
    <aside
      className="fixed inset-x-4 bottom-24 z-40 flex items-center gap-3 rounded-2xl border border-[var(--border)] p-4 shadow-xl md:inset-x-auto md:right-6 md:w-96"
      style={{ background: "var(--surface)" }}
      aria-label="Install Vani Samputa"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: "var(--saffron)" }}>
        <DownloadSimple size={20} weight="bold" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-iast text-sm font-semibold text-[var(--foreground)]">Keep Vāṇī Saṃpuṭa close</p>
        <p className="mt-0.5 text-xs text-[var(--muted)]">Install the app for quicker access.</p>
      </div>
      <button
        type="button"
        onClick={install}
        className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-white"
        style={{ background: "var(--saffron)" }}
      >
        Install
      </button>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="shrink-0 text-[var(--muted)]"
        aria-label="Dismiss install prompt"
      >
        <X size={18} />
      </button>
    </aside>
  )
}
