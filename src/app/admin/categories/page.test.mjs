import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { test } from "node:test"
import vm from "node:vm"
import ts from "typescript"
import * as XLSX from "xlsx"

const require = createRequire(import.meta.url)

function setup({ rows = [], responses = [], tags = [{ id: "tag-1", name: "Gita" }] } = {}) {
    const state = [tags, "", "", null, "", false, rows, "tags-export.xls", 0, null]
    const calls = []
    const downloads = []
    let stateIndex = 0
    const helperExports = {}
    const compile = (path) => ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText
    vm.runInNewContext(compile("../../../lib/tagSpreadsheet.ts"), { exports: helperExports, require: () => XLSX })
    const modules = {
        react: {
            useState: () => {
                const index = stateIndex++
                return [state[index], (value) => { state[index] = typeof value === "function" ? value(state[index]) : value }]
            },
            useRef: () => ({ current: null }),
            useEffect() { },
        },
        "react/jsx-runtime": require("react/jsx-runtime"),
        xlsx: { ...XLSX, writeFile: (workbook, name, options) => downloads.push({ workbook, name, options }) },
        "lucide-react": Object.fromEntries(["Check", "Download", "Pencil", "Plus", "Tag", "Upload", "X"].map((name) => [name, () => null])),
        "@/lib/adminColors": { ADMIN_COLORS: {}, adminGradient: () => "" },
        "@/components/admin/AdminPageHeader": { AdminPageHeader: () => null },
        "@/lib/tagSpreadsheet": helperExports,
    }
    const exports = {}
    vm.runInNewContext(compile("./page.tsx"), {
        exports, Error,
        fetch: async (url, options) => {
            calls.push({ url, method: options?.method ?? "GET", body: options?.body ? JSON.parse(options.body) : null })
            if (!options?.method) return Response.json(tags)
            const response = responses.shift()
            assert.ok(response, "Unexpected mutation")
            if (response instanceof Error) throw response
            return response
        },
        require(name) { assert.ok(Object.hasOwn(modules, name), `Unexpected import: ${name}`); return modules[name] },
    })
    function find(node, predicate) {
        if (!node || typeof node !== "object") return null
        if (predicate(node)) return node
        for (const child of [node.props?.children, node.props?.actions].flat(Infinity)) {
            const match = find(child, predicate)
            if (match) return match
        }
        return null
    }
    const render = () => { stateIndex = 0; return exports.default() }
    return {
        state, calls, downloads, helper: helperExports,
        click: async (label) => {
            const button = find(render(), (node) => node.type === "button" && [node.props.children].flat().includes(label))
            assert.ok(button, `Missing button: ${label}`)
            await button.props.onClick()
        },
        select: async (file) => {
            const input = find(render(), (node) => node.type === "input" && node.props.type === "file")
            await input.props.onChange({ target: { files: [file], value: file.name } })
        },
    }
}

test("Tags exports XLS that the same import control can preview and import", async () => {
    const app = setup({ responses: [Response.json({ id: "tag-1", name: "Gita" }, { status: 201 })] })
    await app.click("Export XLS")
    const download = app.downloads[0]
    assert.equal(download.name, "tags-export.xls")
    assert.equal(download.options.bookType, "biff8")
    const data = Uint8Array.from(XLSX.write(download.workbook, { type: "buffer", bookType: "biff8" })).buffer
    await app.select({ name: download.name, size: data.byteLength, arrayBuffer: async () => data })
    assert.equal(app.state[6][0].name, "Gita")
    assert.equal(app.calls.filter((call) => call.method === "POST").length, 0)
    await app.click("Import tags")
    assert.deepEqual(app.calls.find((call) => call.method === "POST").body, { name: "Gita" })
    assert.equal(app.state[9].imported, 1)
    assert.equal(app.state[9].failed, 0)
    assert.equal(app.state[6].length, 0)
    assert.equal(app.state[5], false)
})

test("import reports failed spreadsheet rows and continues remaining rows", async () => {
    const app = setup({
        rows: [{ name: "First", row: 2 }, { name: "Conflict", row: 3 }, { name: "Last", row: 4 }],
        responses: [Response.json({}), Response.json({ error: "Duplicate slug" }, { status: 409 }), Response.json({})],
    })
    await app.click("Import tags")
    assert.equal(app.state[9].imported, 2)
    assert.equal(app.state[9].failed, 1)
    assert.match(app.state[9].errors[0], /Row 3.*Duplicate slug/)
    assert.equal(app.state[8], 3)
})

test("network interruption preserves successful counts and allows safe retry", async () => {
    const app = setup({ rows: [{ name: "First", row: 2 }, { name: "Last", row: 3 }], responses: [Response.json({}), new Error("Offline")] })
    await app.click("Import tags")
    assert.equal(app.state[9].imported, 1)
    assert.match(app.state[2], /interrupted/)
    assert.equal(app.state[6].length, 2)
    assert.equal(app.state[5], false)
})

test("invalid files never submit tag mutations", async () => {
    const app = setup()
    await app.select({ name: "bad.csv", size: 10 })
    assert.match(app.state[2], /\.xls/)
    assert.equal(app.calls.length, 0)
    await app.select({ name: "large.xls", size: 6 * 1024 * 1024 })
    assert.match(app.state[2], /5 MB/)
    assert.equal(app.state[6].length, 0)
})
