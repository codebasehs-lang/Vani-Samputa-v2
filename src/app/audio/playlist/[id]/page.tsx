import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import type { Metadata } from "next"
import { PlaylistTrackList } from "@/components/audio/PlaylistTrackList"
import { TranscriptSearch } from "@/components/player/TranscriptSearch"

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const pl = await prisma.playlist.findUnique({ where: { id }, select: { title: true } })
  return { title: pl?.title ?? "Playlist" }
}

export default async function PlaylistPage(
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
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex gap-5">
        <div
          className="hidden sm:flex h-28 w-28 shrink-0 items-center justify-center rounded-xl text-5xl"
          style={{ background: "linear-gradient(135deg, #1a1a3e 0%, #2d2d5e 100%)" }}
        >
          🎙️
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
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
          <p className="mt-2 text-xs text-[var(--muted)]">
            {playlist.lectures.length} lecture{playlist.lectures.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Track list — client component for play buttons */}
      <PlaylistTrackList
        lectures={playlist.lectures}
        playlistId={playlist.id}
      />
      <TranscriptSearch lectures={playlist.lectures} playlistId={playlist.id} />
    </div>
  )
}
