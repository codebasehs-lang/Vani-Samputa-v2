"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Mic, Clapperboard, Inbox, Trash2 } from "lucide-react"
import { ConfirmDialog } from "@/components/admin/ConfirmDialog"
import { DeleteLectureButton } from "@/components/admin/DeleteLectureButton"

type Lecture = {
  id: string
  title: string
  mediaType: string
  language: string
  lectureDate: Date | null
  createdAt: Date
  playlist: { title: string } | null
}

export function AdminLecturesTable({ lectures }: { lectures: Lecture[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const allSelected = lectures.length > 0 && selected.size === lectures.length

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(lectures.map((l) => l.id)))
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleBulkDelete() {
    setBusy(true)
    const ids = Array.from(selected)
    const results = await Promise.all(
      ids.map((id) => fetch(`/api/admin/lectures?id=${id}`, { method: "DELETE" }))
    )
    setBusy(false)
    setConfirmOpen(false)
    const failed = results.filter((r) => !r.ok).length
    if (failed > 0) toast.error(`Failed to delete ${failed} of ${ids.length} lectures.`)
    else toast.success(`Deleted ${ids.length} lecture${ids.length === 1 ? "" : "s"}.`)
    setSelected(new Set())
    router.refresh()
  }

  return (
    <>
      {selected.size > 0 && (
        <div className="admin-gradient-surface mb-3 flex items-center justify-between rounded-xl border border-[var(--border)] px-4 py-2.5">
          <p className="text-sm font-medium text-[var(--foreground)]">{selected.size} selected</p>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-500 transition-colors hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <Trash2 size={14} strokeWidth={1.75} /> Delete selected
          </button>
        </div>
      )}

      <div className="admin-panel overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--border)]">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Select all lectures"
                  className="accent-[var(--accent)]"
                />
              </th>
              {["Type", "Title", "Language", "Playlist", "Lecture Date", "Added", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {lectures.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <span
                      className="flex h-12 w-12 items-center justify-center rounded-full"
                      style={{ background: "color-mix(in oklab, var(--accent) 12%, var(--surface) 88%)", color: "var(--accent)" }}
                    >
                      <Inbox size={22} strokeWidth={1.5} />
                    </span>
                    <p className="text-sm font-medium text-[var(--foreground)]">No lectures yet</p>
                    <p className="text-xs text-[var(--muted)]">Add your first lecture to get started.</p>
                  </div>
                </td>
              </tr>
            )}
            {lectures.map((l) => (
              <tr key={l.id} className="transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.03]">
                <td className="px-4 py-2.5">
                  <input
                    type="checkbox"
                    checked={selected.has(l.id)}
                    onChange={() => toggleOne(l.id)}
                    aria-label={`Select ${l.title}`}
                    className="accent-[var(--accent)]"
                  />
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full"
                    style={{ background: "color-mix(in oklab, var(--accent) 12%, var(--surface) 88%)", color: "var(--accent)" }}
                    aria-hidden="true"
                  >
                    {l.mediaType === "AUDIO" ? <Mic size={13} strokeWidth={1.75} /> : <Clapperboard size={13} strokeWidth={1.75} />}
                  </span>
                </td>
                <td className="max-w-xs px-4 py-2.5">
                  <p className="truncate font-medium text-[var(--foreground)]">{l.title}</p>
                </td>
                <td className="px-4 py-2.5 text-[var(--muted)]">{l.language}</td>
                <td className="max-w-[140px] px-4 py-2.5 truncate text-[var(--muted)]">
                  {l.playlist?.title ?? "—"}
                </td>
                <td className="px-4 py-2.5 text-[var(--muted)]">
                  {l.lectureDate ? new Date(l.lectureDate).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-2.5 text-[var(--muted)]">
                  {new Date(l.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-2.5">
                  <DeleteLectureButton id={l.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={`Delete ${selected.size} selected lecture${selected.size === 1 ? "" : "s"}?`}
        description="This cannot be undone."
        confirmLabel="Delete"
        danger
        busy={busy}
        onConfirm={handleBulkDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  )
}
