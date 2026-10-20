"use client"

import { Fragment, useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { ChevronDown, Trash2, X } from "lucide-react"
import { ConfirmDialog } from "@/components/admin/ConfirmDialog"
import { PlaylistLectures } from "@/components/admin/PlaylistLectures"

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
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [language, setLanguage] = useState("")
  const [mediaType, setMediaType] = useState("")
  const [category, setCategory] = useState("")
  const [deleting, setDeleting] = useState<Playlist | null>(null)
  const [busy, setBusy] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const updateLectureCount = useCallback((id: string, count: number) => {
    setPlaylists((current) => current.map((playlist) => playlist.id === id
      ? { ...playlist, _count: { lectures: count } }
      : playlist
    ))
  }, [])

  function toggleExpanded(id: string) {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        const [playlistResponse, categoryResponse] = await Promise.all([
          fetch("/api/admin/playlists", { signal: controller.signal }),
          fetch("/api/admin/categories", { signal: controller.signal }),
        ])
        if (!playlistResponse.ok || !categoryResponse.ok) {
          throw new Error("Could not load playlists and categories. Please reload to try again.")
        }
        const playlistData: Playlist[] = await playlistResponse.json()
        const categoryData: { name: string }[] = await categoryResponse.json()
        if (controller.signal.aborted) return
        setPlaylists(playlistData)
        setAvailableCategories(categoryData.map((c) => c.name))
      } catch (error) {
        if (controller.signal.aborted) return
        setLoadError(error instanceof Error ? error.message : "Could not load playlists.")
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [])

  async function updateCategories(id: string, categories: string[]) {
    if (busy) return
    setBusy(true)
    try {
      const response = await fetch("/api/admin/playlists", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, categories }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error ?? "Could not update playlist category.")
      }
      const updated: Playlist = await response.json()
      setPlaylists((current) => current.map((pl) => pl.id === id ? updated : pl))
      toast.success("Playlist category updated.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update playlist category.")
    } finally {
      setBusy(false)
    }
  }

  async function deletePlaylist() {
    if (!deleting || busy) return
    setBusy(true)
    try {
      const response = await fetch(`/api/admin/playlists?id=${encodeURIComponent(deleting.id)}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error ?? "Could not delete playlist.")
      }
      const data: { deletedLectures: number } = await response.json()
      setPlaylists((current) => current.filter((pl) => pl.id !== deleting.id))
      setDeleting(null)
      toast.success(`Playlist and ${data.deletedLectures} associated lecture${data.deletedLectures === 1 ? "" : "s"} deleted.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete playlist.")
    } finally {
      setBusy(false)
    }
  }

  function addCategory(playlist: Playlist, name: string) {
    if (!name || playlist.categories.some((c) => c.name === name)) return
    void updateCategories(playlist.id, [...playlist.categories.map((c) => c.name), name])
  }

  function removeCategory(playlist: Playlist, name: string) {
    void updateCategories(playlist.id, playlist.categories.map((c) => c.name).filter((c) => c !== name))
  }

  if (loading) return <p className="text-sm text-[var(--muted)]">Loading playlists...</p>
  if (loadError) return <p role="alert" className="text-sm text-red-500">{loadError}</p>

  const languages = [...new Set(playlists.map((playlist) => playlist.language))].sort()
  const categoryNames = [...new Set([
    ...availableCategories,
    ...playlists.flatMap((playlist) => playlist.categories.map((c) => c.name)),
  ])].sort()
  const query = search.trim().toLocaleLowerCase()
  const filteredPlaylists = playlists.filter((playlist) =>
    (!query || playlist.title.toLocaleLowerCase().includes(query)) &&
    (!language || playlist.language === language) &&
    (!mediaType || playlist.mediaType === mediaType) &&
    (!category || (category === "__uncategorized__"
      ? playlist.categories.length === 0
      : playlist.categories.some((c) => c.name === category)))
  )
  const hasFilters = Boolean(search || language || mediaType || category)

  return (
    <>
    <div className="admin-panel mb-4 p-4 sm:p-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label className="text-xs font-medium text-[var(--muted)]">
          Search playlists
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title..."
            className="admin-input mt-1.5 w-full px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs font-medium text-[var(--muted)]">
          Language
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="admin-select mt-1.5 w-full px-3 py-2 text-sm">
            <option value="">All languages</option>
            {languages.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>
        <label className="text-xs font-medium text-[var(--muted)]">
          Media type
          <select value={mediaType} onChange={(e) => setMediaType(e.target.value)} className="admin-select mt-1.5 w-full px-3 py-2 text-sm">
            <option value="">All types</option>
            <option value="AUDIO">Audio</option>
            <option value="VIDEO">Video</option>
          </select>
        </label>
        <label className="text-xs font-medium text-[var(--muted)]">
          Category
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="admin-select mt-1.5 w-full px-3 py-2 text-sm">
            <option value="">All categories</option>
            <option value="__uncategorized__">No categories</option>
            {categoryNames.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p aria-live="polite" className="text-xs text-[var(--muted)]">
          Showing {filteredPlaylists.length} of {playlists.length} playlists
        </p>
        {hasFilters && (
          <button
            type="button"
            onClick={() => { setSearch(""); setLanguage(""); setMediaType(""); setCategory("") }}
            className="text-xs font-medium text-[var(--accent)] hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
    <div className="admin-panel overflow-x-auto">
      <table className="min-w-[900px] w-full text-sm">
        <thead className="bg-[var(--surface)]">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Title</th>
            <th className="w-24 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Language</th>
            <th className="w-20 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Type</th>
            <th className="w-20 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Lectures</th>
            <th className="min-w-[320px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Categories</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {!filteredPlaylists.length && (
            <tr>
              <td colSpan={6} className="px-4 py-10 text-center text-[var(--muted)]">
                {playlists.length ? "No playlists match your filters." : "No playlists yet."}
              </td>
            </tr>
          )}
          {filteredPlaylists.map((playlist) => (
            <Fragment key={playlist.id}>
            <tr>
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
                        disabled={busy}
                        onClick={() => removeCategory(playlist, c.name)}
                        aria-label={`Remove ${c.name} from ${playlist.title}`}
                        className="rounded-full p-0.5 hover:bg-[var(--accent)]/20 disabled:opacity-40"
                      >
                        <X size={11} strokeWidth={2} />
                      </button>
                    </span>
                  ))}
                  {!playlist.categories.length && <span className="text-xs text-[var(--muted)]">No categories</span>}
                </div>
                <select
                  value=""
                  disabled={busy}
                  aria-label={`Add a category to ${playlist.title}`}
                  onChange={(e) => addCategory(playlist, e.target.value)}
                  className="admin-select w-full max-w-[220px] px-3 py-1.5 text-xs disabled:opacity-40"
                >
                  <option value="">Add a category...</option>
                  {availableCategories.filter((name) => !playlist.categories.some((c) => c.name === name)).map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => toggleExpanded(playlist.id)}
                  aria-expanded={expanded.has(playlist.id)}
                  aria-controls={`playlist-lectures-${playlist.id}`}
                  aria-label={`${expanded.has(playlist.id) ? "Collapse" : "Expand"} lectures in ${playlist.title}`}
                  className="mb-1 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent)]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                >
                  <ChevronDown size={14} className={expanded.has(playlist.id) ? "rotate-180" : ""} />
                  {expanded.has(playlist.id) ? "Collapse" : "Expand"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setDeleting(playlist)}
                  aria-label={`Delete playlist ${playlist.title}`}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-40"
                >
                  <Trash2 size={14} strokeWidth={1.75} /> Delete
                </button>
              </td>
            </tr>
            {expanded.has(playlist.id) && (
              <tr>
                <td colSpan={6} className="bg-[var(--surface)]">
                  <PlaylistLectures playlist={playlist} onCountChange={updateLectureCount} />
                </td>
              </tr>
            )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
    <ConfirmDialog
      open={deleting !== null}
      title="Delete playlist and its lectures?"
      description={deleting
        ? `Deleting "${deleting.title}" permanently deletes this playlist and all its associated lectures (currently ${deleting._count.lectures}), including their saved notes, favorites, history, and progress. This cannot be undone.`
        : undefined}
      confirmLabel="Delete playlist"
      danger
      busy={busy}
      onConfirm={() => void deletePlaylist()}
      onCancel={() => { if (!busy) setDeleting(null) }}
    />
    </>
  )
}
