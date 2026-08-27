import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { sanitizeNoteHtml } from "@/lib/sanitizeNoteHtml"

async function getUser() {
  const session = await auth()
  if (!session?.user?.email) return null
  return prisma.user.findUnique({ where: { email: session.user.email } })
}

function isBlank(html: string) {
  return html.replace(/<[^>]*>/g, "").trim().length === 0
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

  const { lectureId, content, timestampS, color, drawing } = await req.json() as {
    lectureId: string; content: string; timestampS: number; color?: string; drawing?: string | null
  }
  const cleanContent = sanitizeNoteHtml(content ?? "")
  if (isBlank(cleanContent) && !drawing) return NextResponse.json({ error: "Empty note" }, { status: 400 })

  const note = await prisma.userNote.create({
    data: {
      userId: user.id,
      lectureId,
      content: cleanContent,
      timestampS: Math.floor(timestampS),
      color: color || "#FFD700",
      drawing: drawing || null,
    },
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

export async function PATCH(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, content, timestampS, color, drawing } = await req.json() as {
    id: string; content: string; timestampS?: number; color?: string; drawing?: string | null
  }
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  const cleanContent = sanitizeNoteHtml(content ?? "")
  if (isBlank(cleanContent) && !drawing) return NextResponse.json({ error: "Empty note" }, { status: 400 })

  const { count } = await prisma.userNote.updateMany({
    where: { id, userId: user.id },
    data: {
      content: cleanContent,
      ...(timestampS !== undefined ? { timestampS: Math.floor(timestampS) } : {}),
      ...(color !== undefined ? { color } : {}),
      ...(drawing !== undefined ? { drawing: drawing || null } : {}),
    },
  })
  if (count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const note = await prisma.userNote.findUnique({ where: { id } })
  return NextResponse.json(note)
}
