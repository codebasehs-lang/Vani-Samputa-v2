"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { X } from "lucide-react"
import { formatDuration } from "@/lib/duration"
import { ADMIN_COLORS, adminGradient } from "@/lib/adminColors"

const LANGUAGES = ["Odia", "Hindi", "English"]
const MEDIA_TYPES = ["AUDIO", "VIDEO"]

export type EditableLecture = {
  id: string
  title: string
  url: string
  mediaType: string
  language: string
  description: string | null
  duration: number | null
  lectureDate: Date | null
  playlist: { title: string } | null
  categories: { name: string }[]
}

const EMPTY_FORM = {
  title: "", url: "", mediaType: "AUDIO", language: "Odia",
  categories: "", playlistName: "", duration: "", description: "", lectureDate: "",
}

function formToInitial(lecture: EditableLecture | null) {
  if (!lecture) return EMPTY_FORM
  return {
    title: lecture.title,
    url: lecture.url,
    mediaType: lecture.mediaType,
    language: lecture.language,
    categories: lecture.categories.map((c) => c.name).join(", "),
    playlistName: lecture.playlist?.title ?? "",
    duration: formatDuration(lecture.duration),
    description: lecture.description ?? "",
    lectureDate: lecture.lectureDate ? new Date(lecture.lectureDate).toISOString().slice(0, 10) : "",
  }
}

export function EditLectureModal({ lecture, onClose }: { lecture: EditableLecture | null; onClose: () => void }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState(() => formToInitial(lecture))
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => lecture?.categories.map((c) => c.name) ?? [])

  useEffect(() => {
    void fetch("/api/admin/categories").then(async (res) => {
      if (res.ok) setAvailableCategories((await res.json() as { name: string }[]).map((c) => c.name))
    })
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [onClose])

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function addCategory(name: string) {
    if (!name || selectedCategories.includes(name)) return
    setSelectedCategories((current) => [...current, name])
  }

  function removeCategory(name: string) {
    setSelectedCategories((current) => current.filter((c) => c !== name))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!lecture) return
    setBusy(true)
    setError("")
    const res = await fetch(`/api/admin/lectures?id=${lecture.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, categories: selectedCategories.join(", ") }),
    })
    setBusy(false)
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      const message = data?.error ?? "Failed to save."
      setError(message)
      toast.error(message)
      return
    }
    toast.success("Lecture updated.")
    onClose()
    router.refresh()
  }

  if (!lecture) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-lecture-title"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div
        className="relative w-full max-w-xl rounded-xl border border-[var(--border)] p-5 shadow-xl sm:p-6"
        style={{ background: "var(--surface)" }}
      >
        <h2 id="edit-lecture-title" className="mb-5 text-lg font-bold text-[var(--foreground)]">
          Edit Lecture
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { key: "title", label: "Title", type: "text", required: true },
            { key: "url", label: "URL / YouTube ID", type: "text", required: true },
            { key: "playlistName", label: "Playlist Name", type: "text" },
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

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Categories</label>
            {selectedCategories.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {selectedCategories.map((name) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1 rounded-full bg-[var(--accent)]/10 px-2.5 py-1 text-xs font-medium text-[var(--accent)]"
                  >
                    {name}
                    <button
                      type="button"
                      onClick={() => removeCategory(name)}
                      aria-label={`Remove ${name}`}
                      className="rounded-full p-0.5 hover:bg-[var(--accent)]/20"
                    >
                      <X size={11} strokeWidth={2} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <select
              value=""
              onChange={(e) => addCategory(e.target.value)}
              className="admin-select w-full px-4 py-2.5 text-sm"
            >
              <option value="">Add a category...</option>
              {availableCategories.filter((name) => !selectedCategories.includes(name)).map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {[
            { key: "duration", label: "Duration (HH:MM:SS)", type: "text" },
            { key: "lectureDate", label: "Lecture Date", type: "date" },
            { key: "description", label: "Description", type: "text" },
          ].map(({ key, label, type }) => (
            <div key={key}>
              <label className="mb-1 block text-xs font-medium text-[var(--muted)]">{label}</label>
              <input
                type={type}
                value={form[key as keyof typeof form]}
                onChange={(e) => set(key, e.target.value)}
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
                {MEDIA_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Language</label>
              <select
                value={form.language}
                onChange={(e) => set("language", e.target.value)}
                className="admin-select w-full px-4 py-2.5 text-sm"
              >
                {LANGUAGES.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-lg border border-[var(--border)] px-3.5 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-40 dark:hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              style={{ background: adminGradient(ADMIN_COLORS.lectures) }}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-60"
            >
              {busy ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
