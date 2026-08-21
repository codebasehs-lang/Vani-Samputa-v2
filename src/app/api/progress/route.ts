import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const lectureId = req.nextUrl.searchParams.get("lectureId")
  if (!lectureId) return NextResponse.json({ positionS: 0 })

  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ positionS: 0 })

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ positionS: 0 })

  const progress = await prisma.userProgress.findUnique({
    where: { userId_lectureId: { userId: user.id, lectureId } },
  })

  return NextResponse.json({ positionS: progress?.positionS ?? 0, completed: progress?.completed ?? false })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ ok: false }, { status: 401 })

  const { lectureId, positionS, completed } = await req.json() as {
    lectureId: string
    positionS: number
    completed?: boolean
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ ok: false }, { status: 404 })

  await prisma.userProgress.upsert({
    where: { userId_lectureId: { userId: user.id, lectureId } },
    create: { userId: user.id, lectureId, positionS, completed: completed ?? false },
    update: { positionS, completed: completed ?? false },
  })

  // Log to history
  await prisma.userHistory.create({
    data: { userId: user.id, lectureId },
  })

  return NextResponse.json({ ok: true })
}
