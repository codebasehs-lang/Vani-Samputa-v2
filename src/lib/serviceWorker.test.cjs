const assert = require("node:assert/strict")
const { readFileSync } = require("node:fs")
const { test } = require("node:test")
const vm = require("node:vm")

function worker() {
  const handlers = {}
  const writes = []
  const deleted = []
  const context = {
    URL,
    fetch: async () => new Response("ok"),
    caches: {
      keys: async () => ["vani-samputa-v4-runtime", "vani-samputa-v4-precache", "vani-samputa-v5-runtime", "vani-samputa-audio-v1", "unrelated"],
      delete: async (key) => { deleted.push(key) },
      match: async () => undefined,
      open: async () => ({ put: async (request) => { writes.push(request.url) } }),
    },
    self: {
      location: { origin: "https://example.com" },
      clients: { claim() {} },
      addEventListener(name, handler) { handlers[name] = handler },
    },
  }
  vm.runInNewContext(readFileSync(require.resolve("../../public/sw.js"), "utf8"), context)
  return { handlers, context, writes, deleted }
}

test("session, API, RSC and private page requests bypass the worker cache", () => {
  const { handlers } = worker()
  for (const [path, mode, headers] of [
    ["/api/auth/session", "cors", {}],
    ["/api/auth/session", "navigate", {}],
    ["/api/audio/lecture", "cors", {}],
    ["/api/admin/quotes", "cors", {}],
    ["/?_rsc=payload", "cors", {}],
    ["/audio", "cors", { RSC: "1" }],
    ["/profile", "navigate", {}],
    ["/admin/quotes", "navigate", {}],
    ["/login", "navigate", {}],
  ]) {
    let intercepted = false
    handlers.fetch({
      request: { url: `https://example.com${path}`, method: "GET", mode, headers: new Headers(headers) },
      respondWith() { intercepted = true },
    })
    assert.equal(intercepted, false, path)
  }
})

test("static assets remain cached, but private/no-store responses do not", async () => {
  for (const cacheControl of ["public, max-age=3600", "private", "no-store"]) {
    const { handlers, context, writes } = worker()
    context.fetch = async () => new Response("ok", { headers: { "Cache-Control": cacheControl } })
    let response
    const tasks = []
    handlers.fetch({
      request: { url: "https://example.com/_next/static/app.js", method: "GET", mode: "cors", headers: new Headers() },
      respondWith(promise) { response = promise },
      waitUntil(promise) { tasks.push(promise) },
    })
    assert.equal((await response).status, 200)
    await Promise.all(tasks)
    assert.equal(writes.length, cacheControl.startsWith("public") ? 1 : 0)
  }
})

test("activation clears old cached sessions while preserving offline audio", async () => {
  const { handlers, deleted } = worker()
  let completion
  handlers.activate({ waitUntil(promise) { completion = promise } })
  await completion
  assert.deepEqual(deleted.sort(), ["vani-samputa-v4-precache", "vani-samputa-v4-runtime"])
})
