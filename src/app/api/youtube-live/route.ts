import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const revalidate = 120 // cache 2 min

export async function GET() {
  const config = await prisma.liveConfig.findFirst()

  // Manual override: admin marked as live
  if (config?.isLive && config.streamUrl) {
    const videoId = extractVideoId(config.streamUrl)
    return NextResponse.json({ isLive: true, videoId, channelId: config.channelId })
  }

  // Auto-detect via YouTube API if key is set
  const apiKey = process.env.YOUTUBE_API_KEY
  const channelId = config?.channelId || process.env.YOUTUBE_CHANNEL_ID
  if (apiKey && channelId && config?.autoFetch) {
    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=live&type=video&key=${apiKey}`
      const res = await fetch(url, { next: { revalidate: 120 } })
      const data = await res.json()
      const item = data.items?.[0]
      if (item) {
        const videoId = item.id.videoId
        await prisma.liveConfig.updateMany({
          where: { channelId },
          data: { isLive: true, streamUrl: videoId, lastCheckedAt: new Date() },
        })
        return NextResponse.json({ isLive: true, videoId, title: item.snippet.title })
      }
      await prisma.liveConfig.updateMany({
        where: { channelId },
        data: { isLive: false, lastCheckedAt: new Date() },
      })
    } catch {
      // API error — fall through to not-live
    }
  }

  return NextResponse.json({ isLive: false })
}

function extractVideoId(urlOrId: string): string {
  // Handle full YouTube URLs
  try {
    const u = new URL(urlOrId)
    return u.searchParams.get("v") ?? u.pathname.split("/").pop() ?? urlOrId
  } catch {
    return urlOrId
  }
}
