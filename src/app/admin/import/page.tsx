"use client"

import { useState, useRef } from "react"
import * as XLSX from "xlsx"

type Row = Record<string, string>
type ImportResult = { created: number; skipped: number; errors: string[] }

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
  }

  const headers = rows.length ? Object.keys(rows[0]) : []

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-[var(--foreground)]">Import from Excel</h1>

      {/* Type toggle */}
      <div className="mb-4 flex gap-2">
        {(["AUDIO", "VIDEO"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setMediaType(t)}
            className="rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
            style={
              mediaType === t
                ? { background: "var(--saffron)", color: "#fff" }
                : { border: "1px solid var(--border)", color: "var(--muted)" }
            }
          >
            {t === "AUDIO" ? "🎙️ Audio" : "🎬 Video"}
          </button>
        ))}
      </div>

      <div className="mb-4 rounded-xl border border-dashed border-[var(--border)] p-6 text-center">
        <p className="mb-2 text-sm text-[var(--muted)]">
          Upload .xlsx — columns: <code>Title, URL, Language, Category, Playlist, Duration</code>
        </p>
        <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFile} className="hidden" />
        <button
          onClick={() => fileRef.current?.click()}
          className="rounded-full px-5 py-2 text-sm font-semibold text-white"
          style={{ background: "var(--saffron)" }}
        >
          Choose File
        </button>
      </div>

      {/* Preview */}
      {rows.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-sm text-[var(--muted)]">{rows.length} rows loaded (showing first 5)</p>
          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
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
                    {headers.map((h) => (
                      <td key={h} className="max-w-[200px] truncate px-3 py-2 text-[var(--foreground)]">
                        {row[h]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleImport}
            disabled={busy}
            className="mt-4 rounded-full px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: "var(--saffron)" }}
          >
            {busy ? "Importing…" : `Import All ${rows.length} Rows`}
          </button>
        </div>
      )}

      {/* Result */}
      {result && (
        <div
          className="rounded-xl border border-[var(--border)] p-4"
          style={{ background: "var(--surface)" }}
        >
          <p className="text-sm font-semibold text-[var(--foreground)]">Import complete</p>
          <p className="text-sm text-green-600">✓ {result.created} created</p>
          <p className="text-sm text-[var(--muted)]">⊘ {result.skipped} skipped (duplicates)</p>
          {result.errors.length > 0 && (
            <p className="mt-1 text-xs text-red-500">{result.errors.length} errors</p>
          )}
        </div>
      )}
    </div>
  )
}
