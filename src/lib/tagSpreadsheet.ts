import * as XLSX from "xlsx";

export type TagImportRow = { name: string; row: number }

export function createTagWorkbook(tags: { name: string }[]) {
    const worksheet = XLSX.utils.aoa_to_sheet([["Name"], ...tags.map((tag) => [tag.name])])
    worksheet["!cols"] = [{ wch: 48 }]
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tags")
    return workbook
}

export function readTagWorkbook(data: ArrayBuffer): TagImportRow[] {
    const workbook = XLSX.read(data, { type: "array" })
    const worksheet = workbook.Sheets.Tags
    if (!worksheet) throw new Error('The spreadsheet must contain a "Tags" sheet.')
    if (worksheet["!ref"] && XLSX.utils.decode_range(worksheet["!ref"]).e.r > 5000) {
        throw new Error("Import up to 5,000 spreadsheet rows at a time.")
    }
    const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: "", blankrows: true })
    if (rows[0]?.[0] !== "Name" || rows[0].slice(1).some((value) => value !== "")) {
        throw new Error('The Tags sheet must have a single column headed "Name".')
    }
    if (rows.length > 5001) throw new Error("Import up to 5,000 spreadsheet rows at a time.")
    const seen = new Set<string>()
    const parsed: TagImportRow[] = []
    for (let index = 1; index < rows.length; index++) {
        const values = rows[index]
        if (values.every((value) => value === "")) continue
        const name = typeof values[0] === "string" ? values[0].trim() : ""
        if (!name || name.length > 191 || values.slice(1).some((value) => value !== "")) {
            throw new Error(`Row ${index + 1}: enter a tag name of 1 to 191 characters in the Name column only.`)
        }
        if (seen.has(name)) continue
        seen.add(name)
        parsed.push({ name, row: index + 1 })
    }
    if (!parsed.length) throw new Error("The spreadsheet has no tag names to import.")
    return parsed
}
