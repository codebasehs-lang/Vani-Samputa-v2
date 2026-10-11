"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Bell, CalendarDays, Clock, LoaderCircle, MonitorPlay, Play, Radio, Video } from "lucide-react"
import { NotifyMeButton } from "@/components/NotifyMeButton"
import { PageHeader } from "@/components/PageHeader"

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
    <div className="mx-auto max-w-5xl px-4 py-10">
      <PageHeader
        icon={Radio}
        eyebrow="Saṅga from anywhere"
        title="Live Satsang"
        description="Join HH Haladhara Svāmī Mahārāja live for kīrtana, kathā and festival broadcasts streamed on YouTube."
        crumbs={[{ label: "Home", href: "/" }, { label: "Live" }]}
      >
        {loading ? (
          <span className="page-hero-chip"><LoaderCircle size={13} className="animate-spin" /> Checking status…</span>
        ) : status?.isLive ? (
          <span className="live-badge"><span className="hero-live-dot" aria-hidden="true" /> LIVE NOW</span>
        ) : (
          <span className="page-hero-chip"><Clock size={13} /> Offline right now</span>
        )}
      </PageHeader>

      {loading && (
        <div className="live-frame flex aspect-video flex-col items-center justify-center gap-3 text-[#f4ecd8]">
          <LoaderCircle size={30} className="animate-spin text-[#e9c977]" />
          <p className="text-sm opacity-80">Checking live status…</p>
        </div>
      )}

      {!loading && status?.isLive && status.videoId && (
        <div>
          <div className="live-frame">
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
          {status.title && (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="live-badge"><span className="hero-live-dot" aria-hidden="true" /> LIVE</span>
              <h2 className="article-title">{status.title}</h2>
            </div>
          )}
        </div>
      )}

      {!loading && !status?.isLive && (
        <div className="live-empty">
          <span className="live-orb">
            <Play size={30} fill="currentColor" className="ml-1" />
          </span>
          <h2 className="article-title">Not live right now</h2>
          <p className="max-w-md text-sm text-[var(--muted)]">
            Satsangs are streamed on YouTube. Subscribe to the channel or turn on notifications so you never miss a broadcast.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href={`https://youtube.com/channel/${process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID ?? ""}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-youtube"
            >
              <MonitorPlay size={17} /> Subscribe on YouTube
            </a>
            <NotifyMeButton />
          </div>
          <div className="live-steps">
            <div className="live-step"><Bell size={18} /> Get notified when we go live</div>
            <Link href="/events" className="live-step hover:border-[var(--brand-gold)]"><CalendarDays size={18} /> See upcoming programs</Link>
            <Link href="/video" className="live-step hover:border-[var(--brand-gold)]"><Video size={18} /> Watch past satsangs</Link>
          </div>
        </div>
      )}
    </div>
  )
}
