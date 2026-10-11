import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import type { Metadata } from "next"
import { VideoGrid } from "@/components/video/VideoGrid"
import { TranscriptSearch } from "@/components/player/TranscriptSearch"
import { PlaylistFavoriteButton } from "@/components/PlaylistFavoriteButton"
import { PageHeader } from "@/components/PageHeader"
import { ListVideo, Video } from "lucide-react"

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const pl = await prisma.playlist.findUnique({ where: { id }, select: { title: true } })
  return { title: pl?.title ?? "Playlist" }
}

export default async function VideoPlaylistPage(
  { params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ video?: string }> }
) {
  const { id } = await params
  const { video } = await searchParams

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

  const languagePath = playlist.language.toLowerCase()
  const hasLanguagePage = ["odia", "hindi", "english"].includes(languagePath)

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-10 lg:px-8">
      <PageHeader
        icon={Video}
        eyebrow={`${playlist.category} · ${playlist.language}`}
        title={playlist.title}
        description={playlist.description ?? undefined}
        crumbs={[
          { label: "Video", href: "/video" },
          { label: playlist.language, href: hasLanguagePage ? `/video/${languagePath}` : undefined },
          { label: "Playlist" },
        ]}
        meta={[{ label: `${playlist.lectures.length} video${playlist.lectures.length !== 1 ? "s" : ""}`, icon: ListVideo }]}
      >
        <PlaylistFavoriteButton playlistId={playlist.id} />
      </PageHeader>

      <VideoGrid lectures={playlist.lectures} playlistId={id} initialVideoId={video} />
      <TranscriptSearch lectures={playlist.lectures} playlistId={id} />
    </div>
  )
}
