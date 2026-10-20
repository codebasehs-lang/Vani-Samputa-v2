import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import vm from "node:vm"
import ts from "typescript"

function setup({ status, failDelete = false, empty = false } = {}) {
  let records = {
    playlists: ["target", "other"],
    lectures: [
      ...(!empty ? [{ id: "one", playlistId: "target" }, { id: "two", playlistId: "target" }] : []),
      { id: "three", playlistId: "other" },
      { id: "standalone", playlistId: null },
    ],
  }
  const transactions = []
  const errors = []
  const prisma = {
    async $transaction(run, options) {
      transactions.push(options)
      const working = structuredClone(records)
      const result = await run({
        playlist: {
          async findUnique({ where }) {
            return working.playlists.includes(where.id) ? { id: where.id } : null
          },
          async delete({ where }) {
            if (failDelete) throw new Error("Database unavailable")
            working.playlists = working.playlists.filter((id) => id !== where.id)
          },
        },
        lecture: {
          async deleteMany({ where }) {
            const count = working.lectures.filter((lecture) => lecture.playlistId === where.playlistId).length
            working.lectures = working.lectures.filter((lecture) => lecture.playlistId !== where.playlistId)
            return { count }
          },
        },
      })
      records = working
      return result
    },
  }
  const modules = {
    "next/server": { NextResponse: Response },
    "@/lib/adminAuth": {
      requireAdmin: async () => status
        ? { response: Response.json({ error: "Not authorized" }, { status }) }
        : { session: { user: { role: "ADMIN" } } },
    },
    "@/lib/prisma": { prisma },
    "@/lib/categories": {},
  }
  const code = ts.transpileModule(readFileSync(new URL("./route.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const exports = {}
  vm.runInNewContext(code, {
    exports,
    require(name) {
      assert.ok(Object.hasOwn(modules, name), `Unexpected import: ${name}`)
      return modules[name]
    },
    console: { error: (...args) => errors.push(args) },
  })
  return {
    remove: (query = "?id=target") => exports.DELETE({ nextUrl: new URL(`http://localhost/api/admin/playlists${query}`) }),
    records: () => records,
    transactions,
    errors,
  }
}

test("playlist deletion requires an authenticated admin", async () => {
  for (const status of [401, 403]) {
    const app = setup({ status })
    assert.equal((await app.remove()).status, status)
    assert.equal(app.transactions.length, 0)
  }
})

test("missing and blank playlist IDs are rejected before database access", async () => {
  for (const query of ["", "?id=", "?id=%20%20"]) {
    const app = setup()
    const response = await app.remove(query)
    assert.equal(response.status, 400)
    assert.deepEqual(await response.json(), { error: "Missing id" })
    assert.equal(app.transactions.length, 0)
  }
})

test("deletion removes all associated lectures but preserves other and standalone lectures", async () => {
  const app = setup()
  const response = await app.remove()
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { ok: true, deletedLectures: 2 })
  assert.deepEqual(app.records(), {
    playlists: ["other"],
    lectures: [{ id: "three", playlistId: "other" }, { id: "standalone", playlistId: null }],
  })
  assert.equal(app.transactions.length, 1)
  assert.equal(app.transactions[0].isolationLevel, "Serializable")
})

test("empty playlists can be deleted", async () => {
  const app = setup({ empty: true })
  assert.deepEqual(await (await app.remove()).json(), { ok: true, deletedLectures: 0 })
  assert.deepEqual(app.records().playlists, ["other"])
})

test("unknown and already deleted playlists return 404 without deleting other records", async () => {
  const app = setup()
  const before = structuredClone(app.records())
  assert.equal((await app.remove("?id=missing")).status, 404)
  assert.deepEqual(app.records(), before)
  await app.remove()
  assert.equal((await app.remove()).status, 404)
  assert.deepEqual(app.records().playlists, ["other"])
})

test("a failed playlist deletion rolls back lecture deletion and reports the failure", async () => {
  const app = setup({ failDelete: true })
  const before = structuredClone(app.records())
  const response = await app.remove()
  assert.equal(response.status, 500)
  assert.deepEqual(await response.json(), { error: "Could not delete the playlist and its lectures." })
  assert.deepEqual(app.records(), before)
  assert.equal(app.errors.length, 1)
})
