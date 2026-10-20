"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"
import { ConfirmDialog } from "@/components/admin/ConfirmDialog"

export function DeleteLectureButton({ id, onDeleted }: { id: string; onDeleted?: () => void }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(false)

  async function handleDelete() {
    if (busy) return
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/lectures?id=${encodeURIComponent(id)}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete lecture.")
      setOpen(false)
      toast.success("Lecture deleted.")
      onDeleted?.()
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete lecture.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        aria-label="Delete lecture"
      >
        <Trash2 size={15} strokeWidth={1.75} />
      </button>
      <ConfirmDialog
        open={open}
        title="Delete this lecture?"
        description="This cannot be undone."
        confirmLabel="Delete"
        danger
        busy={busy}
        onConfirm={handleDelete}
        onCancel={() => { if (!busy) setOpen(false) }}
      />
    </>
  )
}
