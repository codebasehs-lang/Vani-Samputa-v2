import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ChevronRight, Headphones, Heart, ListMusic, Video } from "lucide-react"
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

      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[var(--foreground)]">My Favorites</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">{favorites.length + playlistFavorites.length} saved items</p>
        </div>
        <Heart size={24} className="shrink-0 text-[var(--accent)]" aria-hidden="true" />
      </div>

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
          <div className="empty-state flex flex-col items-center gap-3 py-16 text-center text-sm text-[var(--muted)]">
            <Heart size={28} aria-hidden="true" />
            <p>Tap the heart on any lecture to save it here.</p>
          </div>
        ) : (
          <div className="surface-panel overflow-hidden">
            {favorites.map(({ lecture }) => {
              const href = lecture.playlistId
                ? `/${lecture.mediaType === "AUDIO" ? "audio" : "video"}/playlist/${lecture.playlistId}`
                : null
              const content = (
                <>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
                    {lecture.mediaType === "AUDIO" ? <Headphones size={17} /> : <Video size={17} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--foreground)]">{lecture.title}</p>
                    <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                      {lecture.language} · {lecture.mediaType === "AUDIO" ? "Audio" : "Video"}
                    </p>
                  </div>
                  <Heart size={16} fill="#E8A4C8" className="shrink-0 text-[#E8A4C8]" />
                  {href && (
                    <ChevronRight size={16} className="shrink-0 text-[var(--muted)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--accent)]" />
                  )}
                </>
              )
              const rowClass = "group flex items-center gap-3 border-b border-[var(--border)] px-4 py-3 last:border-b-0"
              return href ? (
                <Link key={lecture.id} href={href} aria-label={`Open ${lecture.title}`} className={`${rowClass} transition-colors hover:bg-[var(--accent)]/5`}>
                  {content}
                </Link>
              ) : (
                <div key={lecture.id} className={rowClass}>
                  {content}
                </div>
              )
            })}
          </div>
        )
      ) : playlistFavorites.length === 0 ? (
        <div className="empty-state flex flex-col items-center gap-3 py-16 text-center text-sm text-[var(--muted)]">
          <ListMusic size={28} aria-hidden="true" />
          <p>Tap the heart on a playlist to save it here.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {playlistFavorites.map(({ playlist }) => (
            <Link
              key={playlist.id}
              href={`/${playlist.mediaType === "AUDIO" ? "audio" : "video"}/playlist/${playlist.id}`}
              className="surface-card group flex items-center gap-3 p-4"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
                {playlist.mediaType === "AUDIO" ? <Headphones size={19} /> : <Video size={19} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-[var(--foreground)]">{playlist.title}</span>
                <span className="mt-1 block text-xs text-[var(--muted)]">{playlist.language} · {playlist.category} · {playlist._count.lectures} lectures</span>
              </span>
              <Heart size={16} fill="#E8A4C8" className="shrink-0 text-[#E8A4C8]" />
              <ChevronRight size={16} className="shrink-0 text-[var(--muted)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--accent)]" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

