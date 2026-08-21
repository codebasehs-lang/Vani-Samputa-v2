import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/adminAuth"
import { prisma } from "@/lib/prisma"

type Row = Record<string, string>

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

function parseDate(value: string) {
  const raw = value.trim()
  if (!raw) return null

  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (iso) {
    const [, y, m, d] = iso
    return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d), 12, 0, 0))
  }

  const dmy = raw.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/)
  if (dmy) {
    const [, d, m, y] = dmy
    return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d), 12, 0, 0))
  }

  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return null
  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate(), 12, 0, 0))
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard.response) return guard.response

  const { rows } = await req.json() as { rows: Row[] }

  const result: ImportResponse = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  }

  for (const [index, row] of rows.entries()) {
    try {
      const dateText = getCol(row, "date", "day")
      const date = parseDate(dateText)
      if (!date) {
        result.skipped++
        result.errors.push(`Row ${index + 2}: invalid or missing date`)
        continue
      }

      const quote = getCol(row, "quote", "quote text", "text", "message")
      const sanskrit = getCol(row, "sanskrit") || quote
      const devanagari = getCol(row, "devanagari") || null
      const odia = getCol(row, "odia") || null
      const hindi = getCol(row, "hindi") || null
      const english = getCol(row, "english") || quote || null
      const source = getCol(row, "source", "reference") || null

      if (!sanskrit) {
        result.skipped++
        result.errors.push(`Row ${index + 2}: quote/sanskrit text missing`)
        continue
      }

      const existing = await prisma.dailyVerse.findUnique({ where: { date } })

      await prisma.dailyVerse.upsert({
        where: { date },
        update: { sanskrit, devanagari, odia, hindi, english, source },
        create: { date, sanskrit, devanagari, odia, hindi, english, source },
      })

      if (existing) result.updated++
      else result.created++
    } catch (error) {
      result.errors.push(`Row ${index + 2}: ${String(error)}`)
    }
  }

  return NextResponse.json({
    ...result,
    errors: result.errors.slice(0, 25),
  })
}
