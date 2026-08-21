"use client"

import { useState } from "react"

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
    const data: SyncResult = await res.json()
    setResult(data)
    setLog("")
    setBusy(false)
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-2 text-2xl font-bold text-[var(--foreground)]">YouTube Sync</h1>
      <p className="mb-6 text-sm text-[var(--muted)]">
        Fetches all public playlists and videos from the configured YouTube channel and upserts them into the database.
        Requires <code className="rounded bg-black/[.06] px-1 dark:bg-white/[.08]">YOUTUBE_API_KEY</code> and{" "}
        <code className="rounded bg-black/[.06] px-1 dark:bg-white/[.08]">YOUTUBE_CHANNEL_ID</code> in{" "}
        <code className="rounded bg-black/[.06] px-1 dark:bg-white/[.08]">.env</code>.
      </p>

      <button
        onClick={handleSync}
        disabled={busy}
        className="mb-6 rounded-full px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        style={{ background: "var(--saffron)" }}
      >
        {busy ? "Syncing…" : "Sync Now"}
      </button>

      {log && <p className="mb-4 text-sm text-[var(--muted)]">{log}</p>}

      {result && (
        <div
          className="rounded-xl border border-[var(--border)] p-5 space-y-2"
          style={{ background: "var(--surface)" }}
        >
          <p className="font-semibold text-[var(--foreground)]">Sync complete</p>
          <p className="text-sm text-green-600">✓ {result.playlists} playlists processed</p>
          <p className="text-sm text-green-600">✓ {result.created} lectures created</p>
          <p className="text-sm text-[var(--muted)]">⟳ {result.updated} lectures updated</p>
          {result.errors.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-red-500">{result.errors.length} errors:</p>
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
