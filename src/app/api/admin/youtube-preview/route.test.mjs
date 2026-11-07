import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import vm from "node:vm"
import ts from "typescript"

function setup({ denied = false, failApi = false } = {}) {
    const calls = []
    const staged = new Map([["start", { videoId: "start", language: "English", category: "Reviewed tag", playlistTitle: "Reviewed playlist", status: "APPROVED", customSortOrder: 7 }]])
    const dates = {
        before: "2026-11-01T23:59:59.999Z",
        start: "2026-11-02T00:00:00.000Z",
        end: "2026-11-03T23:59:59.999Z",
        after: "2026-11-04T00:00:00.000Z",
        unknown: null,
    }
    const modules = {
        "next/server": { NextResponse: Response },
        "@/lib/adminAuth": { requireAdmin: async () => denied ? { response: Response.json({}, { status: 403 }) } : {} },
        "@/lib/prisma": {
            prisma: {
                lecture: { findMany: async () => [], update: async () => { } },
                youtubeStagingVideo: {
                    findUnique: async ({ where }) => staged.get(where.videoId) ?? null,
                    update: async ({ where, data }) => { Object.assign(staged.get(where.videoId), data) },
                    create: async ({ data }) => { staged.set(data.videoId, data) },
                },
            }
        },
    }
    const exports = {}
    const code = ts.transpileModule(readFileSync(new URL("./route.ts", import.meta.url), "utf8"), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText
    vm.runInNewContext(code, {
        exports,
        process: { env: { YOUTUBE_API_KEY: "test-key", YOUTUBE_CHANNEL_ID: "test-channel" } },
        fetch: async (url) => {
            const request = new URL(url)
            calls.push(request)
            if (failApi) return Response.json({ error: { message: "Quota exceeded" } }, { status: 403 })
            if (request.pathname.endsWith("/playlists")) return Response.json({ items: [{ id: "playlist", snippet: { title: "English Gita" } }] })
            if (request.pathname.endsWith("/playlistItems")) {
                const ids = request.searchParams.has("pageToken") ? ["end", "after", "unknown"] : ["before", "start"]
                return Response.json({ items: ids.map((videoId, index) => ({ snippet: { title: videoId, position: index, publishedAt: "2026-11-07T12:00:00Z", resourceId: { videoId } } })), ...(!request.searchParams.has("pageToken") ? { nextPageToken: "next" } : {}) })
            }
            if (request.pathname.endsWith("/videos")) return Response.json({ items: request.searchParams.get("id").split(",").map((id) => ({ id, snippet: { publishedAt: dates[id], description: "Description" }, contentDetails: { duration: "PT1M" } })) })
            throw new Error(`Unexpected request: ${request.pathname}`)
        },
        require(name) { assert.ok(Object.hasOwn(modules, name), `Unexpected import: ${name}`); return modules[name] },
    })
    return { staged, calls, post: (body) => exports.POST(new Request("http://localhost/api/admin/youtube-preview", { method: "POST", ...(body === undefined ? {} : { body: JSON.stringify(body) }) })), malformed: () => exports.POST(new Request("http://localhost/api/admin/youtube-preview", { method: "POST", body: "{" })) }
}

test("inclusive upload-date range uses video dates, paginates and preserves reviewed choices", async () => {
    const app = setup()
    const response = await app.post({ from: "2026-11-02", to: "2026-11-03" })
    assert.equal(response.status, 200)
    const result = await response.json()
    assert.deepEqual(result.videoIds, ["start", "end"])
    assert.equal(result.fetched, 2)
    assert.equal(result.inserted, 1)
    assert.equal(result.updated, 1)
    assert.deepEqual([...app.staged.keys()], ["start", "end"])
    const reviewed = app.staged.get("start")
    assert.equal(reviewed.publishedAt.toISOString(), "2026-11-02T00:00:00.000Z")
    assert.equal(reviewed.language, "English")
    assert.equal(reviewed.category, "Reviewed tag")
    assert.equal(reviewed.playlistTitle, "Reviewed playlist")
    assert.equal(reviewed.status, "APPROVED")
    assert.equal(reviewed.customSortOrder, 7)
})

test("empty date range retains full sync and unknown dates", async () => {
    for (const body of [undefined, {}, { from: "", to: "" }]) {
        const app = setup()
        const response = await app.post(body)
        assert.equal(response.status, 200)
        const result = await response.json()
        assert.equal(result.fetched, 5)
        assert.equal(result.videoIds, undefined)
        assert.equal(app.staged.get("unknown").publishedAt, null)
    }
})

test("invalid or reversed ranges are rejected before API calls and writes", async () => {
    const app = setup()
    for (const body of [null, [], { from: "2026-11-02" }, { to: "2026-11-03" }, { from: "2026-02-30", to: "2026-11-03" }, { from: "2026-11-04", to: "2026-11-03" }, { from: 123, to: "2026-11-03" }]) {
        assert.equal((await app.post(body)).status, 400)
    }
    assert.equal((await app.malformed()).status, 400)
    assert.equal(app.calls.length, 0)
    assert.equal(app.staged.size, 1)
})

test("requires admin and reports YouTube failures", async () => {
    const denied = setup({ denied: true })
    assert.equal((await denied.post()).status, 403)
    assert.equal(denied.calls.length, 0)
    const failure = await setup({ failApi: true }).post()
    assert.equal(failure.status, 502)
    assert.match((await failure.json()).error, /Quota exceeded/)
})
