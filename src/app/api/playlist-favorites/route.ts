import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

async function getUser() {
  const session = await auth()
  if (!session?.user?.email) return null
  return prisma.user.findUnique({ where: { email: session.user.email } })
}

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json([])

  const favorites = await prisma.userPlaylistFavorite.findMany({
    where: { userId: user.id },
    select: { playlistId: true },
  })
  return NextResponse.json(favorites.map((favorite) => favorite.playlistId))
}

export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { playlistId } = await request.json() as { playlistId?: string }
  if (!playlistId) return NextResponse.json({ error: "Playlist is required" }, { status: 400 })

  const existing = await prisma.userPlaylistFavorite.findUnique({
    where: { userId_playlistId: { userId: user.id, playlistId } },
  })

  if (existing) {
    await prisma.userPlaylistFavorite.delete({ where: { id: existing.id } })
    return NextResponse.json({ favorited: false })
  }

  await prisma.userPlaylistFavorite.create({ data: { userId: user.id, playlistId } })
  return NextResponse.json({ favorited: true })
}
