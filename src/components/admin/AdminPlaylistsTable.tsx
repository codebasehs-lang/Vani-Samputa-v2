"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { X } from "lucide-react"

type Playlist = {
  id: string
  title: string
  language: string
  mediaType: string
  categories: { name: string }[]
  _count: { lectures: number }
}

export function AdminPlaylistsTable() {
  const [loading, setLoading] = useState(true)
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [availableCategories, setAvailableCategories] = useState<string[]>([])

  useEffect(() => {
    void Promise.all([
      fetch("/api/admin/playlists").then((res) => res.ok ? res.json() : []),
      fetch("/api/admin/categories").then((res) => res.ok ? res.json() : []),
    ]).then(([playlistData, categoryData]: [Playlist[], { name: string }[]]) => {
      setPlaylists(playlistData)
      setAvailableCategories(categoryData.map((c) => c.name))
      setLoading(false)
    })
  }, [])

  async function updateCategories(id: string, categories: string[]) {
    setPlaylists((current) => current.map((pl) => pl.id === id ? { ...pl, categories: categories.map((name) => ({ name })) } : pl))
    const response = await fetch("/api/admin/playlists", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, categories }),
    })
    if (!response.ok) {
      const data = await response.json().catch(() => null)
      toast.error(data?.error ?? "Could not update playlist category.")
      return
    }
    toast.success("Playlist category updated.")
  }

  function addCategory(playlist: Playlist, name: string) {
    if (!name || playlist.categories.some((c) => c.name === name)) return
    void updateCategories(playlist.id, [...playlist.categories.map((c) => c.name), name])
  }

  function removeCategory(playlist: Playlist, name: string) {
    void updateCategories(playlist.id, playlist.categories.map((c) => c.name).filter((c) => c !== name))
  }

  if (loading) return <p className="text-sm text-[var(--muted)]">Loading playlists...</p>
  if (!playlists.length) return <p className="text-sm text-[var(--muted)]">No playlists yet.</p>

  return (
    <div className="admin-panel overflow-x-auto">
      <table className="min-w-[900px] w-full text-sm">
        <thead className="bg-[var(--surface)]">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Title</th>
            <th className="w-24 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Language</th>
            <th className="w-20 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Type</th>
            <th className="w-20 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Videos</th>
            <th className="min-w-[320px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Categories</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {playlists.map((playlist) => (
            <tr key={playlist.id}>
              <td className="max-w-xs truncate px-4 py-3 font-medium text-[var(--foreground)]">{playlist.title}</td>
              <td className="px-4 py-3 text-[var(--muted)]">{playlist.language}</td>
              <td className="px-4 py-3 text-[var(--muted)]">{playlist.mediaType}</td>
              <td className="px-4 py-3 text-[var(--muted)]">{playlist._count.lectures}</td>
              <td className="px-4 py-3">
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {playlist.categories.map((c) => (
                    <span key={c.name} className="inline-flex items-center gap-1 rounded-full bg-[var(--accent)]/10 px-2.5 py-1 text-xs font-medium text-[var(--accent)]">
                      {c.name}
                      <button
                        type="button"
                        onClick={() => removeCategory(playlist, c.name)}
                        aria-label={`Remove ${c.name} from ${playlist.title}`}
                        className="rounded-full p-0.5 hover:bg-[var(--accent)]/20"
                      >
                        <X size={11} strokeWidth={2} />
                      </button>
                    </span>
                  ))}
                  {!playlist.categories.length && <span className="text-xs text-[var(--muted)]">No categories</span>}
                </div>
                <select
                  value=""
                  onChange={(e) => addCategory(playlist, e.target.value)}
                  className="admin-select w-full max-w-[220px] px-3 py-1.5 text-xs"
                >
                  <option value="">Add a category...</option>
                  {availableCategories.filter((name) => !playlist.categories.some((c) => c.name === name)).map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
