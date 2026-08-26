import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Headphones, Heart, ListMusic, Video } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "My Favorites" }

export default async function FavoritesPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await auth()
  if (!session?.user?.email) redirect("/login")

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) redirect("/login")

  const { tab } = await searchParams
  const activeTab = tab === "playlists" ? "playlists" : "lectures"
  const [favorites, playlistFavorites] = await Promise.all([
    prisma.userFavorite.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        lecture: {
          select: { id: true, title: true, mediaType: true, language: true, playlistId: true },
        },
      },
    }),
    prisma.userPlaylistFavorite.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        playlist: {
          select: { id: true, title: true, language: true, category: true, mediaType: true, _count: { select: { lectures: true } } },
        },
      },
    }),
  ])

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/profile" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)]">
        <ArrowLeft size={16} />
        Back to profile
      </Link>
      <h1 className="font-serif mb-1 text-2xl font-bold text-[var(--foreground)]">My Favorites</h1>
      <p className="mb-6 text-sm text-[var(--muted)]">{favorites.length + playlistFavorites.length} saved items</p>

      <nav className="mb-6 flex gap-2 border-b border-[var(--border)] pb-3" aria-label="Favorite types">
        <Link href="/favorites?tab=lectures" data-active={activeTab === "lectures"} className="chip inline-flex items-center gap-2 px-3 py-2 text-xs">
          <Heart size={14} /> Lectures ({favorites.length})
        </Link>
        <Link href="/favorites?tab=playlists" data-active={activeTab === "playlists"} className="chip inline-flex items-center gap-2 px-3 py-2 text-xs">
          <ListMusic size={14} /> Playlists ({playlistFavorites.length})
        </Link>
      </nav>

      {activeTab === "lectures" ? (
        favorites.length === 0 ? (
          <div className="empty-state py-16 text-center text-sm text-[var(--muted)]">Tap the heart on any lecture to save it here.</div>
        ) : (
          <div className="flex flex-col divide-y divide-[var(--border)]">
            {favorites.map(({ lecture }) => (
              <div key={lecture.id} className="flex items-center gap-3 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--deep-blue)] text-white">
                  {lecture.mediaType === "AUDIO" ? <Headphones size={17} /> : <Video size={17} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--foreground)]">{lecture.title}</p>
                  <p className="text-[10px] text-[var(--muted)]">{lecture.language} · {lecture.mediaType}</p>
                </div>
                <Heart size={16} fill="#E8A4C8" className="shrink-0 text-[#E8A4C8]" />
              </div>
            ))}
          </div>
        )
      ) : playlistFavorites.length === 0 ? (
        <div className="empty-state py-16 text-center text-sm text-[var(--muted)]">Tap the heart on a playlist to save it here.</div>
      ) : (
        <div className="space-y-3">
          {playlistFavorites.map(({ playlist }) => (
            <Link key={playlist.id} href={`/${playlist.mediaType === "AUDIO" ? "audio" : "video"}/playlist/${playlist.id}`} className="surface-card flex items-center gap-3 p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--deep-blue)] text-white">
                {playlist.mediaType === "AUDIO" ? <Headphones size={19} /> : <Video size={19} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-[var(--foreground)]">{playlist.title}</span>
                <span className="mt-1 block text-xs text-[var(--muted)]">{playlist.language} · {playlist.category} · {playlist._count.lectures} lectures</span>
              </span>
              <Heart size={16} fill="#E8A4C8" className="shrink-0 text-[#E8A4C8]" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
