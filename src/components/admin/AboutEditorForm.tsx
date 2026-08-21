"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type AboutFormValues = {
  title: string
  slug: string
  excerpt: string
  body: string
  coverUrl: string
}

type AboutEditorFormProps = {
  mode: "create" | "edit"
  initial?: AboutFormValues
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function normalizeAboutSlug(value: string) {
  const normalized = toSlug(value)
  if (!normalized) return "about-"
  return normalized.startsWith("about-") ? normalized : `about-${normalized}`
}

export function AboutEditorForm({ mode, initial }: AboutEditorFormProps) {
  const router = useRouter()
  const initialValues: AboutFormValues = initial ?? {
    title: "",
    slug: "about-",
    excerpt: "",
    body: "",
    coverUrl: "",
  }

  const [form, setForm] = useState<AboutFormValues>(initialValues)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const initialSlug = initialValues.slug

  function setField<K extends keyof AboutFormValues>(key: K, value: AboutFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function onTitleChange(value: string) {
    setField("title", value)
    if (mode === "create" && (form.slug === "" || form.slug === "about-")) {
      setField("slug", normalizeAboutSlug(value))
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError("")

    const endpoint =
      mode === "create"
        ? "/api/admin/about"
        : `/api/admin/about?slug=${encodeURIComponent(initialSlug)}`

    const payload: AboutFormValues = {
      ...form,
      slug: mode === "create" ? form.slug : initialSlug,
    }

    const response = await fetch(endpoint, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null
      setError(data?.error ?? "Failed to save About section.")
      setBusy(false)
      return
    }

    router.push("/admin/about")
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Title</label>
        <input
          type="text"
          required
          value={form.title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--saffron)]"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Slug</label>
        <input
          type="text"
          required
          value={form.slug}
          onChange={(e) => setField("slug", normalizeAboutSlug(e.target.value))}
          disabled={mode === "edit"}
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--saffron)] disabled:opacity-60"
        />
        <p className="mt-1 text-[11px] text-[var(--muted)]">About slugs must start with about-</p>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Excerpt</label>
        <input
          type="text"
          value={form.excerpt}
          onChange={(e) => setField("excerpt", e.target.value)}
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--saffron)]"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Cover URL</label>
        <input
          type="url"
          value={form.coverUrl}
          onChange={(e) => setField("coverUrl", e.target.value)}
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--saffron)]"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Body (Markdown)</label>
        <textarea
          rows={12}
          required
          value={form.body}
          onChange={(e) => setField("body", e.target.value)}
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
        {busy ? "Saving..." : mode === "create" ? "Create About Section" : "Save Changes"}
      </button>
    </form>
  )
}