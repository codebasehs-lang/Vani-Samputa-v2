"use client"

import { useEffect, useRef } from "react"
import { AlertTriangle } from "lucide-react"

type ConfirmDialogProps = {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

// Reusable modal to replace native confirm() for destructive/important admin actions.
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    confirmRef.current?.focus()
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} aria-hidden="true" />
      <div
        className="relative w-full max-w-sm rounded-xl border border-[var(--border)] p-5 shadow-xl"
        style={{ background: "var(--surface)" }}
      >
        <div className="mb-3 flex items-center gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={
              danger
                ? { background: "color-mix(in oklab, #ef4444 15%, var(--surface) 85%)", color: "#ef4444" }
                : { background: "color-mix(in oklab, var(--accent) 12%, var(--surface) 88%)", color: "var(--accent)" }
            }
            aria-hidden="true"
          >
            <AlertTriangle size={17} strokeWidth={1.75} />
          </span>
          <h2 id="confirm-dialog-title" className="text-sm font-semibold text-[var(--foreground)]">{title}</h2>
        </div>
        {description && <p className="mb-5 text-sm text-[var(--muted)]">{description}</p>}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-[var(--border)] px-3.5 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-40 dark:hover:bg-white/5"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`rounded-lg px-3.5 py-2 text-sm font-medium text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-60 ${
              danger ? "bg-red-500 hover:bg-red-600" : "admin-gradient-accent"
            }`}
          >
            {busy ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
