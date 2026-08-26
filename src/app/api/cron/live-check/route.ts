import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import webpush from "web-push"

// Vercel calls this every 5 min via cron (vercel.json)
export async function GET(req: NextRequest) {
  // Protect with a shared secret to prevent public abuse
  const secret = req.headers.get("x-cron-secret") ?? req.nextUrl.searchParams.get("secret")
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const config = await prisma.liveConfig.findFirst()
  if (!config?.channelId || !config.autoFetch) {
    return NextResponse.json({ skipped: true })
  }

  // Check YouTube for live stream
  const apiKey = process.env.YOUTUBE_API_KEY
  let isLive = false
  let videoId: string | undefined

  if (apiKey) {
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${config.channelId}&eventType=live&type=video&key=${apiKey}`
      )
      const data = await res.json()
      const item = data.items?.[0]
      if (item) { isLive = true; videoId = item.id.videoId }
    } catch {
      return NextResponse.json({ error: "YouTube API error" }, { status: 500 })
    }
  }

  // Update DB
  await prisma.liveConfig.updateMany({
    where: { id: config.id },
    data: { isLive, streamUrl: videoId ?? config.streamUrl, lastCheckedAt: new Date() },
  })

  // Send push only when state changes from not-live → live
  if (isLive && !config.isLive) {
    const subs = await prisma.pushSubscription.findMany()
    if (!subs.length) return NextResponse.json({ pushed: 0 })

    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT ?? "mailto:admin@example.com",
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "",
      process.env.VAPID_PRIVATE_KEY ?? ""
    )

    let pushed = 0
    await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify({
              title: "🔴 Haladhara Svāmī is Live!",
              body: "Satsang is streaming now. Tap to join.",
              url: "/live",
            })
          )
          pushed++
        } catch {
          // Subscription expired — clean it up
          await prisma.pushSubscription.deleteMany({ where: { endpoint: sub.endpoint } })
        }
      })
    )
    return NextResponse.json({ pushed })
  }

  return NextResponse.json({ isLive, pushed: 0 })
}
