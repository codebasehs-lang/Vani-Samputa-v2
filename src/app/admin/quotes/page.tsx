"use client"

import { useRef, useState } from "react"
import * as XLSX from "xlsx"

type Row = Record<string, string>

type ImportResult = {
  created: number
  updated: number
  skipped: number
  errors: string[]
}

function two(n: number) {
  return String(n).padStart(2, "0")
}

function buildMonthRows(year: number, month: number) {
  const daysInMonth = new Date(year, month, 0).getDate()
  return Array.from({ length: daysInMonth }, (_, i) => ({
    Date: `${year}-${two(month)}-${two(i + 1)}`,
    Quote: "",
    Source: "",
    Sanskrit: "",
    Devanagari: "",
    Odia: "",
    Hindi: "",
    English: "",
  }))
}

export default function AdminQuotesPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [rows, setRows] = useState<Row[]>([])
  const [result, setResult] = useState<ImportResult | null>(null)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function downloadTemplate() {
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(buildMonthRows(year, month))
    XLSX.utils.book_append_sheet(wb, ws, "DailyQuotes")
    XLSX.writeFile(wb, `daily-quotes-${year}-${two(month)}.xlsx`)
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const ab = await file.arrayBuffer()
    const wb = XLSX.read(ab)
    const ws = wb.Sheets[wb.SheetNames[0]]
    const parsed = XLSX.utils.sheet_to_json<Row>(ws, {
      defval: "",
      raw: false,
      dateNF: "yyyy-mm-dd",
    })

    setRows(parsed.slice(0, 366))
    setResult(null)
  }

  async function importQuotes() {
    if (!rows.length) return
    setBusy(true)
    setResult(null)

    const res = await fetch("/api/admin/quotes/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    })

    const data = await res.json() as ImportResult
    setResult(data)
    setBusy(false)
  }

  const headers = rows.length > 0 ? Object.keys(rows[0]) : []

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-[var(--foreground)]">Daily Quotes Import</h1>
      <p className="mb-6 text-sm text-[var(--muted)]">
        Download a month template, fill Quote text date-wise, and upload. Re-uploading the same dates updates existing entries.
      </p>

      <div
        className="mb-5 rounded-xl border border-[var(--border)] p-4"
        style={{ background: "var(--surface)" }}
      >
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">1) Download monthly template</p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm text-[var(--muted)]">
            Year
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value) || now.getFullYear())}
              className="mt-1 block w-28 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--saffron)]"
            />
          </label>
          <label className="text-sm text-[var(--muted)]">
            Month
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="mt-1 block rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--saffron)]"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>
          <button
            onClick={downloadTemplate}
            className="rounded-full px-5 py-2 text-sm font-semibold text-white"
            style={{ background: "var(--saffron)" }}
          >
            Download XLS Template
          </button>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-dashed border-[var(--border)] p-6 text-center">
        <p className="mb-2 text-sm text-[var(--muted)]">
          2) Upload the filled file (.xlsx) with at least <code>Date</code> and <code>Quote</code> columns.
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

      {rows.length > 0 && (
        <div className="mb-5">
          <p className="mb-2 text-sm text-[var(--muted)]">{rows.length} rows loaded (showing first 6)</p>
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
                {rows.slice(0, 6).map((row, i) => (
                  <tr key={i} className="border-t border-[var(--border)]">
                    {headers.map((h) => (
                      <td key={h} className="max-w-[260px] truncate px-3 py-2 text-[var(--foreground)]">
                        {row[h]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={importQuotes}
            disabled={busy}
            className="mt-4 rounded-full px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: "var(--saffron)" }}
          >
            {busy ? "Importing…" : `Import ${rows.length} Rows`}
          </button>
        </div>
      )}

      {result && (
        <div className="rounded-xl border border-[var(--border)] p-4" style={{ background: "var(--surface)" }}>
          <p className="text-sm font-semibold text-[var(--foreground)]">Import complete</p>
          <p className="text-sm text-green-600">Created: {result.created}</p>
          <p className="text-sm text-blue-600">Updated: {result.updated}</p>
          <p className="text-sm text-[var(--muted)]">Skipped: {result.skipped}</p>
          {result.errors.length > 0 && (
            <p className="mt-2 text-xs text-red-500">Errors: {result.errors.length} (showing first few in API response)</p>
          )}
        </div>
      )}
    </div>
  )
}
