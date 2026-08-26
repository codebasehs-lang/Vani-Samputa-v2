import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import type { Metadata } from "next"
import { VideoGrid } from "@/components/video/VideoGrid"
import { TranscriptSearch } from "@/components/player/TranscriptSearch"
import { PlaylistFavoriteButton } from "@/components/PlaylistFavoriteButton"

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const pl = await prisma.playlist.findUnique({ where: { id }, select: { title: true } })
  return { title: pl?.title ?? "Playlist" }
}

export default async function VideoPlaylistPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const playlist = await prisma.playlist.findUnique({
    where: { id },
    include: {
      lectures: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true, title: true, url: true, duration: true,
          mediaType: true, thumbnail: true, language: true, transcript: true,
        },
      },
    },
  })

  if (!playlist) notFound()

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
          {playlist.category} · {playlist.language}
        </p>
        <h1
          className="text-2xl font-bold text-[var(--foreground)]"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          {playlist.title}
        </h1>
        {playlist.description && (
          <p className="mt-1 text-sm text-[var(--muted)] line-clamp-2">{playlist.description}</p>
        )}
        <p className="mt-2 text-xs text-[var(--muted)]">{playlist.lectures.length} videos</p>
        <PlaylistFavoriteButton playlistId={playlist.id} />
      </div>

      <VideoGrid lectures={playlist.lectures} playlistId={id} />
      <TranscriptSearch lectures={playlist.lectures} playlistId={id} />
    </div>
  )
}
