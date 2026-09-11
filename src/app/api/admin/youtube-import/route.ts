import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/adminAuth"
import { categoryConnect, validateCategories } from "@/lib/categories"
import { prisma } from "@/lib/prisma"

type ImportRow = {
  videoId: string
  title: string
  description?: string
  thumbnail?: string | null
  language: string
  category: string
  playlistTitle?: string
  duration?: number | null
  lectureDate?: string | null
  sortOrder?: number
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard.response) return guard.response

  const body = await req.json() as { rows?: ImportRow[] }
  const rows = body.rows ?? []
  if (!rows.length || rows.length > 200) {
    return NextResponse.json({ error: "Select between 1 and 200 videos." }, { status: 400 })
  }

  const errors: string[] = []
  const validRows: ImportRow[] = []
  const seen = new Set<string>()
  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 1
    const videoId = String(row.videoId ?? "").trim()
    const title = String(row.title ?? "").trim()
    const categories = [String(row.category ?? "").trim()].filter(Boolean)
    if (!videoId || !title) {
      errors.push(`Row ${rowNumber}: title and YouTube ID are required.`)
      continue
    }
    if (seen.has(videoId)) {
      errors.push(`Row ${rowNumber}: duplicate YouTube ID ${videoId}.`)
      continue
    }
    seen.add(videoId)
    const missingCategories = await validateCategories(categories)
    if (missingCategories.length) {
      errors.push(`Row ${rowNumber}: add categories first: ${missingCategories.join(", ")}.`)
      continue
    }
    validRows.push({ ...row, videoId, title, language: row.language?.trim() || "Odia", category: categories[0] })
  }

  const existing = await prisma.lecture.findMany({ where: { url: { in: validRows.map((row) => row.videoId) } }, select: { url: true } })
  const existingUrls = new Set(existing.map((lecture) => lecture.url))
  const rowsToCreate = validRows.filter((row) => !existingUrls.has(row.videoId))
  let created = 0
  const playlistIds = new Map<string, string>()

  try {
    await prisma.$transaction(async (tx) => {
      for (const row of rowsToCreate) {
        let playlistId: string | null = null
        const playlistTitle = row.playlistTitle?.trim()
        if (playlistTitle) {
          const cacheKey = `${playlistTitle}||${row.language}`
          playlistId = playlistIds.get(cacheKey) ?? null
          if (!playlistId) {
            const existingPlaylist = await tx.playlist.findFirst({ where: { title: playlistTitle, language: row.language, mediaType: "VIDEO" }, select: { id: true } })
            playlistId = existingPlaylist?.id ?? (await tx.playlist.create({
              data: { title: playlistTitle, language: row.language, category: row.category, mediaType: "VIDEO", categories: categoryConnect([row.category]) },
              select: { id: true },
            })).id
            playlistIds.set(cacheKey, playlistId)
          }
        }

        const lecture = await tx.lecture.create({
          data: {
            title: row.title,
            description: row.description?.trim() || null,
            url: row.videoId,
            mediaType: "VIDEO",
            language: row.language,
            category: row.category,
            thumbnail: row.thumbnail ?? null,
            duration: row.duration ?? null,
            lectureDate: parseDate(row.lectureDate),
            publishedAt: parseDate(row.lectureDate),
            sortOrder: row.sortOrder ?? 0,
            playlistId,
            categories: categoryConnect([row.category]),
          },
        })
        await tx.youtubeStagingVideo.updateMany({ where: { videoId: row.videoId }, data: { status: "IMPORTED", lectureId: lecture.id } })
        created++
      }
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error), created: 0, skipped: 0, errors }, { status: 500 })
  }

  return NextResponse.json({ created, skipped: rows.length - rowsToCreate.length, errors })
}

function parseDate(value?: string | null) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}