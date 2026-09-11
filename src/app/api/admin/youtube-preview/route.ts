import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/adminAuth"
import { prisma } from "@/lib/prisma"

const YT = "https://www.googleapis.com/youtube/v3"

type YouTubeItem = {
  id?: string
  snippet?: {
    title?: string
    description?: string
    publishedAt?: string
    position?: number
    channelTitle?: string
    thumbnails?: { medium?: { url?: string }; default?: { url?: string } }
    resourceId?: { videoId?: string }
  }
  contentDetails?: { duration?: string }
}

// Fetches the channel's videos from YouTube and upserts them into the local staging
// table. Never overwrites an admin's reviewed language/category/playlist choices —
// only updates YouTube-owned metadata (title/thumbnail/duration/lastSeenAt).
export async function POST() {
  const guard = await requireAdmin()
  if (guard.response) return guard.response

  const apiKey = process.env.YOUTUBE_API_KEY
  const channelId = process.env.YOUTUBE_CHANNEL_ID
  if (!apiKey || !channelId) {
    return NextResponse.json({ error: "YOUTUBE_API_KEY and YOUTUBE_CHANNEL_ID must be set in .env" }, { status: 400 })
  }

  let fetched = 0
  let inserted = 0
  let updated = 0

  try {
    const existingLectureUrls = new Set((await prisma.lecture.findMany({ where: { mediaType: "VIDEO" }, select: { url: true } })).map((lecture) => lecture.url))
    let pageToken = ""

    do {
      const data = await youtubeFetch<{ items?: YouTubeItem[]; nextPageToken?: string }>(
        `/playlists?part=snippet&channelId=${encodeURIComponent(channelId)}&maxResults=50${pageToken ? `&pageToken=${pageToken}` : ""}`,
        apiKey,
      )

      for (const item of data.items ?? []) {
        const playlistId = item.id
        const playlistTitle = item.snippet?.title?.trim()
        if (!playlistId || !playlistTitle) continue
        const language = detectLanguage(playlistTitle)
        const category = detectCategory(playlistTitle)

        let itemPageToken = ""
        do {
          const itemData = await youtubeFetch<{ items?: YouTubeItem[]; nextPageToken?: string }>(
            `/playlistItems?part=snippet&playlistId=${encodeURIComponent(playlistId)}&maxResults=50${itemPageToken ? `&pageToken=${itemPageToken}` : ""}`,
            apiKey,
          )
          const ids = (itemData.items ?? [])
            .map((video) => video.snippet?.resourceId?.videoId)
            .filter((id): id is string => Boolean(id))
          const details = await getVideoDetails(ids, apiKey)

          for (const video of itemData.items ?? []) {
            const videoId = video.snippet?.resourceId?.videoId
            const videoTitle = video.snippet?.title?.trim()
            if (!videoId || !videoTitle || videoTitle === "Deleted video" || videoTitle === "Private video") continue
            fetched++
            const detail = details.get(videoId)
            const thumbnail = detail?.snippet?.thumbnails?.medium?.url ?? video.snippet?.thumbnails?.medium?.url ?? video.snippet?.thumbnails?.default?.url ?? null
            const duration = isoDurationToSeconds(detail?.contentDetails?.duration)
            const publishedAt = video.snippet?.publishedAt ? new Date(video.snippet.publishedAt) : null
            const isImported = existingLectureUrls.has(videoId)

            const existingStaged = await prisma.youtubeStagingVideo.findUnique({ where: { videoId } })
            if (existingStaged) {
              await prisma.youtubeStagingVideo.update({
                where: { videoId },
                data: {
                  title: videoTitle,
                  thumbnail,
                  duration,
                  publishedAt,
                  ytPlaylistId: playlistId,
                  ytPlaylistTitle: playlistTitle,
                  lastSeenAt: new Date(),
                  ...(isImported ? { status: "IMPORTED" as const } : {}),
                },
              })
              updated++
            } else {
              await prisma.youtubeStagingVideo.create({
                data: {
                  videoId,
                  title: videoTitle,
                  description: detail?.snippet?.description ?? null,
                  thumbnail,
                  duration,
                  publishedAt,
                  ytPlaylistId: playlistId,
                  ytPlaylistTitle: playlistTitle,
                  detectedLanguage: language,
                  detectedCategory: category,
                  status: isImported ? "IMPORTED" : "NEW",
                },
              })
              inserted++
            }
          }
          itemPageToken = itemData.nextPageToken ?? ""
        } while (itemPageToken)
      }
      pageToken = data.nextPageToken ?? ""
    } while (pageToken)

    return NextResponse.json({ fetched, inserted, updated })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 502 })
  }
}

async function youtubeFetch<T>(path: string, apiKey: string): Promise<T> {
  const response = await fetch(`${YT}${path}&key=${encodeURIComponent(apiKey)}`)
  const data = await response.json() as T & { error?: { message?: string } }
  if (!response.ok) throw new Error(data.error?.message ?? `YouTube API request failed (${response.status})`)
  return data
}

async function getVideoDetails(ids: string[], apiKey: string) {
  if (!ids.length) return new Map<string, YouTubeItem>()
  const data = await youtubeFetch<{ items?: YouTubeItem[] }>(`/videos?part=snippet,contentDetails&id=${ids.join(",")}`, apiKey)
  return new Map((data.items ?? []).map((item) => [item.id!, item]))
}

function isoDurationToSeconds(value?: string) {
  if (!value) return null
  const match = value.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/)
  if (!match) return null
  return Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0)
}

function detectLanguage(title: string) {
  const value = title.toLowerCase()
  if (/odia|odiya|oriya|ଓଡ଼ିଆ/.test(value)) return "Odia"
  if (/hindi|हिंदी/.test(value)) return "Hindi"
  if (/english/.test(value)) return "English"
  return "Odia"
}

function detectCategory(title: string) {
  const value = title.toLowerCase()
  if (/bhagavatam|srimad/.test(value)) return "Bhagavatam"
  if (/gita|bhagavad/.test(value)) return "Bhagavad Gita"
  if (/kirtan|kirtana/.test(value)) return "Kirtan"
  if (/festival|janmashtami|vyasa/.test(value)) return "Festival"
  return "General"
}