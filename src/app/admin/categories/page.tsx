"use client"

import { AdminPageHeader } from "@/components/admin/AdminPageHeader"
import { ADMIN_COLORS, adminGradient } from "@/lib/adminColors"
import { createTagWorkbook, readTagWorkbook, type TagImportRow } from "@/lib/tagSpreadsheet"
import { Check, Download, Pencil, Plus, Tag, Upload, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import * as XLSX from "xlsx"

type Category = { id: string; name: string }

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [busy, setBusy] = useState(false)
  const [importRows, setImportRows] = useState<TagImportRow[]>([])
  const [importFile, setImportFile] = useState("")
  const [processed, setProcessed] = useState(0)
  const [importResult, setImportResult] = useState<{ imported: number; failed: number; errors: string[] } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function exportTags() {
    setError("")
    setBusy(true)
    try {
      const res = await fetch("/api/admin/categories", { cache: "no-store" })
      if (!res.ok) throw new Error("Could not load tags for export.")
      const tags: Category[] = await res.json()
      XLSX.writeFile(createTagWorkbook(tags), "tags-export.xls", { bookType: "biff8" })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not export tags.")
    } finally {
      setBusy(false)
    }
  }

  async function selectImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    setError("")
    setImportResult(null)
    setImportRows([])
    setImportFile("")
    setProcessed(0)
    setBusy(true)
    try {
      if (!/\.xlsx?$/i.test(file.name)) throw new Error("Select an .xls or .xlsx file.")
      if (file.size > 5 * 1024 * 1024) throw new Error("Select a spreadsheet smaller than 5 MB.")
      setImportRows(readTagWorkbook(await file.arrayBuffer()))
      setImportFile(file.name)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not read the spreadsheet.")
    } finally {
      setBusy(false)
    }
  }

  async function importTags() {
    if (!importRows.length || busy) return
    setBusy(true)
    setError("")
    setImportResult(null)
    setProcessed(0)
    const summary = { imported: 0, failed: 0, errors: [] as string[] }
    try {
      for (const [index, row] of importRows.entries()) {
        const res = await fetch("/api/admin/categories", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: row.name }),
        })
        const result = await res.json()
        if (res.ok) summary.imported++
        else {
          summary.failed++
          if (summary.errors.length < 10) summary.errors.push(`Row ${row.row} (${row.name}): ${result.error ?? "Could not import tag"}`)
        }
        setProcessed(index + 1)
      }
      setImportRows([])
      setImportFile("")
    } catch {
      setError("Import interrupted. Some tags may already be saved; you can safely retry the same file.")
    } finally {
      setImportResult(summary)
      try { await load() } catch { setError("Could not refresh tags. Reload the page to see saved changes.") }
      setBusy(false)
    }
  }

  async function load() {
    const res = await fetch("/api/admin/categories")
    if (!res.ok) throw new Error("Could not load tags")
    setCategories(await res.json())
  }

  useEffect(() => {
    void fetch("/api/admin/categories").then(async (res) => {
      if (!res.ok) throw new Error("Could not load tags")
      setCategories(await res.json())
    }).catch(() => setError("Could not load tags"))
  }, [])

  async function addCategory(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setBusy(true)
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }),
      })
      if (!res.ok) { setError((await res.json()).error ?? "Could not create tag"); return }
      setName("")
      await load()
    } catch {
      setError("Could not create tag. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  async function saveCategory(e: React.FormEvent, id: string) {
    e.preventDefault()
    setError("")
    setBusy(true)
    try {
      const res = await fetch("/api/admin/categories", {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, name: editName }),
      })
      const result = await res.json()
      if (!res.ok) { setError(result.error ?? "Could not rename tag"); return }
      setCategories((current) => current.map((category) => category.id === id ? result : category)
        .sort((first, second) => first.name.localeCompare(second.name)))
      setEditingId(null)
    } catch {
      setError("Could not rename tag. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  async function deactivate(id: string) {
    setError("")
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/categories?id=${id}`, { method: "DELETE" })
      if (!res.ok) { setError("Could not deactivate tag"); return }
      await load()
    } catch {
      setError("Could not deactivate tag. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-4xl">
      <AdminPageHeader title="Tags" section="Library" Icon={Tag} color={ADMIN_COLORS.categories} detail={`${categories.length} active tags`} actions={<>
        <button type="button" disabled={busy} onClick={exportTags} title="Export tags to XLS" className="admin-input flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50"><Download size={16} />Export XLS</button>
        <button type="button" disabled={busy} onClick={() => fileRef.current?.click()} title="Select a tags spreadsheet" className="admin-input flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50"><Upload size={16} />Import Excel</button>
        <input ref={fileRef} type="file" accept=".xls,.xlsx" aria-label="Tags spreadsheet" disabled={busy} onChange={selectImport} className="hidden" />
      </>} />
      {importRows.length > 0 && (
        <div className="mb-6 border-y border-[var(--border)] py-4">
          <p className="mb-3 break-words text-sm text-[var(--foreground)]">{importFile} · {importRows.length} unique tags</p>
          <div className="mb-3 max-h-48 overflow-y-auto">
            <table className="w-full table-fixed text-left text-sm text-[var(--foreground)]">
              <thead><tr><th className="w-16 px-2 py-1">Row</th><th className="px-2 py-1">Name</th></tr></thead>
              <tbody>{importRows.slice(0, 50).map((row) => <tr key={row.row}><td className="px-2 py-1 text-[var(--muted)]">{row.row}</td><td className="break-words px-2 py-1">{row.name}</td></tr>)}</tbody>
            </table>
          </div>
          {importRows.length > 50 && <p className="mb-3 text-xs text-[var(--muted)]">Showing the first 50 tags.</p>}
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" disabled={busy} onClick={importTags} className="btn-accent flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50"><Upload size={16} />{busy ? `Importing ${processed}/${importRows.length}` : "Import tags"}</button>
            <button type="button" disabled={busy} onClick={() => { setImportRows([]); setImportFile("") }} className="flex items-center gap-1 px-2 py-2 text-sm text-[var(--muted)] disabled:opacity-50"><X size={16} />Cancel</button>
          </div>
        </div>
      )}
      {importResult && (
        <div className="mb-4 text-sm">
          <p role="status" className="text-[var(--foreground)]">{importResult.imported} tags imported; {importResult.failed} failed.</p>
          {importResult.errors.length > 0 && <ul role="alert" className="mt-2 space-y-1 text-xs text-red-500">{importResult.errors.map((message) => <li key={message} className="break-words">{message}</li>)}</ul>}
        </div>
      )}
      <form onSubmit={addCategory} className="mb-6 flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tag name" aria-label="New tag name" required maxLength={191} disabled={busy} className="admin-input min-w-0 flex-1 px-4 py-2.5 text-sm" />
        <button disabled={busy} style={{ background: adminGradient(ADMIN_COLORS.categories) }} className="flex items-center gap-1.5 rounded-md px-4 py-2.5 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-50"><Plus size={16} aria-hidden="true" />Add</button>
      </form>
      {error && <p role="alert" className="mb-4 text-xs text-red-500">{error}</p>}
      <div className="admin-panel divide-y divide-[var(--border)]">
        {categories.map((category) => (
          <div key={category.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm text-[var(--foreground)]">
            {editingId === category.id ? (
              <form onSubmit={(event) => void saveCategory(event, category.id)} className="flex min-w-0 flex-1 items-center gap-2">
                <input autoFocus value={editName} onChange={(event) => setEditName(event.target.value)} aria-label="Edit tag name" required maxLength={191} disabled={busy} onKeyDown={(event) => {
                  if (event.key === "Escape" && !busy) setEditingId(null)
                }} className="admin-input min-w-0 flex-1 px-3 py-2 text-sm" />
                <button type="submit" disabled={busy || !editName.trim()} aria-label="Save tag" title="Save tag" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-50"><Check size={18} /></button>
                <button type="button" disabled={busy} onClick={() => setEditingId(null)} aria-label="Cancel editing" title="Cancel editing" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-50"><X size={18} /></button>
              </form>
            ) : (
              <>
                <span className="min-w-0 flex-1 break-words">{category.name}</span>
                <button type="button" disabled={busy} onClick={() => { setEditingId(category.id); setEditName(category.name); setError("") }} aria-label={`Edit ${category.name}`} title="Edit tag" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--muted)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-50"><Pencil size={16} /></button>
                <button type="button" disabled={busy} onClick={() => void deactivate(category.id)} className="shrink-0 text-xs text-red-500 hover:underline disabled:opacity-50">Deactivate</button>
              </>
            )}
          </div>
        ))}
        {!categories.length && <p className="px-4 py-6 text-sm text-[var(--muted)]">No tags yet.</p>}
      </div>
    </div>
  )
}
