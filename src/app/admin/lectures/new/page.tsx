"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const LANGUAGES = ["Odia", "Hindi", "English"]
const MEDIA_TYPES = ["AUDIO", "VIDEO"]

export default function NewLecturePage() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    title: "", url: "", mediaType: "AUDIO", language: "Odia",
    category: "", playlistName: "", duration: "", description: "",
  })

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError("")
    const res = await fetch("/api/admin/lectures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setBusy(false)
    if (!res.ok) { setError("Failed to save."); return }
    router.push("/admin/lectures")
    router.refresh()
  }

  return (
    <div className="max-w-xl">
      <h1 className="mb-6 text-2xl font-bold text-[var(--foreground)]">Add Lecture</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { key: "title",       label: "Title",          type: "text",   required: true },
          { key: "url",         label: "URL / YouTube ID", type: "text", required: true },
          { key: "playlistName",label: "Playlist Name",  type: "text" },
          { key: "category",    label: "Category",       type: "text" },
          { key: "duration",    label: "Duration (sec)", type: "number" },
          { key: "description", label: "Description",    type: "text" },
        ].map(({ key, label, type, required }) => (
          <div key={key}>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">{label}</label>
            <input
              type={type}
              value={form[key as keyof typeof form]}
              onChange={(e) => set(key, e.target.value)}
              required={required}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--saffron)]"
            />
          </div>
        ))}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Type</label>
            <select
              value={form.mediaType}
              onChange={(e) => set("mediaType", e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)] outline-none"
            >
              {MEDIA_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Language</label>
            <select
              value={form.language}
              onChange={(e) => set("language", e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)] outline-none"
            >
              {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: "var(--saffron)" }}
        >
          {busy ? "Saving…" : "Save Lecture"}
        </button>
      </form>
    </div>
  )
}
