"use client"

import { useState } from "react"
import { ChevronDown, Plus } from "lucide-react"
import { NotebookEditor } from "@/components/notebook/NotebookEditor"
import { NotePage, fmtTimestamp, type NotebookNote } from "@/components/notebook/NotePage"

type LectureGroup = {
  lecture: { id: string; title: string; mediaType: "AUDIO" | "VIDEO" }
  notes: NotebookNote[]
}

function parseTimestamp(input: string) {
  const [m, s] = input.split(":").map((part) => Number(part.trim()))
  if (Number.isNaN(m)) return 0
  return Math.max(0, m * 60 + (Number.isNaN(s) ? 0 : s))
}

export function NotesAccordion({ groups: initialGroups }: { groups: LectureGroup[] }) {
  const [groups, setGroups] = useState(initialGroups)
  const [openId, setOpenId] = useState<string | null>(initialGroups[0]?.lecture.id ?? null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [addingForLecture, setAddingForLecture] = useState<string | null>(null)
  const [newTimestamp, setNewTimestamp] = useState("0:00")
  const [saving, setSaving] = useState(false)

  async function saveEdit(lectureId: string, id: string, payload: { content: string; color: string; drawing: string | null }) {
    setSaving(true)
    const response = await fetch("/api/notes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...payload }),
    })
    if (response.ok) {
      const updated = await response.json() as NotebookNote
      setGroups((current) => current.map((g) => (
        g.lecture.id === lectureId ? { ...g, notes: g.notes.map((n) => (n.id === id ? updated : n)) } : g
      )))
      setEditingId(null)
    }
    setSaving(false)
  }

  async function deleteNote(lectureId: string, id: string) {
    setGroups((current) => current.map((g) => (
      g.lecture.id === lectureId ? { ...g, notes: g.notes.filter((n) => n.id !== id) } : g
    )))
    await fetch(`/api/notes?id=${encodeURIComponent(id)}`, { method: "DELETE" })
  }

  async function addNote(lectureId: string, payload: { content: string; color: string; drawing: string | null }) {
    setSaving(true)
    const response = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lectureId, timestampS: parseTimestamp(newTimestamp), ...payload }),
    })
    if (response.ok) {
      const note = await response.json() as NotebookNote
      setGroups((current) => current.map((g) => (
        g.lecture.id === lectureId ? { ...g, notes: [note, ...g.notes] } : g
      )))
      setNewTimestamp("0:00")
      setAddingForLecture(null)
    }
    setSaving(false)
  }

  return (
    <div className="flex flex-col gap-3">
      {groups.map(({ lecture, notes }) => {
        const isOpen = openId === lecture.id
        const isAdding = addingForLecture === lecture.id
        const editingNote = notes.find((n) => n.id === editingId) ?? null
        return (
          <div key={lecture.id} className="surface-panel overflow-hidden">
            <button
              onClick={() => setOpenId(isOpen ? null : lecture.id)}
              className="flex w-full items-center gap-2 p-4 text-left"
              aria-expanded={isOpen}
            >
              <span className="text-sm">{lecture.mediaType === "AUDIO" ? "🎙️" : "🎬"}</span>
              <p className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--foreground)]">
                {lecture.title}
              </p>
              <span className="shrink-0 text-xs text-[var(--muted)]">
                {notes.length} {notes.length === 1 ? "note" : "notes"}
              </span>
              <ChevronDown
                size={16}
                className={`shrink-0 text-[var(--muted)] transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isOpen && (
              <div className="flex flex-col gap-3 border-t border-[var(--border)] px-4 pb-4 pt-3">
                {notes.map((note) => (
                  editingNote?.id === note.id ? (
                    <NotebookEditor
                      key={note.id}
                      initialContent={note.content}
                      initialColor={note.color}
                      initialDrawing={note.drawing}
                      timestampLabel={fmtTimestamp(note.timestampS)}
                      saving={saving}
                      onCancel={() => setEditingId(null)}
                      onSave={(payload) => saveEdit(lecture.id, note.id, payload)}
                    />
                  ) : (
                    <NotePage
                      key={note.id}
                      note={note}
                      onEdit={() => setEditingId(note.id)}
                      onDelete={() => deleteNote(lecture.id, note.id)}
                    />
                  )
                ))}

                {isAdding ? (
                  <NotebookEditor
                    timestampLabel={newTimestamp}
                    onTimestampChange={setNewTimestamp}
                    saving={saving}
                    onCancel={() => setAddingForLecture(null)}
                    onSave={(payload) => addNote(lecture.id, payload)}
                  />
                ) : (
                  <button
                    onClick={() => { setAddingForLecture(lecture.id); setNewTimestamp("0:00") }}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--border)] py-2 text-xs font-medium text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  >
                    <Plus size={13} /> Add note
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
