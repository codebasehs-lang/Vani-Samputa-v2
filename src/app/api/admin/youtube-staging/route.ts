import { requireAdmin } from "@/lib/adminAuth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

// Reads cached YouTube videos from the local staging table — no YouTube API calls,
// so opening this page never costs quota. Use the sync endpoint to refresh the cache.
export async function GET() {
  const guard = await requireAdmin()
  if (guard.response) return guard.response

  const [categories, videos] = await Promise.all([
    prisma.category.findMany({ where: { active: true }, select: { name: true }, orderBy: { name: "asc" } }),
    prisma.youtubeStagingVideo.findMany({
      orderBy: [
        { status: "asc" },
        { ytPlaylistTitle: "asc" },
        { ytPlaylistPosition: "asc" },
        { publishedAt: "desc" },
      ],
    }),
  ])

  return NextResponse.json({ categories: categories.map((category) => category.name), videos })
}

// Updates a single staged row's reviewed fields (language/category/playlist/status),
// or bulk-updates the status of many rows at once when videoIds is provided.
export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard.response) return guard.response

  const body = await req.json().catch(() => null) as {
    videoId?: string
    videoIds?: string[]
    language?: string
    category?: string
    playlistTitle?: string
    customSortOrder?: number | null
    orderUpdates?: { videoId?: string; customSortOrder?: number | null }[]
    status?: "NEW" | "APPROVED" | "SKIPPED"
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Invalid staging request" }, { status: 400 })

  if (Array.isArray(body.orderUpdates)) {
    const orderUpdates = body.orderUpdates.map((update) => ({
      videoId: String(update.videoId ?? "").trim(),
      customSortOrder: normalizeCustomSortOrder(update.customSortOrder),
    })).filter((update) => update.videoId)
    if (!orderUpdates.length) return NextResponse.json({ error: "orderUpdates must not be empty" }, { status: 400 })

    await prisma.$transaction(async (tx) => {
      for (const update of orderUpdates) {
        await tx.youtubeStagingVideo.update({
          where: { videoId: update.videoId },
          data: { customSortOrder: update.customSortOrder },
        })
        await tx.lecture.updateMany({
          where: { mediaType: "VIDEO", url: update.videoId },
          data: { sortOrder: update.customSortOrder ?? 0 },
        })
      }
    })
    return NextResponse.json({ updated: orderUpdates.length })
  }

  if (Array.isArray(body.videoIds)) {
    if (body.videoIds.some((id) => typeof id !== "string")) return NextResponse.json({ error: "videoIds must contain strings" }, { status: 400 })
    const videoIds = [...new Set(body.videoIds.map((id) => id.trim()).filter(Boolean))]
    if (!videoIds.length) return NextResponse.json({ error: "videoIds must not be empty" }, { status: 400 })
    const data: { language?: string; category?: string; playlistTitle?: string; status?: "NEW" | "APPROVED" | "SKIPPED" } = {}
    for (const field of ["language", "category", "playlistTitle"] as const) {
      if (body[field] === undefined) continue
      if (typeof body[field] !== "string" || body[field].length > 191) return NextResponse.json({ error: `${field} must be a string of at most 191 characters` }, { status: 400 })
      data[field] = body[field].trim()
    }
    if (data.language !== undefined && !["Odia", "Hindi", "English", "Sanskrit"].includes(data.language)) return NextResponse.json({ error: "Invalid language" }, { status: 400 })
    if (body.status !== undefined) {
      if (!["NEW", "APPROVED", "SKIPPED"].includes(body.status)) return NextResponse.json({ error: "status must be NEW, APPROVED, or SKIPPED" }, { status: 400 })
      data.status = body.status
    }
    if (!Object.keys(data).length) return NextResponse.json({ error: "No reviewed fields to update" }, { status: 400 })
    try {
      const result = await prisma.youtubeStagingVideo.updateMany({
        where: { videoId: { in: videoIds }, status: { not: "IMPORTED" } },
        data,
      })
      return NextResponse.json({ updated: result.count })
    } catch {
      return NextResponse.json({ error: "Could not save playlist changes" }, { status: 500 })
    }
  }

  const videoId = String(body.videoId ?? "").trim()
  if (!videoId) return NextResponse.json({ error: "videoId is required" }, { status: 400 })

  const data: Record<string, string | number | null> = {}
  if (body.language !== undefined) data.language = body.language || null
  if (body.category !== undefined) data.category = body.category
  if (body.playlistTitle !== undefined) data.playlistTitle = body.playlistTitle
  if (body.customSortOrder !== undefined) data.customSortOrder = normalizeCustomSortOrder(body.customSortOrder)
  if (body.status && body.status !== "IMPORTED" as string) data.status = body.status

  try {
    const updated = await prisma.youtubeStagingVideo.update({ where: { videoId }, data })
    if (body.customSortOrder !== undefined) {
      await prisma.lecture.updateMany({
        where: { mediaType: "VIDEO", url: videoId },
        data: { sortOrder: normalizeCustomSortOrder(body.customSortOrder) ?? 0 },
      })
    }
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: "Staged video not found" }, { status: 404 })
  }
}

function normalizeCustomSortOrder(value: number | null | undefined) {
  if (value == null) return null
  const order = Math.trunc(Number(value))
  return Number.isFinite(order) && order > 0 ? order : null
}
