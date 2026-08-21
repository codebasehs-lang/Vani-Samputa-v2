import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/adminAuth"
import { prisma } from "@/lib/prisma"

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
      if (found) return (row[found] ?? "").trim()
    }
    return ""
  }

  // Cache playlists to avoid repeated DB lookups
  const playlistCache = new Map<string, string>()

  for (const row of rows) {
    try {
      const title = col(row, "title", "name", "lecture")
      const url   = col(row, "url", "link", "youtube id", "youtube_id", "videoid")
      if (!title || !url) { skipped++; continue }

      const language     = col(row, "language", "lang") || "Odia"
      const category     = col(row, "category", "cat") || "General"
      const playlistName = col(row, "playlist", "playlist name", "playlistname")
      const durationRaw  = col(row, "duration", "duration (sec)", "seconds")
      const duration     = durationRaw ? Number(durationRaw) || null : null

      // Dedup by url
      const existing = await prisma.lecture.findFirst({ where: { url } })
      if (existing) { skipped++; continue }

      // Find or create playlist
      let playlistId: string | null = null
      if (playlistName) {
        const cacheKey = `${playlistName}||${language}||${category}||${mediaType}`
        if (playlistCache.has(cacheKey)) {
          playlistId = playlistCache.get(cacheKey)!
        } else {
          let pl = await prisma.playlist.findFirst({ where: { title: playlistName, language, mediaType } })
          if (!pl) pl = await prisma.playlist.create({ data: { title: playlistName, language, category, mediaType } })
          playlistId = pl.id
          playlistCache.set(cacheKey, pl.id)
        }
      }

      await prisma.lecture.create({
        data: { title, url, mediaType, language, category, duration, playlistId },
      })
      created++
    } catch (e) {
      errors.push(String(e))
    }
  }

  return NextResponse.json({ created, skipped, errors: errors.slice(0, 10) })
}
