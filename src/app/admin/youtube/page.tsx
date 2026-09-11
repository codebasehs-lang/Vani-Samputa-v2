"use client"

import { useEffect, useState } from "react"
import * as XLSX from "xlsx"
import { toast } from "sonner"
import { Video, RefreshCw, CircleCheck, CircleAlert, Upload, Download, ExternalLink } from "lucide-react"
import { ADMIN_COLORS, adminGradient } from "@/lib/adminColors"

type Status = "NEW" | "APPROVED" | "SKIPPED" | "IMPORTED"

type StagedVideo = {
  videoId: string
  title: string
  description: string | null
  thumbnail: string | null
  duration: number | null
  publishedAt: string | null
  ytPlaylistTitle: string | null
  detectedLanguage: string
  detectedCategory: string
  language: string | null
  category: string | null
  playlistTitle: string | null
  status: Status
}

type ImportResult = { created: number; skipped: number; errors: string[] }

const languages = ["Odia", "Hindi", "English", "Sanskrit"]
const filterTabs: { key: Status | "ALL"; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "NEW", label: "New" },
  { key: "APPROVED", label: "Approved" },
  { key: "SKIPPED", label: "Skipped" },
  { key: "IMPORTED", label: "Imported" },
]

export default function AdminYoutubePage() {
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [rows, setRows] = useState<StagedVideo[]>([])
  const [filter, setFilter] = useState<Status | "ALL">("ALL")
  const [searchText, setSearchText] = useState("")
  const [languageFilter, setLanguageFilter] = useState("ALL")
  const [categoryFilter, setCategoryFilter] = useState("ALL")
  const [playlistFilter, setPlaylistFilter] = useState("ALL")
  const [result, setResult] = useState<ImportResult | null>(null)
  const [log, setLog] = useState("")

  useEffect(() => {
    void loadStaging()
  }, [])

  async function loadStaging() {
    setLoading(true)
    const response = await fetch("/api/admin/youtube-staging")
    if (response.ok) {
      const data = await response.json() as { categories: string[]; videos: StagedVideo[] }
      setCategories(data.categories)
      setRows(data.videos)
    }
    setLoading(false)
  }

  async function handleSync() {
    setBusy(true)
    setResult(null)
    setLog("Fetching latest videos from YouTube...")
    const response = await fetch("/api/admin/youtube-preview", { method: "POST" })
    const data = await response.json()
    setLog("")
    if (!response.ok) {
      setBusy(false)
      toast.error(data.error ?? "Could not fetch YouTube data.")
      return
    }
    await loadStaging()
    setBusy(false)
    toast.success(`Sync complete: ${data.inserted} new, ${data.updated} refreshed.`)
  }

  async function patchRow(videoId: string, changes: Partial<Pick<StagedVideo, "language" | "category" | "playlistTitle" | "status">>) {
    setRows((current) => current.map((row) => row.videoId === videoId ? { ...row, ...changes } : row))
    const response = await fetch("/api/admin/youtube-staging", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId, ...changes }),
    })
    if (!response.ok) toast.error("Could not save change; refresh and try again.")
  }

  function toggleApproved(row: StagedVideo) {
    if (row.status === "IMPORTED") return
    void patchRow(row.videoId, { status: row.status === "APPROVED" ? "NEW" : "APPROVED" })
  }

  function toggleSkipped(row: StagedVideo) {
    if (row.status === "IMPORTED") return
    void patchRow(row.videoId, { status: row.status === "SKIPPED" ? "NEW" : "SKIPPED" })
  }

  async function handleBulkStatus(videoIds: string[], status: "APPROVED" | "NEW") {
    if (!videoIds.length) return
    setRows((current) => current.map((row) => videoIds.includes(row.videoId) ? { ...row, status } : row))
    const response = await fetch("/api/admin/youtube-staging", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoIds, status }),
    })
    if (!response.ok) toast.error("Could not save bulk selection; refresh and try again.")
  }

  async function handleImport() {
    const selectedRows = rows.filter((row) => row.status === "APPROVED" && Boolean(row.category ?? row.detectedCategory))
    if (!selectedRows.length) return
    setBusy(true)
    setResult(null)
    const response = await fetch("/api/admin/youtube-import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rows: selectedRows.map((row) => ({
          videoId: row.videoId,
          title: row.title,
          description: row.description ?? "",
          thumbnail: row.thumbnail,
          language: row.language ?? row.detectedLanguage,
          category: row.category ?? row.detectedCategory,
          playlistTitle: row.playlistTitle ?? row.ytPlaylistTitle ?? "",
          duration: row.duration,
          lectureDate: row.publishedAt,
        })),
      }),
    })
    const data = await response.json() as ImportResult & { error?: string }
    setBusy(false)
    if (!response.ok) {
      toast.error(data.error ?? "YouTube import failed.")
      return
    }
    setResult(data)
    await loadStaging()
    toast.success(`${data.created} videos imported.`)
  }

  function handleExport() {
    const exportRows = filteredRows.map((row) => ({
      Title: row.title,
      URL: row.videoId,
      "Media Type": "VIDEO",
      Language: row.language ?? row.detectedLanguage,
      Categories: row.category ?? row.detectedCategory,
      Playlist: row.playlistTitle ?? row.ytPlaylistTitle ?? "",
      Duration: row.duration ?? "",
      "Lecture Date": row.publishedAt ? row.publishedAt.slice(0, 10) : "",
      Status: row.status,
    }))
    const worksheet = XLSX.utils.json_to_sheet(exportRows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "YouTube Videos")
    XLSX.writeFile(workbook, "youtube-sync-export.xlsx")
  }

  const languageOptions = [...new Set(rows.map((row) => row.language ?? row.detectedLanguage))].sort()
  const categoryOptions = [...new Set(rows.map((row) => row.category ?? row.detectedCategory).filter(Boolean))].sort()
  const playlistOptions = [...new Set(rows.map((row) => row.playlistTitle ?? row.ytPlaylistTitle ?? "").filter(Boolean))].sort()

  const statusFilteredRows = filter === "ALL" ? rows : rows.filter((row) => row.status === filter)
  const search = searchText.trim().toLowerCase()
  const filteredRows = statusFilteredRows.filter((row) => {
    if (search && !row.title.toLowerCase().includes(search) && !row.videoId.toLowerCase().includes(search)) return false
    if (languageFilter !== "ALL" && (row.language ?? row.detectedLanguage) !== languageFilter) return false
    if (categoryFilter !== "ALL" && (row.category ?? row.detectedCategory) !== categoryFilter) return false
    if (playlistFilter !== "ALL" && (row.playlistTitle ?? row.ytPlaylistTitle ?? "") !== playlistFilter) return false
    return true
  })
  const eligibleFilteredIds = filteredRows.filter((row) => row.status !== "IMPORTED").map((row) => row.videoId)
  const allFilteredApproved = eligibleFilteredIds.length > 0 && eligibleFilteredIds.every((id) => rows.find((row) => row.videoId === id)?.status === "APPROVED")

  const counts = {
    ALL: rows.length,
    NEW: rows.filter((row) => row.status === "NEW").length,
    APPROVED: rows.filter((row) => row.status === "APPROVED").length,
    SKIPPED: rows.filter((row) => row.status === "SKIPPED").length,
    IMPORTED: rows.filter((row) => row.status === "IMPORTED").length,
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full text-white" style={{ background: adminGradient(ADMIN_COLORS.youtube) }}>
          <Video size={18} strokeWidth={1.75} />
        </span>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">YouTube Import</h1>
      </div>

      <p className="mb-6 max-w-3xl text-sm text-[var(--muted)]">
        Videos are cached locally from your last sync, so this page loads instantly without calling the YouTube API.
        Click Sync to pull in new videos. Review, approve, or skip rows at your own pace — your decisions are saved
        automatically. Only approved rows are ever written to the lecture database.
      </p>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button
          onClick={() => void handleSync()}
          disabled={busy}
          style={{ background: adminGradient(ADMIN_COLORS.youtube) }}
          className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          <RefreshCw size={15} strokeWidth={1.75} className={busy ? "animate-spin" : ""} />
          {busy ? "Syncing..." : "Sync from YouTube"}
        </button>
        <button
          onClick={() => void handleImport()}
          disabled={busy || counts.APPROVED === 0}
          style={{ background: adminGradient(ADMIN_COLORS.import) }}
          className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          <Upload size={15} strokeWidth={1.75} /> Import {counts.APPROVED} Approved
        </button>
        {rows.length > 0 && (
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-6 py-2.5 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-black/5 dark:hover:bg-white/5"
          >
            <Download size={15} strokeWidth={1.75} /> Export to Excel
          </button>
        )}
      </div>

      {log && <p className="mb-4 text-sm text-[var(--muted)]">{log}</p>}
      {loading && <p className="mb-4 text-sm text-[var(--muted)]">Loading cached videos...</p>}

      {!loading && rows.length === 0 && (
        <p className="text-sm text-[var(--muted)]">No videos cached yet. Click &quot;Sync from YouTube&quot; to fetch your channel&apos;s videos.</p>
      )}

      {!loading && rows.length > 0 && (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${filter === tab.key ? "text-white" : "border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]"}`}
                style={filter === tab.key ? { background: adminGradient(ADMIN_COLORS.youtube) } : undefined}
              >
                {tab.label} ({counts[tab.key]})
              </button>
            ))}
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search title or video ID..."
              className="admin-input min-w-[220px] flex-1 px-3 py-1.5 text-sm"
            />
            <select value={languageFilter} onChange={(event) => setLanguageFilter(event.target.value)} className="admin-input px-3 py-1.5 text-sm">
              <option value="ALL">All languages</option>
              {languageOptions.map((language) => <option key={language} value={language}>{language}</option>)}
            </select>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="admin-input px-3 py-1.5 text-sm">
              <option value="ALL">All categories</option>
              {categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <select value={playlistFilter} onChange={(event) => setPlaylistFilter(event.target.value)} className="admin-input px-3 py-1.5 text-sm">
              <option value="ALL">All playlists</option>
              {playlistOptions.map((playlist) => <option key={playlist} value={playlist}>{playlist}</option>)}
            </select>
            {(searchText || languageFilter !== "ALL" || categoryFilter !== "ALL" || playlistFilter !== "ALL") && (
              <button
                onClick={() => { setSearchText(""); setLanguageFilter("ALL"); setCategoryFilter("ALL"); setPlaylistFilter("ALL") }}
                className="text-sm font-medium text-[var(--accent)] hover:underline"
              >
                Clear filters
              </button>
            )}
            {eligibleFilteredIds.length > 0 && (
              <button
                onClick={() => void handleBulkStatus(eligibleFilteredIds, allFilteredApproved ? "NEW" : "APPROVED")}
                className="text-sm font-medium text-[var(--accent)] hover:underline"
              >
                {allFilteredApproved ? `Unapprove all ${eligibleFilteredIds.length} filtered` : `Approve all ${eligibleFilteredIds.length} filtered`}
              </button>
            )}
            <span className="text-sm text-[var(--muted)]">{filteredRows.length} of {rows.length} shown</span>
          </div>

          <div className="admin-panel max-h-[70vh] overflow-auto">
            <table className="min-w-[1150px] w-full text-xs">
              <thead className="sticky top-0 bg-[var(--surface)]">
                <tr>
                  <th className="w-16 px-3 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={allFilteredApproved}
                      disabled={eligibleFilteredIds.length === 0}
                      onChange={() => void handleBulkStatus(eligibleFilteredIds, allFilteredApproved ? "NEW" : "APPROVED")}
                      aria-label="Approve all filtered rows"
                      className="mr-1"
                    />
                    Approve
                  </th>
                  <th className="w-14 px-3 py-3 text-left">Link</th>
                  <th className="min-w-[240px] px-3 py-3 text-left">Title</th>
                  <th className="w-28 px-3 py-3 text-left">Language</th>
                  <th className="w-44 px-3 py-3 text-left">Category</th>
                  <th className="w-48 px-3 py-3 text-left">Playlist</th>
                  <th className="w-20 px-3 py-3 text-left">Duration</th>
                  <th className="w-28 px-3 py-3 text-left">Status</th>
                  <th className="w-24 px-3 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const effectiveLanguage = row.language ?? row.detectedLanguage
                  const effectiveCategory = row.category ?? row.detectedCategory
                  const effectivePlaylist = row.playlistTitle ?? row.ytPlaylistTitle ?? ""
                  const locked = row.status === "IMPORTED"
                  return (
                    <tr key={row.videoId} className="border-t border-[var(--border)] align-top">
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={row.status === "APPROVED"}
                          disabled={locked}
                          onChange={() => toggleApproved(row)}
                          aria-label={`Approve ${row.title}`}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <a
                          href={`https://youtube.com/watch?v=${row.videoId}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Open on YouTube"
                          className="inline-flex items-center justify-center rounded-full border border-[var(--border)] p-1.5 text-[var(--accent)] hover:bg-black/5 dark:hover:bg-white/5"
                        >
                          <ExternalLink size={13} strokeWidth={1.75} />
                        </a>
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-medium text-[var(--foreground)]">{row.title}</p>
                        <p className="mt-1 text-[10px] text-[var(--muted)]">{row.videoId}</p>
                      </td>
                      <td className="px-3 py-3">
                        <select
                          value={effectiveLanguage}
                          disabled={locked}
                          onChange={(event) => void patchRow(row.videoId, { language: event.target.value })}
                          className="admin-input w-full px-2 py-1.5"
                        >
                          {languages.map((language) => <option key={language}>{language}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-3">
                        <select
                          value={categories.includes(effectiveCategory) ? effectiveCategory : ""}
                          disabled={locked}
                          onChange={(event) => void patchRow(row.videoId, { category: event.target.value })}
                          className="admin-input w-full px-2 py-1.5"
                        >
                          <option value="">Choose category</option>
                          {categories.map((category) => <option key={category}>{category}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-3">
                        <input
                          defaultValue={effectivePlaylist}
                          disabled={locked}
                          onBlur={(event) => void patchRow(row.videoId, { playlistTitle: event.target.value })}
                          className="admin-input w-full px-2 py-1.5"
                        />
                      </td>
                      <td className="px-3 py-3 text-[var(--muted)]">{formatDuration(row.duration)}</td>
                      <td className="px-3 py-3">
                        <StatusBadge status={row.status} hasCategory={Boolean(categories.includes(effectiveCategory))} />
                      </td>
                      <td className="px-3 py-3">
                        {!locked && (
                          <button
                            onClick={() => toggleSkipped(row)}
                            className="text-xs font-medium text-[var(--muted)] hover:underline"
                          >
                            {row.status === "SKIPPED" ? "Unskip" : "Skip"}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {result && (
        <div className="admin-panel mt-5 space-y-1 p-4">
          <p className="font-semibold text-[var(--foreground)]">Import complete</p>
          <p className="flex items-center gap-1.5 text-sm text-green-600"><CircleCheck size={14} /> {result.created} videos created</p>
          <p className="text-sm text-[var(--muted)]">{result.skipped} skipped as duplicates</p>
          {result.errors.map((error) => <p key={error} className="text-xs text-red-500">{error}</p>)}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status, hasCategory }: { status: Status; hasCategory: boolean }) {
  if (status === "IMPORTED") return <span className="text-green-600">Imported</span>
  if (status === "SKIPPED") return <span className="text-[var(--muted)]">Skipped</span>
  if (status === "APPROVED") {
    return hasCategory
      ? <span className="text-green-600">Approved</span>
      : <span className="inline-flex items-center gap-1 text-red-500"><CircleAlert size={12} /> Choose category</span>
  }
  return <span className="text-[var(--muted)]">New</span>
}

function formatDuration(seconds: number | null) {
  if (!seconds) return "-"
  const minutes = Math.floor(seconds / 60)
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`
}
