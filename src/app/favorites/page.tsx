import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "My Favorites" }

export default async function FavoritesPage() {
  const session = await auth()
  if (!session?.user?.email) redirect("/login")

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) redirect("/login")

  const favorites = await prisma.userFavorite.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      lecture: {
        select: { id: true, title: true, mediaType: true, language: true, playlistId: true },
      },
    },
  })

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1
        className="mb-1 text-2xl font-bold text-[var(--foreground)]"
        style={{ fontFamily: "var(--font-serif)" }}
      >
        My Favorites
      </h1>
      <p className="mb-6 text-sm text-[var(--muted)]">{favorites.length} saved</p>

      {favorites.length === 0 && (
        <p className="py-16 text-center text-sm text-[var(--muted)]">
          Tap ♥ on any lecture to save it here.
        </p>
      )}

      <div className="flex flex-col divide-y divide-[var(--border)]">
        {favorites.map(({ lecture }) => (
          <div key={lecture.id} className="flex items-center gap-3 py-3">
            <span className="text-lg shrink-0">
              {lecture.mediaType === "AUDIO" ? "🎙️" : "🎬"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--foreground)]">{lecture.title}</p>
              <p className="text-[10px] text-[var(--muted)]">{lecture.language}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
