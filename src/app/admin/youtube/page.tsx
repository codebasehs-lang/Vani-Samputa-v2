"use client"

import { AdminPageHeader } from "@/components/admin/AdminPageHeader"
import { UploadDateRangePicker } from "@/components/admin/UploadDateRangePicker"
import { ADMIN_COLORS, adminGradient } from "@/lib/adminColors"
import { CircleAlert, CircleCheck, Download, ExternalLink, RefreshCw, Upload, Video, X } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import * as XLSX from "xlsx"

// Categories are stored as a comma-separated string (e.g. "Goswami, Kirtan") since a
// playlist/lecture can belong to more than one category.
function splitCategoryNames(value: string | null | undefined): string[] {
  if (!value) return []
  return [...new Set(value.split(",").map((name) => name.trim()).filter(Boolean))]
}

function getSortRank(row: StagedVideo) {
  return row.customSortOrder ?? row.ytPlaylistPosition ?? Number.MAX_SAFE_INTEGER
}

function getImportSortOrder(row: StagedVideo) {
  return row.customSortOrder ?? row.ytPlaylistPosition ?? 0
}

type Status = "NEW" | "APPROVED" | "SKIPPED" | "IMPORTED"

type StagedVideo = {
  videoId: string
  title: string
  description: string | null
  thumbnail: string | null
  duration: number | null
  publishedAt: string | null
  ytPlaylistPosition: number | null
  customSortOrder: number | null
  ytPlaylistTitle: string | null
  detectedLanguage: string
  detectedCategory: string
  language: string | null
  category: string | null
  playlistTitle: string | null
  status: Status
}

type ImportResult = { created: number; skipped: number; errors: string[] }
type OrderUpdate = { videoId: string; customSortOrder: number }

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
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [savingEdits, setSavingEdits] = useState(false)
  const invalidRange = Boolean(from || to) && (!from || !to || from > to)

  useEffect(() => {
    void loadStaging().catch((error) => toast.error(error instanceof Error ? error.message : "Could not load cached videos."))
  }, [])

  async function loadStaging(videoIds?: string[]) {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/youtube-staging")
      if (!response.ok) throw new Error("Could not load cached videos.")
      const data = await response.json() as { categories: string[]; videos: StagedVideo[] }
      const matched = videoIds ? new Set(videoIds) : null
      setCategories(data.categories)
      setRows(matched ? data.videos.filter((video) => matched.has(video.videoId)) : data.videos)
    } finally {
      setLoading(false)
    }
  }

  async function handleSync() {
    if (busy) return
    if (invalidRange) {
      toast.error("Enter both dates, with From on or before To.")
      return
    }
    setBusy(true)
    setResult(null)
    setLog(from ? `Fetching videos uploaded ${from} to ${to} (UTC)...` : "Fetching latest videos from YouTube...")
    try {
      const response = await fetch("/api/admin/youtube-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(from ? { from, to } : {}),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? "Could not fetch YouTube data.")
      await loadStaging(data.videoIds)
      setLog(`${data.fetched} videos synced${from ? ` for ${from} to ${to} (UTC)` : ""}. ${data.inserted} new, ${data.updated} refreshed.`)
      toast.success(`Sync complete: ${data.inserted} new, ${data.updated} refreshed.`)
    } catch (error) {
      setLog("Sync could not complete.")
      toast.error(error instanceof Error ? error.message : "Could not fetch YouTube data.")
    } finally {
      setBusy(false)
    }
  }

  async function patchRow(videoId: string, changes: Partial<Pick<StagedVideo, "language" | "category" | "playlistTitle" | "status" | "customSortOrder">>) {
    if (busy || savingEdits) return false
    const groupEdit = playlistFilter !== "ALL" && ["language", "category", "playlistTitle"].some((field) => field in changes)
    const targets = rows.filter((row) => row.status !== "IMPORTED" && (groupEdit
      ? (row.playlistTitle ?? row.ytPlaylistTitle ?? "") === playlistFilter
      : row.videoId === videoId))
    if (!targets.length) return false
    const reviewed = { ...changes, ...(changes.playlistTitle !== undefined ? { playlistTitle: changes.playlistTitle?.trim() ?? "" } : {}) }
    if (targets.every((row) => Object.entries(reviewed).every(([field, value]) => {
      const current = field === "playlistTitle" ? row.playlistTitle ?? row.ytPlaylistTitle ?? ""
        : field === "language" ? row.language ?? row.detectedLanguage
          : field === "category" ? row.category ?? row.detectedCategory
            : row[field as keyof StagedVideo]
      return current === value
    }))) return true
    const videoIds = targets.map((row) => row.videoId)
    setSavingEdits(true)
    try {
      const response = await fetch("/api/admin/youtube-staging", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(groupEdit ? { videoIds, ...reviewed } : { videoId, ...reviewed }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? "Could not save change.")
      const selected = new Set(videoIds)
      setRows((current) => current.map((row) => selected.has(row.videoId) ? { ...row, ...reviewed } : row))
      if (groupEdit && reviewed.playlistTitle !== undefined) setPlaylistFilter(reviewed.playlistTitle || "ALL")
      if (groupEdit) toast.success(`Updated ${result.updated} videos in the selected playlist.`)
      return true
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save playlist changes.")
      return false
    } finally {
      setSavingEdits(false)
    }
  }

  function toggleApproved(row: StagedVideo) {
    if (row.status === "IMPORTED") return
    return patchRow(row.videoId, { status: row.status === "APPROVED" ? "NEW" : "APPROVED" })
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

  async function persistOrderUpdates(orderUpdates: OrderUpdate[]) {
    if (!orderUpdates.length) return
    setRows((current) => current.map((row) => {
      const update = orderUpdates.find((item) => item.videoId === row.videoId)
      return update ? { ...row, customSortOrder: update.customSortOrder } : row
    }))
    const response = await fetch("/api/admin/youtube-staging", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderUpdates }),
    })
    if (!response.ok) toast.error("Could not save playlist order; refresh and try again.")
  }

  function applyPlaylistOrder(videoId: string, requestedOrder: number) {
    const currentRows = playlistOrderRows
    const currentIndex = currentRows.findIndex((row) => row.videoId === videoId)
    if (currentIndex === -1) return
    const nextIndex = Math.min(Math.max(Math.trunc(requestedOrder) - 1, 0), currentRows.length - 1)
    const reordered = [...currentRows]
    const [moved] = reordered.splice(currentIndex, 1)
    reordered.splice(nextIndex, 0, moved)
    void persistOrderUpdates(reordered.map((row, index) => ({ videoId: row.videoId, customSortOrder: index + 1 })))
  }

  async function handleImport() {
    const selectedRows = rows
      .filter((row) => row.status === "APPROVED" && Boolean(row.category ?? row.detectedCategory))
      .sort((a, b) => {
        const playlistComparison = (a.playlistTitle ?? a.ytPlaylistTitle ?? "").localeCompare(b.playlistTitle ?? b.ytPlaylistTitle ?? "")
        if (playlistComparison !== 0) return playlistComparison
        return getSortRank(a) - getSortRank(b)
      })
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
          sortOrder: getImportSortOrder(row),
          customSortOrder: row.customSortOrder,
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
      Tags: row.category ?? row.detectedCategory,
      Playlist: row.playlistTitle ?? row.ytPlaylistTitle ?? "",
      Duration: row.duration ?? "",
      "Lecture Date": row.publishedAt ? row.publishedAt.slice(0, 10) : "",
      Place: "",
      Order: getImportSortOrder(row),
      Status: row.status,
    }))
    const worksheet = XLSX.utils.json_to_sheet(exportRows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "YouTube Videos")
    XLSX.writeFile(workbook, "youtube-sync-export.xlsx")
  }

  const languageOptions = [...new Set(rows.map((row) => row.language ?? row.detectedLanguage))].sort()
  const categoryOptions = [...new Set(rows.flatMap((row) => splitCategoryNames(row.category ?? row.detectedCategory)))].sort()
  const playlistOptions = [...new Set(rows.map((row) => row.playlistTitle ?? row.ytPlaylistTitle ?? "").filter(Boolean))].sort()

  const statusFilteredRows = filter === "ALL" ? rows : rows.filter((row) => row.status === filter)
  const search = searchText.trim().toLowerCase()
  const canCustomizePlaylistOrder = filter === "ALL" && playlistFilter !== "ALL" && !search && languageFilter === "ALL" && categoryFilter === "ALL"
  const filteredRows = statusFilteredRows.filter((row) => {
    if (search && !row.title.toLowerCase().includes(search) && !row.videoId.toLowerCase().includes(search)) return false
    if (languageFilter !== "ALL" && (row.language ?? row.detectedLanguage) !== languageFilter) return false
    if (categoryFilter !== "ALL" && !splitCategoryNames(row.category ?? row.detectedCategory).includes(categoryFilter)) return false
    if (playlistFilter !== "ALL" && (row.playlistTitle ?? row.ytPlaylistTitle ?? "") !== playlistFilter) return false
    return true
  }).sort((a, b) => canCustomizePlaylistOrder ? getSortRank(a) - getSortRank(b) : 0)
  const playlistOrderRows = canCustomizePlaylistOrder ? filteredRows : []
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
      <AdminPageHeader title="YouTube Sync" section="Publishing" Icon={Video} color={ADMIN_COLORS.youtube} detail={`${rows.length} cached videos · ${counts.APPROVED} approved`} />

      <p className="mb-6 max-w-3xl text-sm text-[var(--muted)]">
        Videos are cached locally from your last sync, so this page loads instantly without calling the YouTube API.
        Click Sync to pull in new videos. Review, approve, or skip rows at your own pace — your decisions are saved
        automatically. Only approved rows are ever written to the lecture database.
      </p>

      <fieldset className="mb-4 border-y border-[var(--border)] py-4">
        <legend className="px-1 text-xs font-semibold text-[var(--foreground)]">Upload date range (UTC)</legend>
        <UploadDateRangePicker from={from} to={to} disabled={busy || savingEdits} onChange={(range) => { setFrom(range.from); setTo(range.to) }} />
        {invalidRange && <p role="alert" className="mt-2 text-xs text-red-500">Enter both dates, with From on or before To.</p>}
      </fieldset>

      <div className="mb-6 grid min-w-0 grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-center">
        <button
          onClick={handleSync}
          disabled={busy || savingEdits || loading || invalidRange}
          style={{ background: adminGradient(ADMIN_COLORS.youtube) }}
          className="inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          <RefreshCw size={15} strokeWidth={1.75} className={busy ? "animate-spin" : ""} />
          {busy ? "Syncing..." : from && to ? "Sync date range" : "Sync from YouTube"}
        </button>
        <button
          onClick={() => void handleImport()}
          disabled={busy || savingEdits || counts.APPROVED === 0}
          style={{ background: adminGradient(ADMIN_COLORS.import) }}
          className="inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          <Upload size={15} strokeWidth={1.75} /> Import {counts.APPROVED} Approved
        </button>
        {rows.length > 0 && (
          <button
            onClick={handleExport}
            className="admin-input inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-[var(--admin-hover)]"
          >
            <Download size={15} strokeWidth={1.75} /> Export to Excel
          </button>
        )}
      </div>

      {log && <p role="status" className="mb-4 text-sm text-[var(--muted)]">{log}</p>}
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
                disabled={busy || savingEdits}
                onClick={() => setFilter(tab.key)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${filter === tab.key ? "text-white" : "border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]"}`}
                style={filter === tab.key ? { background: adminGradient(ADMIN_COLORS.youtube) } : undefined}
              >
                {tab.label} ({counts[tab.key]})
              </button>
            ))}
          </div>

          <div className="mb-4 grid min-w-0 grid-cols-1 items-center gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <input
              value={searchText}
              disabled={savingEdits}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search title or video ID..."
              aria-label="Search YouTube videos"
              className="admin-input w-full min-w-0 px-3 py-1.5 text-sm"
            />
            <select disabled={savingEdits} aria-label="Filter YouTube language" value={languageFilter} onChange={(event) => setLanguageFilter(event.target.value)} className="admin-input w-full min-w-0 px-3 py-1.5 text-sm">
              <option value="ALL">All languages</option>
              {languageOptions.map((language) => <option key={language} value={language}>{language}</option>)}
            </select>
            <select disabled={savingEdits} aria-label="Filter YouTube tags" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="admin-input w-full min-w-0 px-3 py-1.5 text-sm">
              <option value="ALL">All tags</option>
              {categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <select disabled={savingEdits} aria-label="Filter YouTube playlist" value={playlistFilter} onChange={(event) => setPlaylistFilter(event.target.value)} className="admin-input w-full min-w-0 px-3 py-1.5 text-sm">
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
            {playlistFilter !== "ALL" && !canCustomizePlaylistOrder && (
              <span className="text-sm text-[var(--muted)]">Use the All tab and clear search/language/tag filters to customize full playlist order.</span>
            )}
          </div>

          <div role="region" aria-label="YouTube videos table" tabIndex={0} className="admin-panel max-h-[70dvh] max-w-full overflow-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]">
            <table className={`${canCustomizePlaylistOrder ? "min-w-[1250px]" : "min-w-[1150px]"} w-full text-xs`}>
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
                  <th className="w-44 px-3 py-3 text-left">Tags</th>
                  <th className="w-48 px-3 py-3 text-left">Playlist</th>
                  {canCustomizePlaylistOrder && <th className="w-32 px-3 py-3 text-left">Order</th>}
                  <th className="w-20 px-3 py-3 text-left">Duration</th>
                  <th className="w-28 px-3 py-3 text-left">Status</th>
                  <th className="w-24 px-3 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, index) => {
                  const effectiveLanguage = row.language ?? row.detectedLanguage
                  const selectedCategories = splitCategoryNames(row.category ?? row.detectedCategory).filter((name) => categories.includes(name))
                  const effectivePlaylist = row.playlistTitle ?? row.ytPlaylistTitle ?? ""
                  const locked = row.status === "IMPORTED" || busy || savingEdits
                  const visibleOrder = index + 1
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
                          aria-label={`Language for ${row.title}`}
                          onChange={(event) => patchRow(row.videoId, { language: event.target.value })}
                          className="admin-input w-full px-2 py-1.5"
                        >
                          {languages.map((language) => <option key={language}>{language}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-3">
                        <CategoryCell
                          selected={selectedCategories}
                          options={categories}
                          disabled={locked}
                          onChange={(next) => patchRow(row.videoId, { category: next.join(", ") })}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <input
                          key={`${row.videoId}-${effectivePlaylist}`}
                          defaultValue={effectivePlaylist}
                          disabled={locked}
                          aria-label={`Playlist for ${row.title}`}
                          onBlur={async (event) => {
                            const input = event.currentTarget
                            const saved = await patchRow(row.videoId, { playlistTitle: input.value })
                            if (!saved) input.value = effectivePlaylist
                          }}
                          className="admin-input w-full px-2 py-1.5"
                        />
                      </td>
                      {canCustomizePlaylistOrder && (
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1.5">
                            <input
                              key={`${row.videoId}-${visibleOrder}`}
                              type="number"
                              min={1}
                              max={playlistOrderRows.length}
                              defaultValue={visibleOrder}
                              onBlur={(event) => applyPlaylistOrder(row.videoId, Number(event.target.value))}
                              className="admin-input w-16 px-2 py-1.5"
                              aria-label={`Order for ${row.title}`}
                            />
                            <button
                              type="button"
                              onClick={() => applyPlaylistOrder(row.videoId, visibleOrder - 1)}
                              disabled={visibleOrder <= 1}
                              className="text-[10px] font-medium text-[var(--accent)] disabled:text-[var(--muted)]"
                            >
                              Up
                            </button>
                            <button
                              type="button"
                              onClick={() => applyPlaylistOrder(row.videoId, visibleOrder + 1)}
                              disabled={visibleOrder >= playlistOrderRows.length}
                              className="text-[10px] font-medium text-[var(--accent)] disabled:text-[var(--muted)]"
                            >
                              Down
                            </button>
                          </div>
                        </td>
                      )}
                      <td className="px-3 py-3 text-[var(--muted)]">{formatDuration(row.duration)}</td>
                      <td className="px-3 py-3">
                        <StatusBadge status={row.status} hasCategory={selectedCategories.length > 0} />
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

function CategoryCell({
  selected,
  options,
  disabled,
  onChange,
}: {
  selected: string[]
  options: string[]
  disabled: boolean
  onChange: (next: string[]) => void
}) {
  return (
    <div className="min-w-[160px]">
      {selected.length > 0 && (
        <div className="mb-1 flex flex-wrap gap-1">
          {selected.map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-1 rounded-full bg-[var(--accent)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--accent)]"
            >
              {name}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => onChange(selected.filter((n) => n !== name))}
                  aria-label={`Remove ${name}`}
                  className="rounded-full hover:bg-[var(--accent)]/20"
                >
                  <X size={10} strokeWidth={2} />
                </button>
              )}
            </span>
          ))}
        </div>
      )}
      <select
        value=""
        disabled={disabled}
        onChange={(event) => {
          const value = event.target.value
          if (!value || selected.includes(value)) return
          onChange([...selected, value])
        }}
        className="admin-input w-full px-2 py-1.5"
      >
        <option value="">{selected.length ? "Add tag" : "Choose tag"}</option>
        {options.filter((name) => !selected.includes(name)).map((category) => <option key={category}>{category}</option>)}
      </select>
    </div>
  )
}

function StatusBadge({ status, hasCategory }: { status: Status; hasCategory: boolean }) {
  if (status === "IMPORTED") return <span className="text-green-600">Imported</span>
  if (status === "SKIPPED") return <span className="text-[var(--muted)]">Skipped</span>
  if (status === "APPROVED") {
    return hasCategory
      ? <span className="text-green-600">Approved</span>
      : <span className="inline-flex items-center gap-1 text-red-500"><CircleAlert size={12} /> Choose tag</span>
  }
  return <span className="text-[var(--muted)]">New</span>
}

function formatDuration(seconds: number | null) {
  if (!seconds) return "-"
  const minutes = Math.floor(seconds / 60)
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`
}
