import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "My Notes" }

function fmt(s: number) {
  const m = Math.floor(s / 60)
  return `${m}:${Math.floor(s % 60).toString().padStart(2, "0")}`
}

export default async function NotesPage() {
  const session = await auth()
  if (!session?.user?.email) redirect("/login")

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) redirect("/login")

  const notes = await prisma.userNote.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { lecture: { select: { id: true, title: true, mediaType: true } } },
  })

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1
        className="mb-1 text-2xl font-bold text-[var(--foreground)]"
        style={{ fontFamily: "var(--font-serif)" }}
      >
        My Notes
      </h1>
      <p className="mb-6 text-sm text-[var(--muted)]">{notes.length} notes</p>

      {notes.length === 0 && (
        <p className="py-16 text-center text-sm text-[var(--muted)]">
          Tap the bookmark icon while listening to add a timestamped note.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {notes.map((note) => (
          <div
            key={note.id}
            className="rounded-xl border border-[var(--border)] p-4"
            style={{ background: "var(--surface)" }}
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="text-sm">{note.lecture.mediaType === "AUDIO" ? "🎙️" : "🎬"}</span>
              <p className="truncate text-xs font-medium text-[var(--muted)]">{note.lecture.title}</p>
              <span
                className="ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                style={{ background: "var(--saffron)" }}
              >
                {fmt(note.timestampS)}
              </span>
            </div>
            <p className="text-sm text-[var(--foreground)]">{note.content}</p>
            <p className="mt-1.5 text-[10px] text-[var(--muted)]">
              {new Date(note.createdAt).toLocaleDateString("en-IN", {
                day: "numeric", month: "short", year: "numeric",
              })}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
