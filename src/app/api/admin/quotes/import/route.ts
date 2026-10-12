import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/adminAuth"
import { prisma } from "@/lib/prisma"
import { formatQuoteDay, parseQuoteDay, quoteStorageDate, selectRecurringQuotes, storedQuoteDay } from "@/lib/dailyQuotes"

type Row = Record<string, string | number>

type ImportResponse = {
  created: number
  updated: number
  skipped: number
  errors: string[]
}

function getCol(row: Row, ...keys: string[]) {
  for (const key of keys) {
    const found = Object.keys(row).find((column) => column.toLowerCase() === key.toLowerCase())
    if (found) return (row[found] ?? "").toString().trim()
  }
  return ""
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard.response) return guard.response

  const { rows } = await req.json() as { rows: Row[] }
  if (!Array.isArray(rows) || rows.length > 366 || rows.some((row) => !row || typeof row !== "object" || Array.isArray(row))) {
    return NextResponse.json({ error: "Provide up to 366 quote rows." }, { status: 400 })
  }
  const existingQuotes = selectRecurringQuotes(await prisma.dailyVerse.findMany({ select: { date: true } }))
  const dates = new Map(existingQuotes.map((quote) => [formatQuoteDay(storedQuoteDay(quote.date)), quote.date]))

  const result: ImportResponse = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  }

  for (const [index, row] of rows.entries()) {
    try {
      const dateColumn = Object.keys(row).find((column) => ["date", "day"].includes(column.toLowerCase()))
      const quoteDay = parseQuoteDay(dateColumn ? row[dateColumn] : undefined)
      if (!quoteDay) {
        result.skipped++
        result.errors.push(`Row ${index + 2}: invalid or missing date; use MM-DD, YYYY-MM-DD or DD/MM/YYYY`)
        continue
      }

      const odia = getCol(row, "odia") || null
      const hindi = getCol(row, "hindi") || null
      const english = getCol(row, "english") || null
      const source = getCol(row, "source", "reference") || null

      if (!odia && !hindi && !english) {
        result.skipped++
        result.errors.push(`Row ${index + 2}: no quote text in Odia, Hindi or English`)
        continue
      }

      const key = formatQuoteDay(quoteDay)
      const existing = dates.get(key)
      const date = existing ?? quoteStorageDate(quoteDay)

      await prisma.dailyVerse.upsert({
        where: { date },
        update: { odia, hindi, english, source },
        create: { date, odia, hindi, english, source },
      })

      if (existing) result.updated++
      else result.created++
      dates.set(key, date)
    } catch (error) {
      result.skipped++
      result.errors.push(`Row ${index + 2}: ${String(error)}`)
    }
  }

  return NextResponse.json({
    ...result,
    errors: result.errors.slice(0, 25),
  })
}
