"use client"

import { useEffect, useState } from "react"
import { NotifyMeButton } from "@/components/NotifyMeButton"

interface LiveStatus {
  isLive: boolean
  videoId?: string
  title?: string
}

export function LivePageClient() {
  const [status, setStatus] = useState<LiveStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/youtube-live")
      .then((r) => r.json())
      .then((d: LiveStatus) => { setStatus(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <h1
          className="text-3xl font-bold text-[var(--foreground)]"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          Live Satsang
        </h1>
        {status?.isLive && (
          <span className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ background: "#e53e3e" }}>
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-white" />
            LIVE
          </span>
        )}
      </div>

      {loading && (
        <div className="flex h-64 items-center justify-center">
          <p className="text-[var(--muted)]">Checking live status…</p>
        </div>
      )}

      {!loading && status?.isLive && status.videoId && (
        <div>
          {status.title && (
            <p className="mb-3 text-lg font-medium text-[var(--foreground)]">{status.title}</p>
          )}
          <div className="overflow-hidden rounded-2xl shadow-2xl">
            <div className="relative w-full pb-[56.25%]">
              <iframe
                className="absolute inset-0 h-full w-full"
                src={`https://www.youtube.com/embed/${status.videoId}?autoplay=1&rel=0`}
                title="Live Stream"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {!loading && !status?.isLive && (
        <div
          className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-[var(--border)] py-20 text-center"
          style={{ background: "var(--surface)" }}
        >
          <span className="text-5xl">🪷</span>
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Not live right now</h2>
          <p className="text-sm text-[var(--muted)]">
            Satsangs are streamed on YouTube. Subscribe to get notified when we go live.
          </p>
          <a
            href={`https://youtube.com/channel/${process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID ?? ""}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full px-5 py-2.5 text-sm font-semibold text-white"
            style={{ background: "#FF0000" }}
          >
            Subscribe on YouTube
          </a>
          <NotifyMeButton />
        </div>
      )}
    </div>
  )
}
