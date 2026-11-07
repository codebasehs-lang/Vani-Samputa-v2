import assert from "node:assert/strict"
import { test } from "node:test"
import * as XLSX from "xlsx"
import { createTagWorkbook, readTagWorkbook } from "./tagSpreadsheet"

function dataFor(workbook: XLSX.WorkBook, bookType: XLSX.BookType = "biff8") {
    const data = XLSX.write(workbook, { type: "buffer", bookType }) as Buffer
    return Uint8Array.from(data).buffer
}

test("exported XLS and XLSX files import with the same names", () => {
    const tags = [{ name: "Bhagavad Gita" }, { name: "Guru, Tattva" }, { name: "Śrī Kṛṣṇa" }]
    for (const type of ["biff8", "xlsx"] as const) {
        assert.deepEqual(readTagWorkbook(dataFor(createTagWorkbook(tags), type)), tags.map((tag, index) => ({ ...tag, row: index + 2 })))
    }
})

test("import trims names, ignores blank rows and deduplicates names", () => {
    const workbook = createTagWorkbook([{ name: " Gita " }, { name: "" }, { name: "Gita" }, { name: "Other" }])
    assert.deepEqual(readTagWorkbook(dataFor(workbook)), [{ name: "Gita", row: 2 }, { name: "Other", row: 5 }])
})

test("invalid files and rows are rejected before importing", () => {
    assert.throws(() => readTagWorkbook(dataFor(createTagWorkbook([]))), /no tag names/)
    assert.throws(() => readTagWorkbook(dataFor(createTagWorkbook([{ name: "x".repeat(192) }]))), /Row 2/)
    const workbook = createTagWorkbook([])
    workbook.Sheets.Tags = XLSX.utils.aoa_to_sheet([["Tag"], ["Gita"]])
    assert.throws(() => readTagWorkbook(dataFor(workbook)), /headed "Name"/)
    workbook.Sheets.Tags = XLSX.utils.aoa_to_sheet([["Name"], [123]])
    assert.throws(() => readTagWorkbook(dataFor(workbook)), /Row 2/)
    workbook.Sheets.Tags = XLSX.utils.aoa_to_sheet([["Name"], ["Gita", "extra"]])
    assert.throws(() => readTagWorkbook(dataFor(workbook)), /Row 2/)
    delete workbook.Sheets.Tags
    workbook.SheetNames = ["Wrong"]
    workbook.Sheets.Wrong = XLSX.utils.aoa_to_sheet([["Name"]])
    assert.throws(() => readTagWorkbook(dataFor(workbook)), /"Tags" sheet/)
})
