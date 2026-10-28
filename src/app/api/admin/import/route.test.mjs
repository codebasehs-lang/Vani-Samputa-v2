import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import vm from "node:vm"
import ts from "typescript"

const origin = "https://vani-samputa-audio-development.zohostratus.in"

function load(relativePath, modules = {}, env = {}) {
    const exports = {}
    const code = ts.transpileModule(readFileSync(new URL(relativePath, import.meta.url), "utf8"), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText
    vm.runInNewContext(code, {
        exports, URL, process: { env },
        require(name) {
            assert.ok(Object.hasOwn(modules, name), `Unexpected import: ${name}`)
            return modules[name]
        },
    })
    return exports
}

function setup({ bucketOrigin = origin, missingCategories = [] } = {}) {
    const lectures = []
    const playlists = []
    const modules = {
        "next/server": { NextResponse: Response },
        "@/lib/adminAuth": { requireAdmin: async () => ({}) },
        "@/lib/stratusAudio": load("../../../../lib/stratusAudio.ts"),
        "@/lib/duration": load("../../../../lib/duration.ts"),
        "@/lib/youtube": { extractYouTubeId: () => "test-video-id" },
        "@/lib/categories": {
            parseCategoryNames: (value) => value.split(",").map((name) => name.trim()).filter(Boolean),
            validateCategories: async () => missingCategories,
            categoryConnect: (names) => names,
        },
        "@/lib/prisma": {
            prisma: {
                lecture: {
                    findFirst: async ({ where }) => lectures.find((lecture) => lecture.url === where.url),
                    create: async ({ data }) => { lectures.push(data); return data },
                },
                playlist: {
                    findFirst: async ({ where }) => playlists.find((playlist) => Object.entries(where).every(([key, value]) => playlist[key] === value)),
                    create: async ({ data }) => {
                        const playlist = { ...data, id: `playlist-${playlists.length + 1}` }
                        playlists.push(playlist)
                        return playlist
                    },
                },
            }
        },
    }
    const route = load("./route.ts", modules, { STRATUS_AUDIO_BUCKET_ORIGIN: bucketOrigin })
    return {
        lectures, playlists,
        request: (rows, extra = {}) => route.POST({ json: async () => ({ rows, mediaType: "AUDIO", ...extra }) }),
    }
}

function row(filename, playlist = "") {
    return {
        Title: filename, URL: `${origin}/HH Haladhara Swami Maharaj/${filename}.mp3`,
        "Media Type": "AUDIO", Language: "English", Categories: "Bhagavad Gita",
        Playlist: playlist, Duration: "01:06:44", "Lecture Date": "2022-02-15",
    }
}

test("audio import groups playlist rows and leaves standalone lectures unlinked", async () => {
    const app = setup()
    const response = await app.request([row("Lecture 1", "Series"), row("Lecture 2", "Series"), row("Standalone")])
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { created: 3, skipped: 0, errors: [] })
    assert.equal(app.playlists.length, 1)
    assert.equal(app.lectures[0].playlistId, app.lectures[1].playlistId)
    assert.equal(app.lectures[2].playlistId, null)
    assert.equal(app.lectures[0].duration, 4004)
    assert.equal(app.lectures[0].url, `${origin}/HH%20Haladhara%20Swami%20Maharaj/Lecture%201.mp3`)
})

test("raw and percent-encoded versions of the same object import once", async () => {
    const app = setup()
    const first = row("Same lecture")
    const response = await app.request([first, { ...first, URL: new URL(first.URL).href }])
    assert.deepEqual(await response.json(), { created: 1, skipped: 1, errors: [] })
    assert.equal(app.lectures.length, 1)
})

test("signed URLs, foreign URLs and function URLs are rejected before creating records", async () => {
    const app = setup()
    const response = await app.request([
        { ...row("Signed"), URL: `${origin}/_signed/audio.mp3?stsSignature=temporary` },
        { ...row("Foreign"), URL: "https://other.example/audio.mp3" },
        { ...row("Function"), URL: "https://project.catalystserverless.in/server/signer/" },
    ], { rowOffset: 100 })
    const result = await response.json()
    assert.equal(result.created, 0)
    assert.equal(result.skipped, 3)
    assert.match(result.errors[0], /^Row 102:/)
    assert.equal(app.lectures.length, 0)
    assert.equal(app.playlists.length, 0)
})

test("audio import reports missing configuration and categories", async () => {
    const unconfigured = setup({ bucketOrigin: "" })
    const result = await (await unconfigured.request([row("Audio")])).json()
    assert.match(result.errors[0], /STRATUS_AUDIO_BUCKET_ORIGIN/)
    const missing = setup({ missingCategories: ["Bhagavad Gita"] })
    const categoryResult = await (await missing.request([row("Audio")])).json()
    assert.equal(categoryResult.skipped, 1)
    assert.match(categoryResult.errors[0], /add categories first/)
})

test("video import keeps YouTube handling and does not require Stratus configuration", async () => {
    const app = setup({ bucketOrigin: "" })
    const response = await app.request([{ ...row("Video"), "Media Type": "VIDEO", URL: "https://youtube.com/watch?v=test-video-id" }])
    assert.equal((await response.json()).created, 1)
    assert.equal(app.lectures[0].url, "test-video-id")
})

test("oversized batches are rejected instead of partially imported", async () => {
    const app = setup()
    const response = await app.request(Array.from({ length: 201 }, (_, index) => row(`Lecture ${index}`)))
    assert.equal(response.status, 400)
    assert.equal(app.lectures.length, 0)
})
