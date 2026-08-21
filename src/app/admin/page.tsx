import { prisma } from "@/lib/prisma"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Dashboard" }

async function getStats() {
  const [lectures, users, playlists, articles] = await Promise.all([
    prisma.lecture.count(),
    prisma.user.count(),
    prisma.playlist.count(),
    prisma.article.count(),
  ])
  const [audio, video] = await Promise.all([
    prisma.lecture.count({ where: { mediaType: "AUDIO" } }),
    prisma.lecture.count({ where: { mediaType: "VIDEO" } }),
  ])
  const recent = await prisma.lecture.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
    select: { id: true, title: true, mediaType: true, language: true, createdAt: true },
  })
  return { lectures, users, playlists, articles, audio, video, recent }
}

export default async function AdminDashboard() {
  const { lectures, users, playlists, articles, audio, video, recent } = await getStats()

  const stats = [
    { label: "Total Lectures", value: lectures, sub: `${audio} audio · ${video} video` },
    { label: "Playlists",      value: playlists },
    { label: "Users",          value: users },
    { label: "Articles",       value: articles },
  ]

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-[var(--foreground)]">Dashboard</h1>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, sub }) => (
          <div
            key={label}
            className="rounded-xl border border-[var(--border)] p-5"
            style={{ background: "var(--surface)" }}
          >
            <p className="text-3xl font-bold" style={{ color: "var(--saffron)" }}>
              {value.toLocaleString()}
            </p>
            <p className="mt-1 text-sm font-medium text-[var(--foreground)]">{label}</p>
            {sub && <p className="mt-0.5 text-xs text-[var(--muted)]">{sub}</p>}
          </div>
        ))}
      </div>

      <div
        className="rounded-xl border border-[var(--border)]"
        style={{ background: "var(--surface)" }}
      >
        <div className="border-b border-[var(--border)] px-4 py-3">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Recently Added</h2>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {recent.length === 0 && (
            <p className="px-4 py-6 text-sm text-[var(--muted)]">No lectures yet.</p>
          )}
          {recent.map((l) => (
            <div key={l.id} className="flex items-center gap-3 px-4 py-3">
              <span>{l.mediaType === "AUDIO" ? "🎙️" : "🎬"}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--foreground)]">{l.title}</p>
                <p className="text-[10px] text-[var(--muted)]">{l.language}</p>
              </div>
              <p className="text-[10px] text-[var(--muted)]">
                {new Date(l.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
