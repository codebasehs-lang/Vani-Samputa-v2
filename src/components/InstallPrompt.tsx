"use client"

import { useEffect, useState } from "react"
import { Download, X } from "lucide-react"

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
      className="surface-panel fixed inset-x-4 bottom-24 z-40 flex items-center gap-3 p-4 md:inset-x-auto md:right-6 md:w-96"
      aria-label="Install Vani Samputa"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[var(--accent-fg)]" style={{ background: "var(--accent)" }}>
        <Download size={20} strokeWidth={2.5} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-iast text-sm font-semibold text-[var(--foreground)]">Keep Vāṇī Saṃpuṭa close</p>
        <p className="mt-0.5 text-xs text-[var(--muted)]">Install the app for quicker access.</p>
      </div>
      <button
        type="button"
        onClick={install}
        className="btn-accent shrink-0 px-3 py-1.5 text-xs"
      >
        Install
      </button>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="icon-btn inline-flex shrink-0 items-center justify-center p-1"
        aria-label="Dismiss install prompt"
      >
        <X size={18} />
      </button>
    </aside>
  )
}
