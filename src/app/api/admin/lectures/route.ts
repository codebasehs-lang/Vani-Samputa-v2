import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/adminAuth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard.response) return guard.response

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

  const { title, url, mediaType, language, category, playlistName, duration, description } =
    await req.json()

  // Find or create playlist
  let playlistId: string | null = null
  if (playlistName) {
    let pl = await prisma.playlist.findFirst({ where: { title: playlistName, language, mediaType } })
    if (!pl) pl = await prisma.playlist.create({ data: { title: playlistName, language, category: category || "General", mediaType } })
    playlistId = pl.id
  }

  const lecture = await prisma.lecture.create({
    data: {
      title,
      url,
      mediaType,
      language,
      category: category || "General",
      description,
      duration: duration ? Number(duration) : null,
      playlistId,
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
