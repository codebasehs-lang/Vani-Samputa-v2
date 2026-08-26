"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

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
    const res = await fetch("/api/admin/live", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setBusy(false)
    if (!res.ok) {
      toast.error("Failed to save live config.")
      return
    }
    setSaved(true)
    toast.success("Live config saved.")
    setTimeout(() => setSaved(false), 3000)
    router.refresh()
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <Field label="YouTube Channel ID">
        <input
          value={form.channelId}
          onChange={(e) => set("channelId", e.target.value)}
          className="admin-input w-full px-4 py-2.5 text-sm"
          placeholder="UCxxxxxxxxxxxxxxxxxxxxxxxx"
        />
      </Field>
      <Field label="Live Stream URL (YouTube video URL or ID)">
        <input
          value={form.streamUrl}
          onChange={(e) => set("streamUrl", e.target.value)}
          className="admin-input w-full px-4 py-2.5 text-sm"
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
        className="admin-gradient-accent rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-60"
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
