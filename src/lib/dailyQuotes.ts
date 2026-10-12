export type QuoteDay = { month: number; day: number }

const STORAGE_YEAR = 2000
const MONTH_NAMES = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
]

function validDay(month: number, day: number): QuoteDay | null {
  if (!Number.isInteger(month) || !Number.isInteger(day) || month < 1 || month > 12 || day < 1) return null
  const date = new Date(Date.UTC(STORAGE_YEAR, month - 1, day))
  return date.getUTCMonth() === month - 1 ? { month, day } : null
}

export function parseQuoteDay(value: unknown, date1904 = false): QuoteDay | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : validDay(value.getMonth() + 1, value.getDate())
  }
  if (typeof value === "number") {
    const adjusted = value + (date1904 ? 1462 : 0)
    if (!Number.isFinite(adjusted) || adjusted < 1 || adjusted >= 2958466) return null
    const serial = Math.floor(adjusted)
    // Excel's 1900 calendar includes a fictitious February 29.
    if (serial === 60) return { month: 2, day: 29 }
    const date = new Date(Date.UTC(1899, 11, 31) + (serial > 60 ? serial - 1 : serial) * 86400000)
    return validDay(date.getUTCMonth() + 1, date.getUTCDate())
  }
  if (typeof value !== "string") return null
  const raw = value.trim()
  const iso = raw.match(/^\d{4}[-/.](\d{1,2})[-/.](\d{1,2})(?:[T\s].*)?$/)
  if (iso) return validDay(Number(iso[1]), Number(iso[2]))
  const dmy = raw.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](?:\d{4}|\d{2})(?:\s.*)?$/)
  if (dmy) return validDay(Number(dmy[2]), Number(dmy[1]))
  const monthDay = raw.match(/^(\d{1,2})-(\d{1,2})$/)
  if (monthDay) return validDay(Number(monthDay[1]), Number(monthDay[2]))
  const named = raw.toLowerCase().match(/^(?:(\d{1,2})\s+([a-z]+)|([a-z]+)\s+(\d{1,2}))(?:,?\s+\d{4})?$/)
  if (named) {
    const name = named[2] ?? named[3]
    const month = MONTH_NAMES.findIndex((item) => item === name || item.slice(0, 3) === name) + 1
    return validDay(month, Number(named[1] ?? named[4]))
  }
  return null
}

export function formatQuoteDay({ month, day }: QuoteDay) {
  return `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

export function quoteStorageDate({ month, day }: QuoteDay) {
  return new Date(Date.UTC(STORAGE_YEAR, month - 1, day))
}

export function storedQuoteDay(date: Date): QuoteDay {
  return { month: date.getUTCMonth() + 1, day: date.getUTCDate() }
}

export function selectRecurringQuotes<T extends { date: Date }>(quotes: T[], month?: number, day?: number): T[] {
  const selected = new Map<string, T>()
  for (const quote of quotes) {
    const date = storedQuoteDay(quote.date)
    if ((month !== undefined && date.month !== month) || (day !== undefined && date.day !== day)) continue
    const key = formatQuoteDay(date)
    const existing = selected.get(key)
    if (!existing || quote.date > existing.date) selected.set(key, quote)
  }
  return [...selected.values()].sort((a, b) =>
    formatQuoteDay(storedQuoteDay(a.date)).localeCompare(formatQuoteDay(storedQuoteDay(b.date)))
  )
}

export function buildQuoteMonthRows(month: number) {
  const days = new Date(Date.UTC(STORAGE_YEAR, month, 0)).getUTCDate()
  return Array.from({ length: days }, (_, i) => ({
    Date: formatQuoteDay({ month, day: i + 1 }),
    Source: "",
    Odia: "",
    Hindi: "",
    English: "",
  }))
}
