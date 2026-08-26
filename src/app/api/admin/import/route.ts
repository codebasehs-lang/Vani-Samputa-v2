import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/adminAuth"
import { prisma } from "@/lib/prisma"
import { categoryConnect, parseCategoryNames, validateCategories } from "@/lib/categories"
import { parseDuration } from "@/lib/duration"

type Row = Record<string, string>

export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard.response) return guard.response

  const { rows, mediaType } = await req.json() as { rows: Row[]; mediaType: "AUDIO" | "VIDEO" }

  let created = 0
  let skipped = 0
  const errors: string[] = []

  // Normalise column names (case-insensitive)
  function col(row: Row, ...keys: string[]): string {
    for (const k of keys) {
      const found = Object.keys(row).find((c) => c.toLowerCase() === k.toLowerCase())
      if (found) return String(row[found] ?? "").trim()
    }
    return ""
  }

  function parseExcelDate(value: string): Date | null {
    if (!value) return null
    if (/^\d+(\.\d+)?$/.test(value)) {
      const serial = Number(value)
      if (serial > 0) return new Date(Date.UTC(1899, 11, 30) + serial * 86400000)
    }
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  }

  // Cache playlists to avoid repeated DB lookups
  const playlistCache = new Map<string, string>()

  for (const row of rows) {
    try {
      const title = col(row, "title", "name", "lecture")
      const url   = col(row, "url", "link", "youtube id", "youtube_id", "videoid")
      if (!title || !url) { skipped++; continue }

      const rowMediaType = col(row, "media type", "media_type", "type").toUpperCase()
      const lectureMediaType = rowMediaType === "AUDIO" || rowMediaType === "VIDEO" ? rowMediaType : mediaType
      const language     = col(row, "language", "lang") || "Odia"
      const category     = col(row, "category", "cat") || "General"
      const categories   = parseCategoryNames(col(row, "categories", "tags") || category)
      const playlistName = col(row, "playlist", "playlist name", "playlistname")
      const durationRaw  = col(row, "duration", "duration (sec)", "seconds")
      const duration     = parseDuration(durationRaw)
      const lectureDateRaw = col(row, "lecture date", "lecture_date", "date", "event date")
      const lectureDate = parseExcelDate(lectureDateRaw)
      const missingCategories = await validateCategories(categories)
      if (missingCategories.length) {
        skipped++
        errors.push(`Row ${created + skipped}: add categories first from Admin -> Categories: ${missingCategories.join(", ")}`)
        continue
      }

      // Dedup by url
      const existing = await prisma.lecture.findFirst({ where: { url } })
      if (existing) { skipped++; continue }

      // Find or create playlist
      let playlistId: string | null = null
      if (playlistName) {
        const cacheKey = `${playlistName}||${language}||${lectureMediaType}`
        if (playlistCache.has(cacheKey)) {
          playlistId = playlistCache.get(cacheKey)!
        } else {
          let pl = await prisma.playlist.findFirst({ where: { title: playlistName, language, mediaType: lectureMediaType } })
          if (!pl) pl = await prisma.playlist.create({ data: { title: playlistName, language, category: categories[0] || "General", mediaType: lectureMediaType, categories: categoryConnect(categories) } })
          playlistId = pl.id
          playlistCache.set(cacheKey, pl.id)
        }
      }

      await prisma.lecture.create({
        data: { title, url, mediaType: lectureMediaType, language, category: categories[0] || "General", duration, lectureDate, playlistId, categories: categoryConnect(categories) },
      })
      created++
    } catch (e) {
      errors.push(String(e))
    }
  }

  return NextResponse.json({ created, skipped, errors: errors.slice(0, 10) })
}
