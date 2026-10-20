"use client"

import { useEffect, useState } from "react"
import { Pencil, Plus } from "lucide-react"
import { EditLectureModal, type EditableLecture, type LecturePlaylist } from "@/components/admin/EditLectureModal"
import { DeleteLectureButton } from "@/components/admin/DeleteLectureButton"
import { formatDuration } from "@/lib/duration"

export function PlaylistLectures({ playlist, onCountChange }: {
  playlist: LecturePlaylist
  onCountChange: (id: string, count: number) => void
}) {
  const [lectures, setLectures] = useState<EditableLecture[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [revision, setRevision] = useState(0)
  const [editor, setEditor] = useState<{ lecture: EditableLecture | null } | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      setLoading(true)
      setError("")
      try {
        const response = await fetch(`/api/admin/lectures?playlistId=${encodeURIComponent(playlist.id)}`, {
          signal: controller.signal,
        })
        if (!response.ok) throw new Error("Could not load playlist lectures. Please try again.")
        const data: { lectures: EditableLecture[]; total: number } = await response.json()
        if (controller.signal.aborted) return
        setLectures(data.lectures)
        onCountChange(playlist.id, data.total)
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(error instanceof Error ? error.message : "Could not load playlist lectures.")
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [playlist.id, revision, onCountChange])

  function refresh() {
    setLoading(true)
    setRevision((current) => current + 1)
  }

  return (
    <section id={`playlist-lectures-${playlist.id}`} aria-label={`Lectures in ${playlist.title}`} className="p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-semibold text-[var(--foreground)]">Lectures in {playlist.title}</h2>
        <button
          type="button"
          onClick={() => setEditor({ lecture: null })}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          <Plus size={14} /> Add Lecture
        </button>
      </div>
      {loading ? (
        <p role="status" className="text-sm text-[var(--muted)]">Loading lectures...</p>
      ) : error ? (
        <div role="alert" className="text-sm text-red-500">
          <p>{error}</p>
          <button type="button" onClick={refresh} className="mt-2 underline">Retry</button>
        </div>
      ) : lectures.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No lectures in this playlist yet. Add the first lecture above.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--muted)]">
              {["Title", "Duration", "Lecture date", "Categories", "Actions"].map((heading) => (
                <th key={heading} scope="col" className="px-3 py-2">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {lectures.map((lecture) => (
              <tr key={lecture.id}>
                <td className="px-3 py-2.5 text-[var(--foreground)]">{lecture.title}</td>
                <td className="px-3 py-2.5 text-[var(--muted)]">{formatDuration(lecture.duration) || "—"}</td>
                <td className="px-3 py-2.5 text-[var(--muted)]">
                  {lecture.lectureDate ? new Date(lecture.lectureDate).toISOString().slice(0, 10) : "—"}
                </td>
                <td className="px-3 py-2.5 text-[var(--muted)]">{lecture.categories.map((c) => c.name).join(", ") || "—"}</td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditor({ lecture })}
                      aria-label={`Edit lecture ${lecture.title}`}
                      className="rounded-lg p-1.5 text-[var(--muted)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                    >
                      <Pencil size={15} strokeWidth={1.75} />
                    </button>
                    <DeleteLectureButton id={lecture.id} onDeleted={refresh} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {editor && (
        <EditLectureModal
          key={editor.lecture?.id ?? "new"}
          lecture={editor.lecture}
          playlist={playlist}
          onSaved={refresh}
          onClose={() => setEditor(null)}
        />
      )}
    </section>
  )
}
