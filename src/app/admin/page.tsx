import { prisma } from "@/lib/prisma"
import type { Metadata } from "next"
import { BookOpen, ListMusic, Users, Newspaper, Mic, Clapperboard, Inbox } from "lucide-react"
import { ADMIN_COLORS, adminGradient } from "@/lib/adminColors"

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
    { label: "Total Lectures", value: lectures, sub: `${audio} audio · ${video} video`, Icon: BookOpen, color: ADMIN_COLORS.dashboard },
    { label: "Playlists",      value: playlists, Icon: ListMusic, color: ADMIN_COLORS.lectures },
    { label: "Users",          value: users, Icon: Users, color: ADMIN_COLORS.import },
    { label: "Articles",       value: articles, Icon: Newspaper, color: ADMIN_COLORS.categories },
  ]

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-[var(--foreground)]">Dashboard</h1>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, sub, Icon, color }) => (
          <div
            key={label}
            className="rounded-xl border border-[var(--border)] p-5 transition-transform duration-150 hover:-translate-y-0.5"
            style={{ background: `linear-gradient(160deg, color-mix(in oklab, ${color} 7%, var(--surface) 93%), var(--surface))` }}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-3xl font-bold" style={{ color }}>
                {value.toLocaleString()}
              </p>
              <span
                className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm"
                style={{ background: adminGradient(color) }}
                aria-hidden="true"
              >
                <Icon size={19} strokeWidth={1.75} />
              </span>
            </div>
            <p className="text-sm font-medium text-[var(--foreground)]">{label}</p>
            {sub && <p className="mt-0.5 text-xs text-[var(--muted)]">{sub}</p>}
          </div>
        ))}
      </div>

      <div className="admin-panel">
        <div className="border-b border-[var(--border)] px-4 py-3">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Recently Added</h2>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {recent.length === 0 && (
            <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full text-white"
                style={{ background: adminGradient(ADMIN_COLORS.dashboard) }}
              >
                <Inbox size={22} strokeWidth={1.5} />
              </span>
              <p className="text-sm font-medium text-[var(--foreground)]">No lectures yet</p>
              <p className="text-xs text-[var(--muted)]">Newly added lectures will show up here.</p>
            </div>
          )}
          {recent.map((l) => {
            const iconColor = l.mediaType === "AUDIO" ? ADMIN_COLORS.articles : ADMIN_COLORS.dashboard
            return (
              <div key={l.id} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.03]">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
                  style={{ background: adminGradient(iconColor) }}
                  aria-hidden="true"
                >
                  {l.mediaType === "AUDIO" ? <Mic size={15} strokeWidth={1.75} /> : <Clapperboard size={15} strokeWidth={1.75} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--foreground)]">{l.title}</p>
                  <p className="text-[10px] text-[var(--muted)]">{l.language}</p>
                </div>
                <p className="text-[10px] text-[var(--muted)]">
                  {new Date(l.createdAt).toLocaleDateString()}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
