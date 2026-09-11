import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/adminAuth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard.response) return guard.response

  const year = Number(req.nextUrl.searchParams.get("year"))
  const month = Number(req.nextUrl.searchParams.get("month"))
  if (!year || !month || month < 1 || month > 12) {
    return NextResponse.json({ error: "Invalid year/month" }, { status: 400 })
  }

  const start = new Date(Date.UTC(year, month - 1, 1))
  const end = new Date(Date.UTC(year, month, 1))

  const quotes = await prisma.dailyVerse.findMany({
    where: { date: { gte: start, lt: end } },
    orderBy: { date: "asc" },
  })
  return NextResponse.json(quotes)
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard.response) return guard.response

  const { id, odia, hindi, english, source } = await req.json()
  if (typeof id !== "string") return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const updated = await prisma.dailyVerse.update({
    where: { id },
    data: {
      odia: odia || null,
      hindi: hindi || null,
      english: english || null,
      source: source || null,
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard.response) return guard.response
  const id = req.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  await prisma.dailyVerse.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
