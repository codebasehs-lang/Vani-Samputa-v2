import assert from "node:assert/strict"
import { test } from "node:test"
import * as XLSX from "xlsx"
import {
  buildQuoteMonthRows, formatQuoteDay, parseQuoteDay, quoteStorageDate,
  selectRecurringQuotes, storedQuoteDay,
} from "./dailyQuotes"

test("full dates and timestamps retain month/day and ignore year", () => {
  for (const value of [
    "2026-07-01", "2035-07-01 0:00:00", "2026-07-01T00:00:00.000Z",
    "2026/07/01", "2026.07.01", "01/07/2026", "1-7-2035",
    "01.07.2026", "01/07/26", "01/07/2026 0:00:00", "07-01",
    "1 July 2026", "July 1, 2035", "1 Jul",
  ]) {
    assert.deepEqual(parseQuoteDay(value), { month: 7, day: 1 }, value)
  }
  assert.deepEqual(parseQuoteDay("02/03/2026"), { month: 3, day: 2 })
  assert.deepEqual(parseQuoteDay("2025-02-29"), { month: 2, day: 29 })
})

test("invalid and missing month/day values are rejected without date rollover", () => {
  for (const value of [
    "", null, undefined, {}, "2026-02-30", "31/04/2026", "13-01",
    "07-00", "2026-00-01", "July", "7", "not a date",
    0, -1, NaN, Infinity, 2958466, new Date("invalid"),
  ]) {
    assert.equal(parseQuoteDay(value), null, String(value))
  }
})

test("Excel date cells and numeric serials preserve the spreadsheet day", () => {
  const serial = (Date.UTC(2026, 6, 1) - Date.UTC(1899, 11, 30)) / 86400000
  assert.deepEqual(parseQuoteDay(serial), { month: 7, day: 1 })
  assert.deepEqual(parseQuoteDay(serial + 0.5), { month: 7, day: 1 })
  assert.deepEqual(parseQuoteDay(serial - 1462, true), { month: 7, day: 1 })
  assert.deepEqual(parseQuoteDay(new Date(2026, 6, 1)), { month: 7, day: 1 })
  assert.deepEqual(parseQuoteDay(1), { month: 1, day: 1 })
  assert.deepEqual(parseQuoteDay(60), { month: 2, day: 29 })

  const workbook = XLSX.utils.book_new()
  const sheet = XLSX.utils.aoa_to_sheet([["Date", "English"], [serial, "Quote"]])
  sheet.A2.z = "yyyy-mm-dd h:mm:ss"
  XLSX.utils.book_append_sheet(workbook, sheet, "Quotes")
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })
  const read = XLSX.read(buffer)
  const [row] = XLSX.utils.sheet_to_json<{ Date: number }>(read.Sheets.Quotes, { raw: true })
  assert.deepEqual(parseQuoteDay(row.Date), { month: 7, day: 1 })
})

test("monthly templates have year-free dates and all valid days including February 29", () => {
  for (const [month, days] of [[1, 31], [2, 29], [4, 30], [7, 31], [12, 31]]) {
    const rows = buildQuoteMonthRows(month)
    assert.equal(rows.length, days)
    for (const [index, row] of rows.entries()) {
      assert.match(row.Date, /^\d{2}-\d{2}$/)
      assert.deepEqual(parseQuoteDay(row.Date), { month, day: index + 1 })
      assert.deepEqual(Object.keys(row), ["Date", "Source", "Odia", "Hindi", "English"])
    }
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "DailyQuotes")
    const read = XLSX.read(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }), { cellDates: true })
    assert.deepEqual(XLSX.utils.sheet_to_json(read.Sheets.DailyQuotes, { raw: true, defval: "" }), rows)
  }
})

test("legacy years repeat annually, selecting the latest year for each month/day", () => {
  const quotes = [
    { id: "older", date: new Date("2025-07-01T00:00:00Z") },
    { id: "next-day", date: new Date("2026-07-02T00:00:00Z") },
    { id: "newest", date: new Date("2027-07-01T00:00:00Z") },
    { id: "other-month", date: new Date("2028-08-01T00:00:00Z") },
  ]
  assert.deepEqual(selectRecurringQuotes(quotes, 7).map((q) => q.id), ["newest", "next-day"])
  for (const year of [2026, 2027, 2035]) {
    const today = new Date(year, 6, 1)
    assert.equal(selectRecurringQuotes(quotes, today.getMonth() + 1, today.getDate())[0].id, "newest")
  }
  assert.deepEqual(selectRecurringQuotes(quotes, 7, 3), [])
  assert.deepEqual(selectRecurringQuotes([]), [])
  assert.deepEqual(selectRecurringQuotes([...quotes].reverse()), selectRecurringQuotes(quotes))
})

test("canonical storage and legacy dates share a year-free key across timezones", () => {
  const day = { month: 2, day: 29 }
  const date = quoteStorageDate(day)
  assert.equal(date.toISOString(), "2000-02-29T00:00:00.000Z")
  assert.deepEqual(storedQuoteDay(date), day)
  assert.equal(formatQuoteDay(day), "02-29")
  assert.equal(formatQuoteDay(storedQuoteDay(new Date("2026-07-01T00:00:00Z"))), "07-01")
  assert.equal(selectRecurringQuotes([{ date }], 2, 29).length, 1)
  assert.equal(selectRecurringQuotes([{ date }], 2, 28).length, 0)
  assert.equal(selectRecurringQuotes([{ date }], 3, 1).length, 0)
})
