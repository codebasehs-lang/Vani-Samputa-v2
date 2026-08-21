import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

async function getUser() {
  const session = await auth()
  if (!session?.user?.email) return null
  return prisma.user.findUnique({ where: { email: session.user.email } })
}

export async function GET(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json([])
  const lectureId = req.nextUrl.searchParams.get("lectureId")
  const notes = await prisma.userNote.findMany({
    where: { userId: user.id, ...(lectureId ? { lectureId } : {}) },
    orderBy: { createdAt: "desc" },
    include: { lecture: { select: { title: true } } },
  })
  return NextResponse.json(notes)
}

export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { lectureId, content, timestampS } = await req.json() as {
    lectureId: string; content: string; timestampS: number
  }
  if (!content.trim()) return NextResponse.json({ error: "Empty note" }, { status: 400 })

  const note = await prisma.userNote.create({
    data: { userId: user.id, lectureId, content: content.trim(), timestampS: Math.floor(timestampS) },
  })
  return NextResponse.json(note)
}

export async function DELETE(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const id = req.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  await prisma.userNote.deleteMany({ where: { id, userId: user.id } })
  return NextResponse.json({ ok: true })
}
