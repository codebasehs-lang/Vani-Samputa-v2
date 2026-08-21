import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim()
  if (!q || q.length < 2) return NextResponse.json([])

  const like = `%${q}%`

  const [lectures, playlists] = await Promise.all([
    prisma.lecture.findMany({
      where: { title: { contains: q } },
      select: { id: true, title: true, language: true, mediaType: true },
      take: 8,
      orderBy: { playCount: "desc" },
    }),
    prisma.playlist.findMany({
      where: { title: { contains: q } },
      select: { id: true, title: true, language: true, mediaType: true },
      take: 4,
      orderBy: { sortOrder: "asc" },
    }),
  ])

  const results = [
    ...playlists.map((p) => ({ ...p, type: "playlist" as const })),
    ...lectures.map((l) => ({ ...l, type: "lecture" as const })),
  ]

  return NextResponse.json(results)
}
