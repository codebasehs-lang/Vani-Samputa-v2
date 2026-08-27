import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { NotesAccordion } from "@/components/NotesAccordion"

export const metadata: Metadata = { title: "My Notes" }

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

  // group notes by lecture, keeping most-recently-noted lecture first
  type NoteItem = (typeof notes)[number]
  const groups = Array.from(
    notes.reduce((map, note) => {
      const existing = map.get(note.lecture.id)
      if (existing) {
        existing.notes.push(note)
      } else {
        map.set(note.lecture.id, { lecture: note.lecture, notes: [note] })
      }
      return map
    }, new Map<string, { lecture: NoteItem["lecture"]; notes: NoteItem[] }>()).values(),
  )

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-serif mb-1 text-2xl font-bold text-[var(--foreground)]">
        My Notes
      </h1>
      <p className="mb-6 text-sm text-[var(--muted)]">{notes.length} notes across {groups.length} lectures</p>

      {notes.length === 0 ? (
        <div className="empty-state py-16 text-center text-sm text-[var(--muted)]">
          Tap the bookmark icon while listening to add a timestamped note.
        </div>
      ) : (
        <NotesAccordion
          groups={groups.map((g) => ({
            lecture: g.lecture,
            notes: g.notes.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() })),
          }))}
        />
      )}
    </div>
  )
}

