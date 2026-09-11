import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/adminAuth"
import { prisma } from "@/lib/prisma"

// Reads cached YouTube videos from the local staging table — no YouTube API calls,
// so opening this page never costs quota. Use the sync endpoint to refresh the cache.
export async function GET() {
  const guard = await requireAdmin()
  if (guard.response) return guard.response

  const [categories, videos] = await Promise.all([
    prisma.category.findMany({ where: { active: true }, select: { name: true }, orderBy: { name: "asc" } }),
    prisma.youtubeStagingVideo.findMany({ orderBy: [{ status: "asc" }, { publishedAt: "desc" }] }),
  ])

  return NextResponse.json({ categories: categories.map((category) => category.name), videos })
}

// Updates a single staged row's reviewed fields (language/category/playlist/status),
// or bulk-updates the status of many rows at once when videoIds is provided.
export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard.response) return guard.response

  const body = await req.json() as {
    videoId?: string
    videoIds?: string[]
    language?: string
    category?: string
    playlistTitle?: string
    status?: "NEW" | "APPROVED" | "SKIPPED"
  }

  if (Array.isArray(body.videoIds)) {
    const videoIds = body.videoIds.map((id) => String(id).trim()).filter(Boolean)
    if (!videoIds.length) return NextResponse.json({ error: "videoIds must not be empty" }, { status: 400 })
    if (!body.status || (body.status as string) === "IMPORTED") {
      return NextResponse.json({ error: "status must be NEW, APPROVED, or SKIPPED" }, { status: 400 })
    }
    const result = await prisma.youtubeStagingVideo.updateMany({
      where: { videoId: { in: videoIds }, status: { not: "IMPORTED" } },
      data: { status: body.status },
    })
    return NextResponse.json({ updated: result.count })
  }

  const videoId = String(body.videoId ?? "").trim()
  if (!videoId) return NextResponse.json({ error: "videoId is required" }, { status: 400 })

  const data: Record<string, string | null> = {}
  if (body.language !== undefined) data.language = body.language || null
  if (body.category !== undefined) data.category = body.category || null
  if (body.playlistTitle !== undefined) data.playlistTitle = body.playlistTitle || null
  if (body.status && body.status !== "IMPORTED" as string) data.status = body.status

  try {
    const updated = await prisma.youtubeStagingVideo.update({ where: { videoId }, data })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: "Staged video not found" }, { status: 404 })
  }
}
