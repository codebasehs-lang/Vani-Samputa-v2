"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"
import { ConfirmDialog } from "@/components/admin/ConfirmDialog"

export function DeleteArticleButton({ id }: { id: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(false)

  async function handleDelete() {
    setBusy(true)
    const res = await fetch(`/api/admin/articles?id=${id}`, { method: "DELETE" })
    setBusy(false)
    setOpen(false)
    if (!res.ok) {
      toast.error("Failed to delete article.")
      return
    }
    toast.success("Article deleted.")
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        aria-label="Delete article"
      >
        <Trash2 size={15} strokeWidth={1.75} />
      </button>
      <ConfirmDialog
        open={open}
        title="Delete this article?"
        description="This cannot be undone."
        confirmLabel="Delete"
        danger
        busy={busy}
        onConfirm={handleDelete}
        onCancel={() => setOpen(false)}
      />
    </>
  )
}
