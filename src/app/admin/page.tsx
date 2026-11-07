import { AdminPageHeader } from "@/components/admin/AdminPageHeader"
import { ADMIN_COLORS, adminGradient } from "@/lib/adminColors"
import { prisma } from "@/lib/prisma"
import { ArrowUpRight, BookOpen, Clapperboard, Inbox, ListMusic, Mic, Newspaper, Plus, Upload, Users } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import type { CSSProperties } from "react"

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
    { label: "Total Lectures", value: lectures, sub: `${audio} audio · ${video} video`, Icon: BookOpen, color: ADMIN_COLORS.dashboard, href: "/admin/lectures" },
    { label: "Playlists", value: playlists, sub: "Audio & video collections", Icon: ListMusic, color: ADMIN_COLORS.categories, href: "/admin/playlists" },
    { label: "Users", value: users, sub: "Registered listeners", Icon: Users, color: ADMIN_COLORS.import, href: null },
    { label: "Articles", value: articles, sub: "Published & draft articles", Icon: Newspaper, color: ADMIN_COLORS.youtube, href: "/admin/articles" },
  ]

  return (
    <div>
      <AdminPageHeader title="Dashboard" section="Workspace" Icon={BookOpen} color={ADMIN_COLORS.dashboard} actions={<>
        <Link href="/admin/import" className="admin-input flex items-center gap-2 px-3 py-2 text-sm font-medium"><Upload size={16} />Import Excel</Link>
        <Link href="/admin/lectures/new" className="btn-accent flex items-center gap-2 px-3 py-2 text-sm font-semibold"><Plus size={16} />Add lecture</Link>
      </>} />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, sub, Icon, color, href }) => {
          const Stat = href ? Link : "div"
          return (
            <Stat
              key={label}
              href={href ?? "#"}
              className="admin-stat min-w-0 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] sm:p-5"
              style={{ "--section-color": color } as CSSProperties}
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="admin-stat-value text-3xl font-semibold tabular-nums">
                  {value.toLocaleString()}
                </p>
                <span
                  className="admin-section-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
                  aria-hidden="true"
                >
                  <Icon size={19} strokeWidth={1.75} />
                </span>
              </div>
              <p className="text-sm font-medium text-[var(--foreground)]">{label}</p>
              {sub && <p className="mt-0.5 text-xs text-[var(--muted)]">{sub}</p>}
            </Stat>
          )
        })}
      </div>

      <div className="overflow-hidden border-y border-[var(--border)] bg-[var(--surface)]">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-4 sm:px-5">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Recently added</h2>
          <Link href="/admin/lectures" className="flex items-center gap-1 text-xs font-semibold text-[var(--accent)]">All lectures<ArrowUpRight size={14} /></Link>
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
                <p className="shrink-0 text-[10px] text-[var(--muted)]">
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
