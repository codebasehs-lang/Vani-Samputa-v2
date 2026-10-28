import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { test } from "node:test"
import vm from "node:vm"
import ts from "typescript"

const require = createRequire(import.meta.url)

function setup({ rows = [], responses = [], parsedRows = [] } = {}) {
    const state = ["AUDIO", rows, null, false, 0]
    const calls = []
    const messages = []
    let stateIndex = 0
    const icon = () => null
    const modules = {
        react: {
            useState: () => {
                const index = stateIndex++
                return [state[index], (value) => { state[index] = value }]
            },
            useRef: () => ({ current: null }),
        },
        "react/jsx-runtime": require("react/jsx-runtime"),
        xlsx: { read: () => ({ Sheets: { Lectures: {} }, SheetNames: ["Lectures"] }), utils: { sheet_to_json: () => parsedRows } },
        sonner: { toast: { success: (value) => messages.push(value), error: (value) => messages.push(value) } },
        "lucide-react": Object.fromEntries(["Upload", "Download", "FileSpreadsheet", "Mic", "Clapperboard", "CircleCheck", "CircleAlert"].map((name) => [name, icon])),
        "@/lib/adminColors": { ADMIN_COLORS: {}, adminGradient: () => "" },
        "@/lib/lectureImportSamples": { zohoAudioImportSampleRows: [] },
    }
    const exports = {}
    const code = ts.transpileModule(readFileSync(new URL("./page.tsx", import.meta.url), "utf8"), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText
    vm.runInNewContext(code, {
        exports,
        Error,
        fetch: async (url, options) => {
            calls.push({ url, body: JSON.parse(options.body) })
            const response = responses.shift()
            assert.ok(response, "Unexpected fetch call")
            if (response instanceof Error) throw response
            return response
        },
        require(name) { assert.ok(Object.hasOwn(modules, name), `Unexpected import: ${name}`); return modules[name] },
    })
    const tree = exports.default()
    function find(node, predicate) {
        if (!node || typeof node !== "object") return null
        if (predicate(node)) return node
        const children = node.props?.children
        for (const child of Array.isArray(children) ? children.flat(Infinity) : [children]) {
            const match = find(child, predicate)
            if (match) return match
        }
        return null
    }
    return {
        state, calls, messages,
        importRows: () => find(tree, (node) => node.type === "button" && node.props.onClick?.name === "handleImport").props.onClick(),
        readFile: () => find(tree, (node) => node.type === "input").props.onChange({ target: { files: [{ arrayBuffer: async () => new ArrayBuffer(0) }] } }),
    }
}

test("spreadsheet parsing retains all rows beyond the old 200-row limit", async () => {
    const app = setup({ parsedRows: Array.from({ length: 251 }, (_, index) => ({ Title: `Lecture ${index}` })) })
    await app.readFile()
    assert.equal(app.state[1].length, 251)
})

test("large spreadsheets import all rows in sequential batches and aggregate results", async () => {
    const app = setup({
        rows: Array.from({ length: 251 }, (_, index) => ({ Title: `Lecture ${index}` })),
        responses: [100, 100, 51].map((created) => Response.json({ created, skipped: 0, errors: [] })),
    })
    await app.importRows()
    assert.deepEqual(app.calls.map((call) => call.body.rows.length), [100, 100, 51])
    assert.deepEqual(app.calls.map((call) => call.body.rowOffset), [0, 100, 200])
    assert.equal(app.state[2].created, 251)
    assert.equal(app.state[3], false)
    assert.equal(app.state[4], 251)
})

test("a failed batch stops later requests and preserves successful batch counts", async () => {
    const app = setup({
        rows: Array.from({ length: 251 }, (_, index) => ({ Title: `Lecture ${index}` })),
        responses: [Response.json({ created: 100, skipped: 0, errors: [] }), new Error("Network unavailable")],
    })
    await app.importRows()
    assert.equal(app.calls.length, 2)
    assert.equal(app.state[2].created, 100)
    assert.equal(app.state[2].errors[0], "Network unavailable")
    assert.equal(app.state[3], false)
    assert.equal(app.state[4], 100)
})
