import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/adminAuth"
import { prisma } from "@/lib/prisma"
import { categoryConnect, ensureCategories } from "@/lib/categories"

const YT = "https://www.googleapis.com/youtube/v3"

export async function POST() {
  const guard = await requireAdmin()
  if (guard.response) return guard.response

  const apiKey = process.env.YOUTUBE_API_KEY
  const channelId = process.env.YOUTUBE_CHANNEL_ID

  if (!apiKey || !channelId) {
    return NextResponse.json({ error: "YOUTUBE_API_KEY and YOUTUBE_CHANNEL_ID must be set in .env" }, { status: 400 })
  }

  let created = 0
  let updated = 0
  let playlists = 0
  const errors: string[] = []

  try {
    // Fetch all channel playlists (paginated)
    let pageToken = ""
    do {
      const url = `${YT}/playlists?part=snippet&channelId=${channelId}&maxResults=50&key=${apiKey}${pageToken ? `&pageToken=${pageToken}` : ""}`
      const res = await fetch(url)
      const data = await res.json()

      for (const item of data.items ?? []) {
        const ytPlaylistId = item.id
        const title = item.snippet.title as string
        const language = detectLanguage(title)
        const category = detectCategory(title)
        await ensureCategories([category])

        // Upsert playlist
        const pl = await prisma.playlist.upsert({
          where: { id: ytPlaylistId },
          update: { title, categories: categoryConnect([category]) },
          create: { id: ytPlaylistId, title, language, category, mediaType: "VIDEO", categories: categoryConnect([category]) },
        })
        playlists++

        // Fetch playlist items
        let itemPageToken = ""
        do {
          const iUrl = `${YT}/playlistItems?part=snippet&playlistId=${ytPlaylistId}&maxResults=50&key=${apiKey}${itemPageToken ? `&pageToken=${itemPageToken}` : ""}`
          const iRes = await fetch(iUrl)
          const iData = await iRes.json()

          for (const video of iData.items ?? []) {
            const videoId = video.snippet.resourceId?.videoId
            const videoTitle = video.snippet.title as string
            if (!videoId || videoTitle === "Deleted video" || videoTitle === "Private video") continue

            const existing = await prisma.lecture.findFirst({ where: { url: videoId } })
            if (existing) {
              await prisma.lecture.update({ where: { id: existing.id }, data: { title: videoTitle } })
              updated++
            } else {
              const thumb = video.snippet.thumbnails?.medium?.url
              await prisma.lecture.create({
                data: {
                  title: videoTitle,
                  url: videoId,
                  mediaType: "VIDEO",
                  language,
                  category,
                  thumbnail: thumb ?? null,
                  playlistId: pl.id,
                  sortOrder: video.snippet.position ?? 0,
                  publishedAt: video.snippet.publishedAt ? new Date(video.snippet.publishedAt) : null,
                  categories: categoryConnect([category]),
                },
              })
              created++
            }
          }

          itemPageToken = iData.nextPageToken ?? ""
        } while (itemPageToken)
      }

      pageToken = data.nextPageToken ?? ""
    } while (pageToken)
  } catch (e) {
    errors.push(String(e))
  }

  return NextResponse.json({ created, updated, playlists, errors: errors.slice(0, 10) })
}

function detectLanguage(title: string): string {
  const t = title.toLowerCase()
  if (/odia|odiya|oriya|ଓଡ଼ିଆ/.test(t)) return "Odia"
  if (/hindi|हिंदी/.test(t)) return "Hindi"
  if (/english/.test(t)) return "English"
  return "Odia" // default
}

function detectCategory(title: string): string {
  const t = title.toLowerCase()
  if (/bhagavatam|srimad/.test(t)) return "Bhagavatam"
  if (/gita|bhagavad/.test(t)) return "Bhagavad Gita"
  if (/kirtan|kirtana/.test(t)) return "Kirtan"
  if (/festival|janmashtami|vyasa/.test(t)) return "Festival"
  return "General"
}
