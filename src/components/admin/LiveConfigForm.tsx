"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Props {
  id?: string
  channelId: string
  streamUrl: string
  isLive: boolean
  autoFetch: boolean
}

export function LiveConfigForm(props: Props) {
  const router = useRouter()
  const [form, setForm] = useState(props)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  function set<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    await fetch("/api/admin/live", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setBusy(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    router.refresh()
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <Field label="YouTube Channel ID">
        <input
          value={form.channelId}
          onChange={(e) => set("channelId", e.target.value)}
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--saffron)]"
          placeholder="UCxxxxxxxxxxxxxxxxxxxxxxxx"
        />
      </Field>
      <Field label="Live Stream URL (YouTube video URL or ID)">
        <input
          value={form.streamUrl}
          onChange={(e) => set("streamUrl", e.target.value)}
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--saffron)]"
          placeholder="https://youtube.com/live/xxxx or video ID"
        />
      </Field>
      <Field label="Status">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isLive}
            onChange={(e) => set("isLive", e.target.checked)}
            className="accent-[var(--saffron)]"
          />
          <span className="text-[var(--foreground)]">Mark as Live right now</span>
        </label>
      </Field>
      <Field label="Auto-Detect">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.autoFetch}
            onChange={(e) => set("autoFetch", e.target.checked)}
            className="accent-[var(--saffron)]"
          />
          <span className="text-[var(--foreground)]">Auto-detect live via YouTube API</span>
        </label>
      </Field>
      <button
        type="submit"
        disabled={busy}
        className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        style={{ background: "var(--saffron)" }}
      >
        {busy ? "Saving…" : saved ? "✓ Saved" : "Save Config"}
      </button>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-[var(--muted)]">{label}</label>
      {children}
    </div>
  )
}
