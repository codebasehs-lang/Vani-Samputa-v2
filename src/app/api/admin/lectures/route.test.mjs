import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import vm from "node:vm"
import ts from "typescript"

function setup({ status, missing = false } = {}) {
  const calls = []
  const playlist = { id: "exact-id", title: "Shared title", language: "English", mediaType: "VIDEO" }
  const modules = {
    "next/server": { NextResponse: Response },
    "@/lib/adminAuth": {
      requireAdmin: async () => status
        ? { response: Response.json({ error: "Denied" }, { status }) }
        : { session: {} },
    },
    "@/lib/prisma": {
      prisma: {
        playlist: {
          findUnique: async (args) => { calls.push(["playlist", args]); return missing ? null : playlist },
          findFirst: async (args) => { calls.push(["findFirst", args]); return playlist },
          create: async (args) => { calls.push(["createPlaylist", args]); return playlist },
        },
        lecture: {
          findMany: async (args) => {
            calls.push(["list", args])
            return Array.from({ length: 45 }, (_, i) => ({ id: String(i), playlistId: playlist.id }))
          },
          count: async () => 45,
          create: async (args) => { calls.push(["create", args]); return { id: "new", ...args.data } },
          update: async (args) => { calls.push(["update", args]); return { id: args.where.id, ...args.data } },
          delete: async (args) => { calls.push(["delete", args]); return { id: args.where.id } },
        },
      },
    },
    "@/lib/categories": {
      parseCategoryNames: (value) => value.split(",").filter(Boolean),
      validateCategories: async () => [],
      categoryConnect: (names) => ({ connect: names.map((name) => ({ name })) }),
    },
    "@/lib/duration": { parseDuration: () => null },
    "@/lib/youtube": { extractYouTubeId: (url) => url },
  }
  const exports = {}
  const code = ts.transpileModule(readFileSync(new URL("./route.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  vm.runInNewContext(code, {
    exports,
    require(name) {
      assert.ok(Object.hasOwn(modules, name), `Unexpected import: ${name}`)
      return modules[name]
    },
  })
  return {
    calls,
    request: (method, query = "", body = {}) => exports[method]({
      nextUrl: new URL(`http://localhost/api/admin/lectures${query}`),
      json: async () => body,
    }),
  }
}

const form = {
  title: "Lecture", url: "video-id", language: "English", mediaType: "VIDEO",
  playlistId: "exact-id", playlistName: "Shared title", categories: "Bhagavatam",
}

test("playlist lecture listing returns all lectures with editable metadata in playlist order", async () => {
  const app = setup()
  const response = await app.request("GET", "?playlistId=exact-id")
  assert.equal(response.status, 200)
  const data = await response.json()
  assert.equal(data.lectures.length, 45)
  assert.equal(data.total, 45)
  const args = app.calls.find(([name]) => name === "list")[1]
  assert.equal(args.where.playlistId, "exact-id")
  assert.equal(args.take, undefined)
  assert.equal(args.skip, undefined)
  assert.equal(args.orderBy[0].sortOrder, "asc")
  assert.ok(args.include.categories)
  assert.ok(args.include.playlist)
})

test("unscoped lecture listing retains existing pagination", async () => {
  const app = setup()
  await app.request("GET", "?page=2&q=Lecture")
  const args = app.calls.find(([name]) => name === "list")[1]
  assert.equal(args.take, 30)
  assert.equal(args.skip, 30)
  assert.equal(args.where.title.contains, "Lecture")
})

test("playlist lecture access requires admin authentication for all methods", async () => {
  for (const status of [401, 403]) {
    const app = setup({ status })
    for (const method of ["GET", "POST", "PATCH", "DELETE"]) {
      assert.equal((await app.request(method, "?id=lecture&playlistId=exact-id", form)).status, status)
    }
    assert.equal(app.calls.length, 0)
  }
})

test("create and edit use the exact playlist ID rather than matching its title", async () => {
  for (const method of ["POST", "PATCH"]) {
    const app = setup()
    const response = await app.request(method, "?id=lecture", form)
    assert.equal(response.status, 200)
    assert.equal((await response.json()).playlistId, "exact-id")
    assert.equal(app.calls.some(([name]) => name === "findFirst" || name === "createPlaylist"), false)
    const mutation = app.calls.find(([name]) => name === (method === "POST" ? "create" : "update"))[1]
    assert.equal(mutation.data.playlistId, "exact-id")
    if (method === "PATCH") assert.equal(mutation.where.id, "lecture")
  }
})

test("missing playlists and invalid IDs cannot list or create lectures", async () => {
  const missing = setup({ missing: true })
  assert.equal((await missing.request("GET", "?playlistId=missing")).status, 404)
  assert.equal((await missing.request("POST", "", form)).status, 404)
  assert.equal(missing.calls.some(([name]) => name === "list" || name === "create"), false)
  for (const playlistId of ["", "  ", 123, null]) {
    const app = setup()
    assert.equal((await app.request("POST", "", { ...form, playlistId })).status, 400)
    assert.equal(app.calls.length, 0)
  }
})

test("pinned playlist language and media type are validated server-side", async () => {
  for (const change of [{ language: "Hindi" }, { mediaType: "AUDIO" }]) {
    for (const method of ["POST", "PATCH"]) {
      const app = setup()
      assert.equal((await app.request(method, "?id=lecture", { ...form, ...change })).status, 400)
      assert.equal(app.calls.some(([name]) => name === "create" || name === "update"), false)
    }
  }
})

test("existing name-based lecture creation and editing still resolve a playlist", async () => {
  for (const method of ["POST", "PATCH"]) {
    const app = setup()
    const { playlistId, ...legacyForm } = form
    assert.ok(playlistId)
    assert.equal((await app.request(method, "?id=lecture", legacyForm)).status, 200)
    assert.ok(app.calls.some(([name]) => name === "findFirst"))
  }
})
