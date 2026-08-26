"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Video, RefreshCw, CircleCheck, CircleAlert } from "lucide-react"

interface SyncResult {
  created: number
  updated: number
  playlists: number
  errors: string[]
}

export default function AdminYoutubePage() {
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<SyncResult | null>(null)
  const [log, setLog] = useState("")

  async function handleSync() {
    setBusy(true)
    setResult(null)
    setLog("Connecting to YouTube API…")
    const res = await fetch("/api/admin/youtube-sync", { method: "POST" })
    if (!res.ok) {
      setLog("")
      setBusy(false)
      toast.error("Sync failed. Check your YouTube API credentials.")
      return
    }
    const data: SyncResult = await res.json()
    setResult(data)
    setLog("")
    setBusy(false)
    toast.success(`Sync complete: ${data.created} created, ${data.updated} updated.`)
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6 flex items-center gap-3">
        <span className="admin-gradient-accent flex h-10 w-10 items-center justify-center rounded-full text-white">
          <Video size={18} strokeWidth={1.75} />
        </span>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">YouTube Sync</h1>
      </div>
      <p className="mb-6 text-sm text-[var(--muted)]">
        Fetches all public playlists and videos from the configured YouTube channel and upserts them into the database.
        Requires <code className="rounded bg-black/[.06] px-1 dark:bg-white/[.08]">YOUTUBE_API_KEY</code> and{" "}
        <code className="rounded bg-black/[.06] px-1 dark:bg-white/[.08]">YOUTUBE_CHANNEL_ID</code> in{" "}
        <code className="rounded bg-black/[.06] px-1 dark:bg-white/[.08]">.env</code>.
      </p>

      <button
        onClick={handleSync}
        disabled={busy}
        className="admin-gradient-accent mb-6 flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-60"
      >
        <RefreshCw size={15} strokeWidth={1.75} className={busy ? "animate-spin" : ""} />
        {busy ? "Syncing…" : "Sync Now"}
      </button>

      {log && <p className="mb-4 text-sm text-[var(--muted)]">{log}</p>}

      {result && (
        <div className="admin-panel admin-gradient-surface space-y-2 p-5">
          <p className="font-semibold text-[var(--foreground)]">Sync complete</p>
          <p className="flex items-center gap-1.5 text-sm text-green-600">
            <CircleCheck size={14} strokeWidth={1.75} /> {result.playlists} playlists processed
          </p>
          <p className="flex items-center gap-1.5 text-sm text-green-600">
            <CircleCheck size={14} strokeWidth={1.75} /> {result.created} lectures created
          </p>
          <p className="text-sm text-[var(--muted)]">⟳ {result.updated} lectures updated</p>
          {result.errors.length > 0 && (
            <div className="mt-2">
              <p className="flex items-center gap-1.5 text-xs font-medium text-red-500">
                <CircleAlert size={13} strokeWidth={1.75} /> {result.errors.length} errors:
              </p>
              {result.errors.slice(0, 5).map((e, i) => (
                <p key={i} className="text-[10px] text-red-400">{e}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
