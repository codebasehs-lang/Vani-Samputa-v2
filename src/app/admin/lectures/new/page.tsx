"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Breadcrumbs } from "@/components/admin/Breadcrumbs"
import { ADMIN_COLORS, adminGradient } from "@/lib/adminColors"

const LANGUAGES = ["Odia", "Hindi", "English"]
const MEDIA_TYPES = ["AUDIO", "VIDEO"]

export default function NewLecturePage() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    title: "", url: "", mediaType: "AUDIO", language: "Odia",
    categories: "", playlistName: "", duration: "", description: "", lectureDate: "",
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
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      const message = data?.error ?? "Failed to save."
      setError(message)
      toast.error(message)
      return
    }
    toast.success("Lecture added.")
    router.push("/admin/lectures")
    router.refresh()
  }

  return (
    <div className="max-w-xl">
      <Breadcrumbs items={[{ label: "Lectures", href: "/admin/lectures" }, { label: "Add Lecture" }]} />
      <h1 className="mb-6 text-2xl font-bold text-[var(--foreground)]">Add Lecture</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { key: "title",       label: "Title",          type: "text",   required: true },
          { key: "url",         label: "URL / YouTube ID", type: "text", required: true },
          { key: "playlistName",label: "Playlist Name",  type: "text" },
          { key: "categories",  label: "Categories (comma-separated)", type: "text" },
          { key: "duration",    label: "Duration (HH:MM:SS)", type: "text" },
          { key: "lectureDate", label: "Lecture Date",    type: "date" },
          { key: "description", label: "Description",    type: "text" },
        ].map(({ key, label, type, required }) => (
          <div key={key}>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">{label}</label>
            <input
              type={type}
              value={form[key as keyof typeof form]}
              onChange={(e) => set(key, e.target.value)}
              required={required}
              className="admin-input w-full px-4 py-2.5 text-sm"
            />
          </div>
        ))}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Type</label>
            <select
              value={form.mediaType}
              onChange={(e) => set("mediaType", e.target.value)}
              className="admin-select w-full px-4 py-2.5 text-sm"
            >
              {MEDIA_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Language</label>
            <select
              value={form.language}
              onChange={(e) => set("language", e.target.value)}
              className="admin-select w-full px-4 py-2.5 text-sm"
            >
              {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          style={{ background: adminGradient(ADMIN_COLORS.lectures) }}
          className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save Lecture"}
        </button>
      </form>
    </div>
  )
}
