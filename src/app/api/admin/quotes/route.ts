import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/adminAuth"
import { prisma } from "@/lib/prisma"
import { formatQuoteDay, selectRecurringQuotes, storedQuoteDay } from "@/lib/dailyQuotes"

export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard.response) return guard.response

  const month = Number(req.nextUrl.searchParams.get("month"))
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "Invalid month" }, { status: 400 })
  }

  const quotes = await prisma.dailyVerse.findMany()
  return NextResponse.json(selectRecurringQuotes(quotes, month).map((quote) => ({
    ...quote,
    date: formatQuoteDay(storedQuoteDay(quote.date)),
  })))
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
  return NextResponse.json({ ...updated, date: formatQuoteDay(storedQuoteDay(updated.date)) })
}

export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard.response) return guard.response
  const id = req.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  await prisma.$transaction(async (tx) => {
    const quote = await tx.dailyVerse.findUniqueOrThrow({ where: { id }, select: { date: true } })
    const key = formatQuoteDay(storedQuoteDay(quote.date))
    const quotes = await tx.dailyVerse.findMany({ select: { id: true, date: true } })
    const ids = quotes.filter((item) => formatQuoteDay(storedQuoteDay(item.date)) === key).map((item) => item.id)
    await tx.dailyVerse.deleteMany({ where: { id: { in: ids } } })
  })
  return NextResponse.json({ ok: true })
}
