"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function NewArticlePage() {
  const router = useRouter()
  const [form, setForm] = useState({ title: "", slug: "", excerpt: "", body: "", coverUrl: "" })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })) }

  // Auto-generate slug from title
  function handleTitle(v: string) {
    set("title", v)
    if (!form.slug) {
      set("slug", v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError("")
    const res = await fetch("/api/admin/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (!res.ok) { setError("Failed to save."); setBusy(false); return }
    router.push("/admin/articles")
    router.refresh()
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-[var(--foreground)]">New Article</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { k: "title",    label: "Title",     type: "text",     onChange: (v: string) => handleTitle(v), required: true },
          { k: "slug",     label: "Slug",      type: "text",     required: true },
          { k: "excerpt",  label: "Excerpt",   type: "text" },
          { k: "coverUrl", label: "Cover URL", type: "url" },
        ].map(({ k, label, type, required, onChange }) => (
          <div key={k}>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">{label}</label>
            <input
              type={type}
              value={form[k as keyof typeof form]}
              onChange={(e) => (onChange ? onChange(e.target.value) : set(k, e.target.value))}
              required={required}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--saffron)]"
            />
          </div>
        ))}
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Body (Markdown)</label>
          <textarea
            value={form.body}
            onChange={(e) => set("body", e.target.value)}
            rows={12}
            required
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--saffron)] font-mono"
          />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          style={{ background: "var(--saffron)" }}
        >
          {busy ? "Saving…" : "Publish Article"}
        </button>
      </form>
    </div>
  )
}
