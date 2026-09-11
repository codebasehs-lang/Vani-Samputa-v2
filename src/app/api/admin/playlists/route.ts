import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/adminAuth"
import { prisma } from "@/lib/prisma"
import { validateCategories } from "@/lib/categories"

// Public listing pages (video/[language], audio/[language], homepage) group
// playlists by Playlist.categories — editing a Lecture's category never changes
// which section its parent playlist appears under. This route lets admins edit
// the playlist's own category assignment directly.
export async function GET() {
  const guard = await requireAdmin()
  if (guard.response) return guard.response

  const playlists = await prisma.playlist.findMany({
    orderBy: [{ language: "asc" }, { title: "asc" }],
    include: {
      categories: { select: { name: true } },
      _count: { select: { lectures: true } },
    },
  })
  return NextResponse.json(playlists)
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard.response) return guard.response

  const { id, categories } = await req.json() as { id?: string; categories?: string[] }
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })

  const categoryNames = [...new Set((categories ?? []).map((name) => name.trim()).filter(Boolean))]
  const missing = await validateCategories(categoryNames)
  if (missing.length) {
    return NextResponse.json({ error: `Add these categories first from Admin -> Categories: ${missing.join(", ")}` }, { status: 400 })
  }

  const playlist = await prisma.playlist.update({
    where: { id },
    data: {
      category: categoryNames[0] ?? "General",
      categories: { set: categoryNames.map((name) => ({ name })) },
    },
    include: { categories: { select: { name: true } }, _count: { select: { lectures: true } } },
  })
  return NextResponse.json(playlist)
}
