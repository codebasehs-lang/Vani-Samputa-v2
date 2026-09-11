"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { NotebookEditor } from "@/components/notebook/NotebookEditor"
import { NotePage, fmtTimestamp, type NotebookNote } from "@/components/notebook/NotePage"

function parseTimestamp(input: string) {
  const [m, s] = input.split(":").map((part) => Number(part.trim()))
  if (Number.isNaN(m)) return 0
  return Math.max(0, m * 60 + (Number.isNaN(s) ? 0 : s))
}

export function NotebookOverlay({
  lectureId,
  lectureTitle,
  positionS,
}: {
  lectureId: string
  lectureTitle: string
  positionS: number
}) {
  const [notes, setNotes] = useState<NotebookNote[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showSaved, setShowSaved] = useState(false)
  // captured once when the notebook opens; the player's live position keeps ticking underneath
  const [composerTimestamp, setComposerTimestamp] = useState(() => fmtTimestamp(positionS))

  useEffect(() => {
    let cancelled = false
    fetch(`/api/notes?lectureId=${encodeURIComponent(lectureId)}`)
      .then((response) => (response.ok ? response.json() : []))
      .then((data: NotebookNote[]) => { if (!cancelled) setNotes(data) })
      .catch(() => { if (!cancelled) setNotes([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [lectureId])

  async function createNote(payload: { content: string; color: string; drawing: string | null }) {
    setSaving(true)
    const response = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lectureId, timestampS: parseTimestamp(composerTimestamp), ...payload }),
    })
    if (response.ok) {
      const note = await response.json() as NotebookNote
      setNotes((current) => [note, ...current])
      setComposerTimestamp(fmtTimestamp(positionS))
    }
    setSaving(false)
  }

  async function updateNote(id: string, payload: { content: string; color: string; drawing: string | null }) {
    setSaving(true)
    const response = await fetch("/api/notes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...payload }),
    })
    if (response.ok) {
      const updated = await response.json() as NotebookNote
      setNotes((current) => current.map((n) => (n.id === id ? updated : n)))
      setEditingId(null)
    }
    setSaving(false)
  }

  async function deleteNote(id: string) {
    setNotes((current) => current.filter((n) => n.id !== id))
    await fetch(`/api/notes?id=${encodeURIComponent(id)}`, { method: "DELETE" })
  }

  const editingNote = notes.find((n) => n.id === editingId) ?? null

  const savedNotesList = loading ? (
    <p className="text-center text-xs text-[var(--muted)]">Loading notes…</p>
  ) : notes.length === 0 ? (
    <div className="empty-state py-10 text-center text-sm">
      No notes yet — pick a pen colour above and write your first one.
    </div>
  ) : (
    notes.map((note) => (
      <NotePage
        key={note.id}
        note={note}
        onEdit={() => setEditingId(note.id)}
        onDelete={() => deleteNote(note.id)}
      />
    ))
  )

  return (
    <div className="relative flex h-full w-full flex-col overflow-y-auto px-4 py-6 md:overflow-hidden md:px-10 lg:px-16">
      {/* Notebook editor — full width */}
      <div className="flex w-full min-w-0 flex-1 flex-col gap-5 md:h-full md:min-h-0 md:overflow-y-auto md:pr-2">
        <p className="truncate text-center text-xs text-[var(--muted)]">{lectureTitle}</p>
        {editingNote ? (
          <NotebookEditor
            key={editingNote.id}
            initialContent={editingNote.content}
            initialColor={editingNote.color}
            initialDrawing={editingNote.drawing}
            timestampLabel={fmtTimestamp(editingNote.timestampS)}
            saving={saving}
            onCancel={() => setEditingId(null)}
            onSave={(payload) => updateNote(editingNote.id, payload)}
            className="flex-1"
          />
        ) : (
          <NotebookEditor
            key={`composer-${notes.length}`}
            timestampLabel={composerTimestamp}
            onTimestampChange={setComposerTimestamp}
            saving={saving}
            onSave={createNote}
            className="flex-1"
          />
        )}

        {/* Saved notes stay inline on mobile — no room for a side drawer */}
        <div className="flex flex-col gap-4 md:hidden">{savedNotesList}</div>
      </div>

      {/* Tab to reveal the saved-notes drawer (desktop only) */}
      <button
        onClick={() => setShowSaved(true)}
        className="fixed right-0 top-1/2 z-10 hidden -translate-y-1/2 items-center gap-1.5 rounded-l-xl border border-r-0 border-[var(--border)] bg-[var(--surface)] px-2 py-4 text-[11px] font-semibold uppercase tracking-widest text-[var(--muted)] shadow-lg transition-all hover:text-[var(--foreground)] md:flex"
        style={{ writingMode: "vertical-rl", visibility: showSaved ? "hidden" : "visible" }}
        aria-label="Show saved notes"
      >
        Saved Notes{notes.length > 0 ? ` (${notes.length})` : ""}
      </button>

      {/* Saved-notes drawer (desktop) */}
      <div
        className={`fixed inset-y-0 right-0 z-20 hidden w-[340px] flex-col gap-4 overflow-y-auto border-l border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl transition-transform duration-300 md:flex ${
          showSaved ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Saved Notes</h3>
          <button
            onClick={() => setShowSaved(false)}
            aria-label="Close saved notes"
            className="rounded-full p-1 text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
          >
            <X size={16} />
          </button>
        </div>
        {savedNotesList}
      </div>
    </div>
  )
}
