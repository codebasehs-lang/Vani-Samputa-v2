"use client"

import { useRef, useState } from "react"
import * as XLSX from "xlsx"
import { toast } from "sonner"
import { Quote, Download, Upload, CircleCheck, CircleAlert, RefreshCw, Pencil, Trash2, X } from "lucide-react"
import { ADMIN_COLORS, adminGradient } from "@/lib/adminColors"
import { ConfirmDialog } from "@/components/admin/ConfirmDialog"

type Row = Record<string, string>

type ImportResult = {
  created: number
  updated: number
  skipped: number
  errors: string[]
}

type DailyVerseRow = {
  id: string
  date: string
  odia: string | null
  hindi: string | null
  english: string | null
  source: string | null
}

function two(n: number) {
  return String(n).padStart(2, "0")
}

function buildMonthRows(year: number, month: number) {
  const daysInMonth = new Date(year, month, 0).getDate()
  return Array.from({ length: daysInMonth }, (_, i) => ({
    Date: `${year}-${two(month)}-${two(i + 1)}`,
    Source: "",
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

  const [quotes, setQuotes] = useState<DailyVerseRow[] | null>(null)
  const [loadingQuotes, setLoadingQuotes] = useState(false)
  const [editingQuote, setEditingQuote] = useState<DailyVerseRow | null>(null)
  const [editForm, setEditForm] = useState({ source: "", odia: "", hindi: "", english: "" })
  const [savingEdit, setSavingEdit] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

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
    if (!res.ok) {
      toast.error("Failed to import quotes.")
      return
    }
    toast.success(`Imported: ${data.created} created, ${data.updated} updated.`)
  }

  async function fetchQuotes() {
    setLoadingQuotes(true)
    const res = await fetch(`/api/admin/quotes?year=${year}&month=${month}`)
    if (res.ok) setQuotes(await res.json())
    else toast.error("Failed to load quotes.")
    setLoadingQuotes(false)
  }

  function startEdit(q: DailyVerseRow) {
    setEditingQuote(q)
    setEditForm({ source: q.source ?? "", odia: q.odia ?? "", hindi: q.hindi ?? "", english: q.english ?? "" })
  }

  async function saveEdit() {
    if (!editingQuote) return
    setSavingEdit(true)
    const res = await fetch("/api/admin/quotes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingQuote.id, ...editForm }),
    })
    setSavingEdit(false)
    if (!res.ok) { toast.error("Failed to update quote."); return }
    const updated = await res.json() as DailyVerseRow
    setQuotes((current) => current?.map((q) => (q.id === updated.id ? updated : q)) ?? null)
    setEditingQuote(null)
    toast.success("Quote updated.")
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    const res = await fetch(`/api/admin/quotes?id=${deleteId}`, { method: "DELETE" })
    setDeleting(false)
    if (!res.ok) { toast.error("Failed to delete quote."); return }
    setQuotes((current) => current?.filter((q) => q.id !== deleteId) ?? null)
    setDeleteId(null)
    toast.success("Quote deleted.")
  }

  function fmtDate(iso: string) {
    return new Date(iso).toISOString().slice(0, 10)
  }

  const headers = rows.length > 0 ? Object.keys(rows[0]) : []

  return (
    <div>
      <div className="mb-2 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full text-white" style={{ background: adminGradient(ADMIN_COLORS.quotes) }}>
          <Quote size={18} strokeWidth={1.75} />
        </span>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Daily Quotes Import</h1>
      </div>
      <p className="mb-6 text-sm text-[var(--muted)]">
        Download a month template, fill in the verse text date-wise, and upload. Re-uploading the same dates updates existing entries.
      </p>

      <div className="admin-panel mb-5 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">1) Download monthly template</p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm text-[var(--muted)]">
            Year
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value) || now.getFullYear())}
              className="admin-input mt-1 block w-28 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-[var(--muted)]">
            Month
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="admin-select mt-1 block px-3 py-2 text-sm"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>
          <button
            onClick={downloadTemplate}
            style={{ background: adminGradient(ADMIN_COLORS.quotes) }}
            className="flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <Download size={14} strokeWidth={1.75} /> Download XLS Template
          </button>
        </div>
      </div>

      <div className="admin-panel mb-4 border-dashed p-6 text-center">
        <p className="mb-2 text-sm text-[var(--muted)]">
          2) Upload the filled file (.xlsx) with at least <code>Date</code> and one of <code>Odia</code>/<code>Hindi</code>/<code>English</code> columns.
        </p>
        <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFile} className="hidden" />
        <button
          onClick={() => fileRef.current?.click()}
          style={{ background: adminGradient(ADMIN_COLORS.quotes) }}
          className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          <Upload size={14} strokeWidth={1.75} /> Choose File
        </button>
      </div>

      {rows.length > 0 && (
        <div className="mb-5">
          <p className="mb-2 text-sm text-[var(--muted)]">{rows.length} rows loaded (showing first 6)</p>
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
            style={{ background: adminGradient(ADMIN_COLORS.quotes) }}
            className="mt-4 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-60"
          >
            {busy ? "Importing…" : `Import ${rows.length} Rows`}
          </button>
        </div>
      )}

      {result && (
        <div className="admin-panel admin-gradient-surface p-4">
          <p className="text-sm font-semibold text-[var(--foreground)]">Import complete</p>
          <p className="flex items-center gap-1.5 text-sm text-green-600">
            <CircleCheck size={13} strokeWidth={1.75} /> Created: {result.created}
          </p>
          <p className="flex items-center gap-1.5 text-sm text-blue-600">
            <CircleCheck size={13} strokeWidth={1.75} /> Updated: {result.updated}
          </p>
          <p className="text-sm text-[var(--muted)]">Skipped: {result.skipped}</p>
          {result.errors.length > 0 && (
            <div className="mt-2">
              <p className="flex items-center gap-1.5 text-xs text-red-500">
                <CircleAlert size={13} strokeWidth={1.75} /> Errors: {result.errors.length} (showing first few)
              </p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-red-500">
                {result.errors.map((message, i) => (
                  <li key={i}>{message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 3) Browse / manage existing quotes */}
      <div className="admin-panel mt-6 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">3) View existing quotes</p>
        <div className="flex flex-wrap items-end gap-3">
          <p className="text-sm text-[var(--muted)]">
            Using Year <span className="font-semibold text-[var(--foreground)]">{year}</span>, Month{" "}
            <span className="font-semibold text-[var(--foreground)]">{two(month)}</span> from above.
          </p>
          <button
            onClick={fetchQuotes}
            disabled={loadingQuotes}
            style={{ background: adminGradient(ADMIN_COLORS.quotes) }}
            className="flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-60"
          >
            <RefreshCw size={14} strokeWidth={1.75} className={loadingQuotes ? "animate-spin" : ""} />
            {loadingQuotes ? "Fetching…" : "Fetch"}
          </button>
        </div>

        {quotes !== null && (
          quotes.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--muted)]">No quotes found for {year}-{two(month)}.</p>
          ) : (
            <div className="admin-panel mt-4 overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-[var(--surface)]">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-[var(--muted)]">Date</th>
                    <th className="px-3 py-2 text-left font-semibold text-[var(--muted)]">Source</th>
                    <th className="px-3 py-2 text-left font-semibold text-[var(--muted)]">Odia</th>
                    <th className="px-3 py-2 text-left font-semibold text-[var(--muted)]">Hindi</th>
                    <th className="px-3 py-2 text-left font-semibold text-[var(--muted)]">English</th>
                    <th className="px-3 py-2 text-right font-semibold text-[var(--muted)]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((q) => (
                    <tr key={q.id} className="border-t border-[var(--border)]">
                      <td className="whitespace-nowrap px-3 py-2 text-[var(--foreground)]">{fmtDate(q.date)}</td>
                      <td className="max-w-[160px] truncate px-3 py-2 text-[var(--foreground)]">{q.source}</td>
                      <td className="max-w-[220px] truncate px-3 py-2 text-[var(--foreground)]">{q.odia}</td>
                      <td className="max-w-[220px] truncate px-3 py-2 text-[var(--foreground)]">{q.hindi}</td>
                      <td className="max-w-[220px] truncate px-3 py-2 text-[var(--foreground)]">{q.english}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => startEdit(q)}
                            aria-label={`Edit quote for ${fmtDate(q.date)}`}
                            className="rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                          >
                            <Pencil size={14} strokeWidth={1.75} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteId(q.id)}
                            aria-label={`Delete quote for ${fmtDate(q.date)}`}
                            className="rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                          >
                            <Trash2 size={14} strokeWidth={1.75} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Edit quote modal */}
      {editingQuote && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditingQuote(null)} aria-hidden="true" />
          <div className="relative w-full max-w-lg rounded-xl border border-[var(--border)] p-5 shadow-xl" style={{ background: "var(--surface)" }}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--foreground)]">Edit quote — {fmtDate(editingQuote.date)}</h2>
              <button onClick={() => setEditingQuote(null)} aria-label="Close" className="rounded-lg p-1 text-[var(--muted)] hover:text-[var(--foreground)]">
                <X size={16} />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <label className="text-xs text-[var(--muted)]">
                Source
                <input
                  value={editForm.source}
                  onChange={(e) => setEditForm((f) => ({ ...f, source: e.target.value }))}
                  className="admin-input mt-1 block w-full px-3 py-2 text-sm"
                />
              </label>
              <label className="text-xs text-[var(--muted)]">
                Odia
                <textarea
                  value={editForm.odia}
                  onChange={(e) => setEditForm((f) => ({ ...f, odia: e.target.value }))}
                  rows={2}
                  className="admin-input mt-1 block w-full px-3 py-2 text-sm"
                />
              </label>
              <label className="text-xs text-[var(--muted)]">
                Hindi
                <textarea
                  value={editForm.hindi}
                  onChange={(e) => setEditForm((f) => ({ ...f, hindi: e.target.value }))}
                  rows={2}
                  className="admin-input mt-1 block w-full px-3 py-2 text-sm"
                />
              </label>
              <label className="text-xs text-[var(--muted)]">
                English
                <textarea
                  value={editForm.english}
                  onChange={(e) => setEditForm((f) => ({ ...f, english: e.target.value }))}
                  rows={2}
                  className="admin-input mt-1 block w-full px-3 py-2 text-sm"
                />
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setEditingQuote(null)}
                className="rounded-full px-4 py-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={savingEdit}
                style={{ background: adminGradient(ADMIN_COLORS.quotes) }}
                className="rounded-full px-5 py-2 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-60"
              >
                {savingEdit ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete this quote?"
        description="This cannot be undone."
        confirmLabel="Delete"
        danger
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
