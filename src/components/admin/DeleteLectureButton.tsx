"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash } from "phosphor-react"

export function DeleteLectureButton({ id }: { id: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function handleDelete() {
    if (!confirm("Delete this lecture? This cannot be undone.")) return
    setBusy(true)
    await fetch(`/api/admin/lectures?id=${id}`, { method: "DELETE" })
    setBusy(false)
    router.refresh()
  }

  return (
    <button
      onClick={handleDelete}
      disabled={busy}
      className="p-1.5 text-[var(--muted)] transition-colors hover:text-red-500 disabled:opacity-40"
      aria-label="Delete lecture"
    >
      <Trash size={15} />
    </button>
  )
}
