import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import vm from "node:vm"
import ts from "typescript"

function setup({ denied = false, failure = false } = {}) {
    const rows = [
        { videoId: "one", status: "NEW", category: "Gita", playlistTitle: "Tour", language: "Odia" },
        { videoId: "two", status: "APPROVED", category: "Tour", playlistTitle: "Tour", language: "Hindi" },
        { videoId: "imported", status: "IMPORTED", category: "Gita", playlistTitle: "Tour", language: "Odia" },
        { videoId: "other", status: "NEW", category: "General", playlistTitle: "Other", language: "Odia" },
    ]
    const calls = []
    const modules = {
        "next/server": { NextResponse: Response },
        "@/lib/adminAuth": { requireAdmin: async () => denied ? { response: Response.json({}, { status: 403 }) } : {} },
        "@/lib/prisma": {
            prisma: {
                youtubeStagingVideo: {
                    updateMany: async ({ where, data }) => {
                        calls.push({ where, data })
                        if (failure) throw new Error("Write failed")
                        const matching = rows.filter((row) => where.videoId.in.includes(row.videoId) && row.status !== "IMPORTED")
                        matching.forEach((row) => Object.assign(row, data))
                        return { count: matching.length }
                    },
                    update: async ({ where, data }) => { const row = rows.find((item) => item.videoId === where.videoId); Object.assign(row, data); return row },
                }
            }
        },
    }
    const exports = {}
    const code = ts.transpileModule(readFileSync(new URL("./route.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
    vm.runInNewContext(code, { exports, require(name) { assert.ok(Object.hasOwn(modules, name), `Unexpected import: ${name}`); return modules[name] } })
    return { rows, calls, patch: (body) => exports.PATCH({ json: async () => body }), malformed: () => exports.PATCH({ json: async () => { throw new Error("Invalid JSON") } }) }
}

test("bulk metadata edits update selected videos once and preserve imported and other rows", async () => {
    const app = setup()
    const response = await app.patch({ videoIds: ["one", "two", "imported", "one"], language: "English", category: "Gita, Tour", playlistTitle: " New Tour " })
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { updated: 2 })
    assert.equal(app.calls.length, 1)
    assert.deepEqual(app.rows.slice(0, 2).map((row) => row.playlistTitle), ["New Tour", "New Tour"])
    assert.deepEqual(app.rows.slice(0, 2).map((row) => row.status), ["NEW", "APPROVED"])
    assert.equal(app.rows[2].language, "Odia")
    assert.equal(app.rows[3].playlistTitle, "Other")
})

test("empty tags and playlist overrides are preserved instead of falling back to detection", async () => {
    const app = setup()
    await app.patch({ videoIds: ["one", "two"], category: "", playlistTitle: "" })
    assert.equal(app.rows[0].category, "")
    assert.equal(app.rows[1].playlistTitle, "")
    await app.patch({ videoId: "other", category: "", playlistTitle: "" })
    assert.equal(app.rows[3].category, "")
    assert.equal(app.rows[3].playlistTitle, "")
})

test("bulk status updates still skip imported rows and invalid inputs never write", async () => {
    const app = setup()
    assert.equal((await app.patch({ videoIds: ["one", "imported"], status: "APPROVED" })).status, 200)
    assert.equal(app.rows[0].status, "APPROVED")
    assert.equal(app.rows[2].status, "IMPORTED")
    const invalid = setup()
    for (const body of [null, [], { videoIds: [] }, { videoIds: [123], language: "English" }, { videoIds: ["one"] }, { videoIds: ["one"], language: "Invalid" }, { videoIds: ["one"], category: 123 }, { videoIds: ["one"], playlistTitle: "x".repeat(192) }, { videoIds: ["one"], status: "IMPORTED" }]) assert.equal((await invalid.patch(body)).status, 400)
    assert.equal((await invalid.malformed()).status, 400)
    assert.equal(invalid.calls.length, 0)
})

test("bulk metadata requires admin and write failures preserve staged choices", async () => {
    const denied = setup({ denied: true })
    assert.equal((await denied.patch({ videoIds: ["one"], language: "English" })).status, 403)
    assert.equal(denied.calls.length, 0)
    const failing = setup({ failure: true })
    assert.equal((await failing.patch({ videoIds: ["one"], language: "English" })).status, 500)
    assert.equal(failing.rows[0].language, "Odia")
})
