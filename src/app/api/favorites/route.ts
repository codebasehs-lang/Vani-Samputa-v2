import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

async function getUser(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) return null
  return prisma.user.findUnique({ where: { email: session.user.email } })
}

export async function GET(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json([])
  const favs = await prisma.userFavorite.findMany({
    where: { userId: user.id },
    select: { lectureId: true },
  })
  return NextResponse.json(favs.map((f) => f.lectureId))
}

export async function POST(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { lectureId } = await req.json() as { lectureId: string }

  const existing = await prisma.userFavorite.findUnique({
    where: { userId_lectureId: { userId: user.id, lectureId } },
  })

  if (existing) {
    await prisma.userFavorite.delete({ where: { userId_lectureId: { userId: user.id, lectureId } } })
    return NextResponse.json({ favorited: false })
  }

  await prisma.userFavorite.create({ data: { userId: user.id, lectureId } })
  return NextResponse.json({ favorited: true })
}
