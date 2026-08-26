"use client"

import { useEffect, useState } from "react"

type Category = { id: string; name: string }

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [name, setName] = useState("")
  const [error, setError] = useState("")

  async function load() {
    const res = await fetch("/api/admin/categories")
    if (res.ok) setCategories(await res.json())
  }

  useEffect(() => {
    void fetch("/api/admin/categories").then(async (res) => {
      if (res.ok) setCategories(await res.json())
    })
  }, [])

  async function addCategory(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    const res = await fetch("/api/admin/categories", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }),
    })
    if (!res.ok) { setError((await res.json()).error ?? "Could not create category"); return }
    setName("")
    await load()
  }

  async function deactivate(id: string) {
    await fetch(`/api/admin/categories?id=${id}`, { method: "DELETE" })
    await load()
  }

  return (
    <div className="max-w-xl">
      <h1 className="mb-2 text-2xl font-bold text-[var(--foreground)]">Categories</h1>
      <p className="mb-6 text-sm text-[var(--muted)]">Manage reusable tags for playlists and standalone lectures.</p>
      <form onSubmit={addCategory} className="mb-6 flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" required className="admin-input min-w-0 flex-1 px-4 py-2.5 text-sm" />
        <button className="admin-gradient-accent rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]">Add</button>
      </form>
      {error && <p className="mb-4 text-xs text-red-500">{error}</p>}
      <div className="admin-panel divide-y divide-[var(--border)]">
        {categories.map((category) => (
          <div key={category.id} className="flex items-center justify-between px-4 py-3 text-sm text-[var(--foreground)]">
            <span>{category.name}</span>
            <button onClick={() => void deactivate(category.id)} className="text-xs text-red-500 hover:underline">Deactivate</button>
          </div>
        ))}
        {!categories.length && <p className="px-4 py-6 text-sm text-[var(--muted)]">No categories yet.</p>}
      </div>
    </div>
  )
}