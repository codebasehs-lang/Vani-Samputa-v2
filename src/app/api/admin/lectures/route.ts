import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/adminAuth"
import { prisma } from "@/lib/prisma"
import { categoryConnect, parseCategoryNames, validateCategories } from "@/lib/categories"
import { parseDuration } from "@/lib/duration"
import { extractYouTubeId } from "@/lib/youtube"
import type { MediaType } from "@/generated/prisma/enums"

async function resolvePlaylist(input: {
  playlistId?: unknown
  playlistName?: string
  language: string
  mediaType: MediaType
  categoryNames: string[]
}): Promise<{ id: string | null; error?: NextResponse }> {
  if (input.playlistId !== undefined) {
    if (typeof input.playlistId !== "string" || !input.playlistId.trim()) {
      return { id: null, error: NextResponse.json({ error: "Invalid playlist id" }, { status: 400 }) }
    }
    const playlist = await prisma.playlist.findUnique({ where: { id: input.playlistId } })
    if (!playlist) {
      return { id: null, error: NextResponse.json({ error: "Playlist not found" }, { status: 404 }) }
    }
    if (playlist.language !== input.language || playlist.mediaType !== input.mediaType) {
      return { id: null, error: NextResponse.json({ error: "Lecture language and type must match the playlist." }, { status: 400 }) }
    }
    return { id: playlist.id }
  }
  if (!input.playlistName) return { id: null }
  let playlist = await prisma.playlist.findFirst({
    where: { title: input.playlistName, language: input.language, mediaType: input.mediaType },
  })
  if (!playlist) {
    playlist = await prisma.playlist.create({
      data: {
        title: input.playlistName, language: input.language, mediaType: input.mediaType,
        category: input.categoryNames[0] || "General", categories: categoryConnect(input.categoryNames),
      },
    })
  }
  return { id: playlist.id }
}

export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard.response) return guard.response

  const playlistId = req.nextUrl.searchParams.get("playlistId")
  if (playlistId !== null) {
    if (!playlistId.trim()) return NextResponse.json({ error: "Invalid playlist id" }, { status: 400 })
    const playlist = await prisma.playlist.findUnique({ where: { id: playlistId }, select: { id: true } })
    if (!playlist) return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    const lectures = await prisma.lecture.findMany({
      where: { playlistId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { id: "asc" }],
      include: { playlist: { select: { title: true } }, categories: { select: { name: true } } },
    })
    return NextResponse.json({ lectures, total: lectures.length })
  }

  const page = Number(req.nextUrl.searchParams.get("page") ?? 1)
  const q = req.nextUrl.searchParams.get("q") ?? ""
  const take = 30
  const where = q ? { title: { contains: q } } : {}

  const [lectures, total] = await Promise.all([
    prisma.lecture.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * take, take }),
    prisma.lecture.count({ where }),
  ])

  return NextResponse.json({ lectures, total })
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard.response) return guard.response

  const { title, url, mediaType, language, category, categories, playlistName, playlistId: requestedPlaylistId, duration, description, lectureDate } =
    await req.json()

  const categoryNames = parseCategoryNames(categories || category || "General")
  const missingCategories = await validateCategories(categoryNames)
  if (missingCategories.length) {
    return NextResponse.json({ error: `Add these categories first from Admin -> Categories: ${missingCategories.join(", ")}` }, { status: 400 })
  }

  const playlist = await resolvePlaylist({ playlistId: requestedPlaylistId, playlistName, language, mediaType, categoryNames })
  if (playlist.error) return playlist.error

  const lecture = await prisma.lecture.create({
    data: {
      title,
      url: mediaType === "VIDEO" ? extractYouTubeId(url) : url,
      mediaType,
      language,
      category: category || "General",
      description,
      duration: parseDuration(duration),
      lectureDate: lectureDate ? new Date(lectureDate) : null,
      playlistId: playlist.id,
      categories: categoryConnect(categoryNames),
    },
  })

  return NextResponse.json(lecture)
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard.response) return guard.response

  const id = req.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const { title, url, mediaType, language, category, categories, playlistName, playlistId: requestedPlaylistId, duration, description, lectureDate } =
    await req.json()

  const categoryNames = parseCategoryNames(categories || category || "General")
  const missingCategories = await validateCategories(categoryNames)
  if (missingCategories.length) {
    return NextResponse.json({ error: `Add these categories first from Admin -> Categories: ${missingCategories.join(", ")}` }, { status: 400 })
  }

  const playlist = await resolvePlaylist({ playlistId: requestedPlaylistId, playlistName, language, mediaType, categoryNames })
  if (playlist.error) return playlist.error

  const lecture = await prisma.lecture.update({
    where: { id },
    data: {
      title,
      url: mediaType === "VIDEO" ? extractYouTubeId(url) : url,
      mediaType,
      language,
      category: category || "General",
      description,
      duration: parseDuration(duration),
      lectureDate: lectureDate ? new Date(lectureDate) : null,
      playlistId: playlist.id,
      categories: { set: categoryNames.map((name: string) => ({ name })) },
    },
  })

  return NextResponse.json(lecture)
}

export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard.response) return guard.response

  const id = req.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  await prisma.lecture.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
