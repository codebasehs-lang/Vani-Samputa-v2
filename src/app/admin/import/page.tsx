"use client"

import { useState, useRef } from "react"
import * as XLSX from "xlsx"
import { toast } from "sonner"
import { Upload, Download, FileSpreadsheet, Mic, Clapperboard, CircleCheck, CircleAlert } from "lucide-react"
import { ADMIN_COLORS, adminGradient } from "@/lib/adminColors"

type Row = Record<string, string>
type ImportResult = { created: number; skipped: number; errors: string[] }

function formatPreviewDate(value: unknown) {
  const serial = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(serial) || serial <= 0) return String(value ?? "")

  const date = XLSX.SSF.parse_date_code(serial)
  if (!date) return String(value ?? "")

  return `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`
}

export default function AdminImportPage() {
  const [mediaType, setMediaType] = useState<"AUDIO" | "VIDEO">("AUDIO")
  const [rows, setRows] = useState<Row[]>([])
  const [result, setResult] = useState<ImportResult | null>(null)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const ab = await file.arrayBuffer()
    const wb = XLSX.read(ab)
    const ws = wb.Sheets[wb.SheetNames[0]]
    const parsed = XLSX.utils.sheet_to_json<Row>(ws, { defval: "" })
    setRows(parsed.slice(0, 200))
    setResult(null)
  }

  async function handleImport() {
    if (!rows.length) return
    setBusy(true)
    setResult(null)
    const res = await fetch("/api/admin/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows, mediaType }),
    })
    const data: ImportResult = await res.json()
    setResult(data)
    setBusy(false)
    if (!res.ok) {
      toast.error("Failed to import lectures.")
      return
    }
    toast.success(`Import complete: ${data.created} created, ${data.skipped} skipped.`)
  }

  function downloadSample() {
    const sampleRows = [
      {
        Title: "Bhagavad Gita Chapter 1 - Lecture 1",
        URL: "https://example.com/audio-lecture-1.mp3",
        "Media Type": "AUDIO",
        Language: "Odia",
        Categories: "Bhagavad Gita",
        Playlist: "Bhagavad Gita - Chapter 1",
        Duration: 1800,
        "Lecture Date": "2026-08-20",
      },
      {
        Title: "Question and Answer Session",
        URL: "https://example.com/audio-lecture-2.mp3",
        "Media Type": "VIDEO",
        Language: "English",
        Categories: "Question & Answer Sessions, Guru Tattva",
        Playlist: "",
        Duration: 2400,
        "Lecture Date": "2026-08-21",
      },
    ]
    const worksheet = XLSX.utils.json_to_sheet(sampleRows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Lectures")
    XLSX.writeFile(workbook, "lecture-upload-template.xlsx")
  }

  const headers = rows.length ? Object.keys(rows[0]) : []

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full text-white" style={{ background: adminGradient(ADMIN_COLORS.import) }}>
          <FileSpreadsheet size={18} strokeWidth={1.75} />
        </span>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Import from Excel</h1>
      </div>

      {/* Type toggle */}
      <div className="mb-4 flex gap-2">
        {(["AUDIO", "VIDEO"] as const).map((t) => {
          const active = mediaType === t
          const color = t === "AUDIO" ? ADMIN_COLORS.articles : ADMIN_COLORS.dashboard
          return (
            <button
              key={t}
              onClick={() => setMediaType(t)}
              style={active ? { background: adminGradient(color) } : undefined}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "text-white"
                  : "border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {t === "AUDIO" ? <Mic size={14} strokeWidth={1.75} /> : <Clapperboard size={14} strokeWidth={1.75} />}
              {t === "AUDIO" ? "Audio" : "Video"}
            </button>
          )
        })}
      </div>

      <div className="admin-panel mb-4 border-dashed p-6 text-center">
        <p className="mb-2 text-sm text-[var(--muted)]">
          Upload .xlsx — columns: <code>Title, URL, Media Type, Language, Categories, Playlist, Duration, Lecture Date</code>
        </p>
        <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFile} className="hidden" />
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            style={{ background: adminGradient(ADMIN_COLORS.import) }}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <Upload size={14} strokeWidth={1.75} /> Choose File
          </button>
          <button
            onClick={downloadSample}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-5 py-2 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-black/5 dark:hover:bg-white/5"
          >
            <Download size={14} strokeWidth={1.75} /> Download Sample Excel
          </button>
        </div>
      </div>

      {/* Preview */}
      {rows.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-sm text-[var(--muted)]">{rows.length} rows loaded (showing first 5)</p>
          <div className="admin-panel overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-[var(--surface)]">
                <tr>
                  {headers.map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-semibold text-[var(--muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 5).map((row, i) => (
                  <tr key={i} className="border-t border-[var(--border)]">
                      {headers.map((h) => {
                        const isLectureDate = ["lecture date", "lecture_date", "date", "event date"].includes(h.toLowerCase())
                        const value = isLectureDate ? formatPreviewDate(row[h]) : String(row[h] ?? "")
                        return <td key={h} className="max-w-[200px] truncate px-3 py-2 text-[var(--foreground)]">{value}</td>
                      })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleImport}
            disabled={busy}
            style={{ background: adminGradient(ADMIN_COLORS.import) }}
            className="mt-4 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-60"
          >
            {busy ? "Importing…" : `Import All ${rows.length} Rows`}
          </button>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="admin-panel p-4">
          <p className="text-sm font-semibold text-[var(--foreground)]">Import complete</p>
          <p className="flex items-center gap-1.5 text-sm text-green-600"><CircleCheck size={13} strokeWidth={1.75} /> {result.created} created</p>
          <p className="text-sm text-[var(--muted)]">⊘ {result.skipped} skipped (duplicates)</p>
          {result.errors.length > 0 && (
            <div className="mt-2 text-xs text-red-500">
              <p className="flex items-center gap-1.5"><CircleAlert size={13} strokeWidth={1.75} /> {result.errors.length} errors</p>
              <ul className="mt-1 list-disc pl-4">
                {result.errors.map((error, index) => <li key={index}>{error}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
