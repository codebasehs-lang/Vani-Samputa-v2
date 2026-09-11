import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/adminAuth"
import { prisma } from "@/lib/prisma"
import { categoryConnect, parseCategoryNames, validateCategories } from "@/lib/categories"
import { parseDuration } from "@/lib/duration"
import { extractYouTubeId } from "@/lib/youtube"

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

  const { title, url, mediaType, language, category, categories, playlistName, duration, description, lectureDate } =
    await req.json()

  const categoryNames = parseCategoryNames(categories || category || "General")
  const missingCategories = await validateCategories(categoryNames)
  if (missingCategories.length) {
    return NextResponse.json({ error: `Add these categories first from Admin -> Categories: ${missingCategories.join(", ")}` }, { status: 400 })
  }

  // Find or create playlist
  let playlistId: string | null = null
  if (playlistName) {
    let pl = await prisma.playlist.findFirst({ where: { title: playlistName, language, mediaType } })
    if (!pl) pl = await prisma.playlist.create({ data: { title: playlistName, language, category: categoryNames[0] || "General", mediaType, categories: categoryConnect(categoryNames) } })
    playlistId = pl.id
  }

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
      playlistId,
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

  const { title, url, mediaType, language, category, categories, playlistName, duration, description, lectureDate } =
    await req.json()

  const categoryNames = parseCategoryNames(categories || category || "General")
  const missingCategories = await validateCategories(categoryNames)
  if (missingCategories.length) {
    return NextResponse.json({ error: `Add these categories first from Admin -> Categories: ${missingCategories.join(", ")}` }, { status: 400 })
  }

  // Find or create playlist
  let playlistId: string | null = null
  if (playlistName) {
    let pl = await prisma.playlist.findFirst({ where: { title: playlistName, language, mediaType } })
    if (!pl) pl = await prisma.playlist.create({ data: { title: playlistName, language, category: categoryNames[0] || "General", mediaType, categories: categoryConnect(categoryNames) } })
    playlistId = pl.id
  }

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
      playlistId,
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
