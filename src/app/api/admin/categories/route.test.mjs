import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import vm from "node:vm"
import ts from "typescript"

function setup({ denied = false, failPlaylist = false, failCreate = false } = {}) {
    let state = {
        categories: [{ id: "category-1", name: "Old name", slug: "old-name" }, { id: "category-2", name: "Other", slug: "other" }],
        lectures: [
            { category: "Old name", categories: ["category-1"], playlistId: null },
            { category: "Old name", categories: ["category-1"], playlistId: "playlist-1" },
            { category: "Other", categories: ["category-2", "category-1"] },
            { category: "Old name", categories: [] },
        ],
        playlists: [{ category: "Old name", categories: ["category-1"] }, { category: "Other", categories: ["category-2"] }],
    }
    let transactions = 0
    const modules = {
        "next/server": { NextResponse: Response },
        "@/lib/adminAuth": { requireAdmin: async () => denied ? { response: Response.json({ error: "Forbidden" }, { status: 403 }) } : {} },
        "@/lib/categories": {
            ensureCategories: async (names) => {
                if (failCreate) throw { code: "P2002" }
                return names.map((name) => {
                    let category = state.categories.find((category) => category.name === name)
                    if (!category) {
                        category = { id: `category-${state.categories.length + 1}`, name, slug: name.toLowerCase().replaceAll(" ", "-") }
                        state.categories.push(category)
                    }
                    category.active = true
                    return category
                })
            },
        },
        "@/lib/prisma": {
            prisma: {
                $transaction: async (callback) => {
                    transactions++
                    const draft = structuredClone(state)
                    const updateMany = (rows) => async ({ where, data }) => {
                        rows.filter((row) => row.category === where.category).forEach((row) => Object.assign(row, data))
                    }
                    const result = await callback({
                        category: {
                            findUnique: async ({ where }) => structuredClone(draft.categories.find((category) => category.id === where.id) ?? null),
                            update: async ({ where, data }) => {
                                if (draft.categories.some((category) => category.id !== where.id && category.name === data.name)) throw { code: "P2002" }
                                const category = draft.categories.find((category) => category.id === where.id)
                                Object.assign(category, data)
                                return category
                            },
                        },
                        lecture: { updateMany: updateMany(draft.lectures) },
                        playlist: { updateMany: failPlaylist ? async () => { throw new Error("Write failed") } : updateMany(draft.playlists) },
                    })
                    state = draft
                    return result
                },
            },
        },
    }
    const exports = {}
    const code = ts.transpileModule(readFileSync(new URL("./route.ts", import.meta.url), "utf8"), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText
    vm.runInNewContext(code, {
        exports, console: { error() { } }, require: (name) => {
            assert.ok(Object.hasOwn(modules, name), `Unexpected import: ${name}`)
            return modules[name]
        }
    })
    return {
        state: () => state,
        transactions: () => transactions,
        request: (body) => exports.PATCH({ json: async () => body }),
        malformedRequest: () => exports.PATCH({ json: async () => { throw new SyntaxError("Invalid JSON") } }),
        create: (body) => exports.POST({ json: async () => body }),
        malformedCreate: () => exports.POST({ json: async () => { throw new SyntaxError("Invalid JSON") } }),
    }
}

test("rename preserves IDs, slug and assignments while updating lecture and playlist primary names", async () => {
    const app = setup()
    const before = structuredClone(app.state())
    const response = await app.request({ id: "category-1", name: " New name " })
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { id: "category-1", name: "New name", slug: "old-name" })
    const after = app.state()
    assert.deepEqual(after.lectures.map((lecture) => lecture.category), ["New name", "New name", "Other", "New name"])
    assert.deepEqual(after.playlists.map((playlist) => playlist.category), ["New name", "Other"])
    assert.deepEqual(after.lectures.map((lecture) => lecture.categories), before.lectures.map((lecture) => lecture.categories))
    assert.deepEqual(after.playlists.map((playlist) => playlist.categories), before.playlists.map((playlist) => playlist.categories))
})

test("duplicate names and missing categories do not change content", async () => {
    const app = setup()
    const before = structuredClone(app.state())
    assert.equal((await app.request({ id: "category-1", name: "Other" })).status, 409)
    assert.equal((await app.request({ id: "missing", name: "New name" })).status, 404)
    assert.deepEqual(app.state(), before)
})

test("rename rejects invalid input and requires admin access", async () => {
    const app = setup()
    for (const body of [null, {}, { id: "category-1", name: " " }, { id: 1, name: "Name" }, { id: "category-1", name: "x".repeat(192) }]) {
        assert.equal((await app.request(body)).status, 400)
    }
    assert.equal((await app.malformedRequest()).status, 400)
    assert.equal(app.transactions(), 0)
    const denied = setup({ denied: true })
    assert.equal((await denied.request({ id: "category-1", name: "New name" })).status, 403)
    assert.equal(denied.transactions(), 0)
})

test("failure updating content rolls back the category rename", async () => {
    const app = setup({ failPlaylist: true })
    const before = structuredClone(app.state())
    assert.equal((await app.request({ id: "category-1", name: "New name" })).status, 500)
    assert.deepEqual(app.state(), before)
})

test("importing the same name twice reuses the tag and preserves assignments", async () => {
    const app = setup()
    const before = structuredClone(app.state())
    const first = await app.create({ name: " Imported tag " })
    const second = await app.create({ name: "Imported tag" })
    assert.equal(first.status, 201)
    assert.equal(second.status, 201)
    assert.deepEqual(await first.json(), await second.json())
    assert.equal(app.state().categories.length, before.categories.length + 1)
    app.state().categories[0].active = false
    const reactivated = await app.create({ name: "Old name" })
    assert.equal((await reactivated.json()).id, "category-1")
    assert.equal(app.state().categories[0].active, true)
    assert.deepEqual(app.state().lectures, before.lectures)
    assert.deepEqual(app.state().playlists, before.playlists)
})

test("tag creation validates names, requires admin and reports conflicts", async () => {
    const app = setup()
    const before = structuredClone(app.state())
    for (const body of [null, {}, { name: 123 }, { name: " " }, { name: "x".repeat(192) }]) {
        assert.equal((await app.create(body)).status, 400)
    }
    assert.equal((await app.malformedCreate()).status, 400)
    assert.deepEqual(app.state(), before)
    assert.equal((await setup({ denied: true }).create({ name: "New" })).status, 403)
    assert.equal((await setup({ failCreate: true }).create({ name: "New" })).status, 409)
})
