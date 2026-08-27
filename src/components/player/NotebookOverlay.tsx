"use client"

import { useEffect, useState } from "react"
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

  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col gap-5 overflow-y-auto px-4 py-6">
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
          />
        ) : (
          <NotebookEditor
            key={`composer-${notes.length}`}
            timestampLabel={composerTimestamp}
            onTimestampChange={setComposerTimestamp}
            saving={saving}
            onSave={createNote}
          />
        )}

        <div className="flex flex-col gap-4">
          {loading ? (
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
          )}
        </div>
    </div>
  )
}
