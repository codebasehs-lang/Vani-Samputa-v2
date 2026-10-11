import { PlaylistTrackList } from "@/components/audio/PlaylistTrackList"
import { TranscriptSearch } from "@/components/player/TranscriptSearch"
import { PlaylistFavoriteButton } from "@/components/PlaylistFavoriteButton"
import { PageHeader } from "@/components/PageHeader"
import { Clock, Headphones, ListMusic } from "lucide-react"
import { prisma } from "@/lib/prisma"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const pl = await prisma.playlist.findUnique({ where: { id }, select: { title: true } })
  return { title: pl?.title ?? "Playlist" }
}

export default async function PlaylistPage(
  {
    params,
    searchParams,
  }: {
    params: Promise<{ id: string }>
    searchParams: Promise<{ lecture?: string }>
  }
) {
  const { id } = await params
  const { lecture } = await searchParams

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

  const totalSeconds = playlist.lectures.reduce((sum, l) => sum + (l.duration ?? 0), 0)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.round((totalSeconds % 3600) / 60)
  const languagePath = playlist.language.toLowerCase()
  const hasLanguagePage = ["odia", "hindi", "english"].includes(languagePath)

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <PageHeader
        eyebrow={`${playlist.category} · ${playlist.language}`}
        title={playlist.title}
        description={playlist.description ?? undefined}
        crumbs={[
          { label: "Audio", href: "/audio" },
          { label: playlist.language, href: hasLanguagePage ? `/audio/${languagePath}` : undefined },
          { label: "Playlist" },
        ]}
        media={
          <span className="pl-cover">
            {playlist.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={playlist.coverUrl} alt="" />
            ) : (
              <Headphones size={44} />
            )}
          </span>
        }
        meta={[
          { label: `${playlist.lectures.length} lecture${playlist.lectures.length !== 1 ? "s" : ""}`, icon: ListMusic },
          ...(totalSeconds > 0 ? [{ label: hours ? `${hours} h ${minutes} min` : `${minutes} min`, icon: Clock }] : []),
        ]}
      >
        <PlaylistFavoriteButton playlistId={playlist.id} />
      </PageHeader>

      {/* Track list — client component for play buttons */}
      <PlaylistTrackList
        lectures={playlist.lectures}
        playlistId={playlist.id}
        initialLectureId={lecture}
      />
      <TranscriptSearch lectures={playlist.lectures} playlistId={playlist.id} />
    </div>
  )
}
