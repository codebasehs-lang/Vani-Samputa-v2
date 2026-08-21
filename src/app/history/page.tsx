import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
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
      <h1
        className="mb-1 text-2xl font-bold text-[var(--foreground)]"
        style={{ fontFamily: "var(--font-serif)" }}
      >
        Listening History
      </h1>
      <p className="mb-6 text-sm text-[var(--muted)]">{history.length} entries</p>

      {history.length === 0 && (
        <p className="py-16 text-center text-sm text-[var(--muted)]">
          Nothing yet — start listening to build your history.
        </p>
      )}

      <div className="flex flex-col divide-y divide-[var(--border)]">
        {history.map((entry) => (
          <div key={entry.id} className="flex items-center gap-3 py-3">
            <span className="text-lg shrink-0">
              {entry.lecture.mediaType === "AUDIO" ? "🎙️" : "🎬"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--foreground)]">
                {entry.lecture.title}
              </p>
              <p className="text-[10px] text-[var(--muted)]">
                {entry.lecture.language} ·{" "}
                {new Date(entry.playedAt).toLocaleDateString("en-IN", {
                  day: "numeric", month: "short", year: "numeric",
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
