"use client"

import { useEffect, useState } from "react"
import { Check, DownloadSimple } from "phosphor-react"

const AUDIO_CACHE = "vani-samputa-audio-v1"

export function OfflineDownloadButton({ url, title }: { url: string; title: string }) {
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!("caches" in window)) return
    caches.open(AUDIO_CACHE).then((cache) => cache.match(url)).then((response) => {
      setSaved(!!response)
    }).catch(() => {})
  }, [url])

  async function saveOffline() {
    if (!("caches" in window) || saved || busy) return
    setBusy(true)
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error("Audio download failed")
      const cache = await caches.open(AUDIO_CACHE)
      await cache.put(url, response)
      setSaved(true)
    } catch (error) {
      console.error("Offline audio download failed", error)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={saveOffline}
      disabled={saved || busy}
      className="shrink-0 p-1 text-[var(--muted)] transition-colors hover:text-[var(--foreground)] disabled:cursor-default disabled:opacity-70"
      aria-label={saved ? `${title} is available offline` : `Save ${title} offline`}
      title={saved ? "Available offline" : "Save offline"}
    >
      {saved ? <Check size={16} weight="bold" /> : <DownloadSimple size={16} />}
    </button>
  )
}
