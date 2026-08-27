"use client"

import { Pencil, Trash2 } from "lucide-react"

export interface NotebookNote {
  id: string
  content: string
  color: string
  drawing: string | null
  timestampS: number
  createdAt: string
}

export function fmtTimestamp(s: number) {
  const m = Math.floor(s / 60)
  return `${m}:${Math.floor(s % 60).toString().padStart(2, "0")}`
}

function readableTextColor(hex: string | null | undefined) {
  const value = (hex ?? "").replace("#", "")
  if (value.length !== 6) return "#1a1a3e"
  const r = parseInt(value.slice(0, 2), 16)
  const g = parseInt(value.slice(2, 4), 16)
  const b = parseInt(value.slice(4, 6), 16)
  if ([r, g, b].some(Number.isNaN)) return "#1a1a3e"
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? "#1a1a3e" : "#ffffff"
}

export function NotePage({
  note,
  onEdit,
  onDelete,
}: {
  note: NotebookNote
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="notebook-paper notebook-shadow overflow-hidden rounded-2xl border border-[var(--border)]">
      <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--surface)]/70 px-4 py-2">
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{ background: note.color || "#FFD700", color: readableTextColor(note.color) }}
        >
          {fmtTimestamp(note.timestampS)}
        </span>
        <p className="text-[10px] text-[var(--muted)]">
          {new Date(note.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </p>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={onEdit} aria-label="Edit note" className="icon-btn p-1.5">
            <Pencil size={13} />
          </button>
          <button
            onClick={onDelete}
            aria-label="Delete note"
            className="rounded-full p-1.5 text-[var(--muted)] transition-colors hover:text-red-500"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="px-6 py-4">
        {note.content && (
          <div
            className="text-sm leading-8 text-[var(--foreground)]"
            dangerouslySetInnerHTML={{ __html: note.content }}
          />
        )}
        {note.drawing && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={note.drawing} alt="Handwritten note" className="mt-2 max-h-64 w-full rounded-lg object-contain" />
        )}
      </div>
    </div>
  )
}
