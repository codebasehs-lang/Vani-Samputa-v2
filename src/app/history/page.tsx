import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ArrowUpRight, Headphones, History, Video } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Listening History" }

export default async function HistoryPage() {
  const session = await auth()
  if (!session?.user?.email) redirect("/login")

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) redirect("/login")

  const history = await prisma.userHistory.findMany({
    where: { userId: user.id },
    orderBy: { playedAt: "desc" },
    take: 50,
    include: { lecture: { select: { id: true, title: true, mediaType: true, language: true, playlistId: true } } },
  })

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href="/profile"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
      >
        <ArrowLeft size={16} />
        Back to profile
      </Link>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[var(--foreground)]">
            Listening History
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {history.length} {history.length === 1 ? "entry" : "entries"}
          </p>
        </div>
        <History size={24} className="shrink-0 text-[var(--accent)]" aria-hidden="true" />
      </div>

      {history.length === 0 && (
        <div className="empty-state flex flex-col items-center gap-3 py-16 text-center text-sm text-[var(--muted)]">
          <History size={28} aria-hidden="true" />
          <p>Nothing yet — start listening to build your history.</p>
        </div>
      )}

      {history.length > 0 && (
        <div className="surface-panel overflow-hidden">
          {history.map((entry) => (
          <div key={entry.id} className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3 last:border-b-0">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
              {entry.lecture.mediaType === "AUDIO" ? <Headphones size={17} /> : <Video size={17} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                {entry.lecture.title}
              </p>
              <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                {entry.lecture.language} · {entry.lecture.mediaType === "AUDIO" ? "Audio" : "Video"} · {new Date(entry.playedAt).toLocaleDateString("en-IN", {
                  day: "numeric", month: "short", year: "numeric",
                })}
              </p>
            </div>
            {entry.lecture.playlistId && (
              <Link
                href={`/${entry.lecture.mediaType === "AUDIO" ? "audio" : "video"}/playlist/${entry.lecture.playlistId}`}
                aria-label={`Open ${entry.lecture.title}`}
                className="icon-btn inline-flex h-8 w-8 shrink-0 items-center justify-center"
              >
                <ArrowUpRight size={16} />
              </Link>
            )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
