import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import vm from "node:vm"
import * as jsxRuntime from "react/jsx-runtime"
import ts from "typescript"

const sourceModule = { exports: {} }
vm.runInNewContext(ts.transpileModule(
  readFileSync(new URL("../../../../lib/stratusAudio.ts", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText, { exports: sourceModule.exports, URL })

function setup({ session = { user: { email: "listener@example.com" } }, lectureUrl, fetchResponses = [] } = {}) {
  const calls = []
  const errors = []
  const modules = {
    "@/auth": { auth: async () => session },
    "@/lib/stratusAudio": sourceModule.exports,
    "@/lib/prisma": {
      prisma: {
        lecture: {
          findFirst: async (args) => {
            calls.push(["lecture", args])
            return lectureUrl ? { url: lectureUrl } : null
          },
        },
      },
    },
    "next/server": { NextResponse: Response },
  }
  const exports = {}
  const code = ts.transpileModule(readFileSync(new URL("./route.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText

  vm.runInNewContext(code, {
    AbortSignal,
    Headers,
    URL,
    console: { error: (...args) => errors.push(args) },
    exports,
    fetch: async (input, options) => {
      calls.push(["fetch", new URL(input), options])
      const response = fetchResponses.shift()
      if (response instanceof Error) throw response
      assert.ok(response, "Unexpected fetch call")
      return response
    },
    process: {
      env: {
        CATALYST_AUDIO_SIGNER_URL: "https://catalyst.example/signer",
        CATALYST_AUDIO_SIGNER_SECRET: "test-only-secret",
        STRATUS_AUDIO_BUCKET_ORIGIN: "https://vani-samputa-audio-development.zohostratus.in",
      },
    },
    require(name) {
      assert.ok(Object.hasOwn(modules, name), `Unexpected import: ${name}`)
      return modules[name]
    },
  })

  return {
    calls,
    errors,
    request: (headers = {}, query = "") => exports.GET({
      headers: new Headers(headers),
      nextUrl: new URL(`http://localhost/api/audio/lecture-1${query}`),
    }, { params: Promise.resolve({ id: "lecture-1" }) }),
  }
}

const lectureUrl = "https://vani-samputa-audio-development.zohostratus.in/HH%20Haladhara%20Swami%20Maharaj/0001%20Bhagavatam.mp3"

test("audio route requires an authenticated user before looking up the lecture", async () => {
  const app = setup({ session: null, lectureUrl })
  const response = await app.request()

  assert.equal(response.status, 401)
  assert.equal(app.calls.length, 0)
})

test("audio route only signs audio URLs from the configured Stratus bucket", async () => {
  const app = setup({ lectureUrl: "https://untrusted.example/audio.mp3" })
  const response = await app.request()

  assert.equal(response.status, 422)
  assert.equal(app.calls.filter(([name]) => name === "fetch").length, 0)
})

test("audio route signs the database object key and forwards byte ranges", async () => {
  const app = setup({
    lectureUrl,
    fetchResponses: [
      Response.json({ url: "https://vani-samputa-audio-development.zohostratus.in/_signed/lecture.mp3" }),
      new Response("audio bytes", {
        status: 206,
        headers: {
          "Accept-Ranges": "bytes",
          "Content-Range": "bytes 0-10/100",
          "Content-Length": "11",
          "Content-Type": "audio/mpeg",
        },
      }),
    ],
  })
  const response = await app.request({ range: "bytes=0-10" })

  assert.equal(response.status, 206)
  assert.equal(response.headers.get("content-range"), "bytes 0-10/100")
  assert.equal(response.headers.get("cache-control"), "private, no-store")
  assert.equal(await response.text(), "audio bytes")
  const fetchCalls = app.calls.filter(([name]) => name === "fetch")
  assert.equal(fetchCalls.length, 2)
  assert.equal(fetchCalls[0][1].searchParams.get("key"), "HH Haladhara Swami Maharaj/0001 Bhagavatam.mp3")
  assert.equal(fetchCalls[0][2].headers["X-Audio-Signer-Secret"], "test-only-secret")
  assert.equal(new Headers(fetchCalls[0][2].headers).has("authorization"), false)
  assert.equal(fetchCalls[1][2].headers.range, "bytes=0-10")
})

test("audio route rejects an invalid signed URL without fetching it", async () => {
  const app = setup({
    lectureUrl,
    fetchResponses: [Response.json({ url: "https://attacker.example/audio.mp3" })],
  })
  const response = await app.request()

  assert.equal(response.status, 502)
  assert.equal(app.calls.filter(([name]) => name === "fetch").length, 1)
})

test("standalone audio links use the protected app endpoint while video links stay on YouTube", async () => {
  const lectures = [
    { id: "audio-1", title: "Standalone audio", url: lectureUrl, mediaType: "AUDIO", language: "English", categories: [] },
    { id: "video-1", title: "Standalone video", url: "video-id", mediaType: "VIDEO", language: "English", categories: [] },
  ]
  const modules = {
    "react/jsx-runtime": jsxRuntime,
    "next/link": { default: "a" },
    "@/lib/prisma": {
      prisma: {
        lecture: { findMany: async () => lectures },
        category: { findMany: async () => [] },
      }
    },
    "@/components/PageHeader": { PageHeader: "header" },
    "lucide-react": { ArrowUpRight: "svg", Headphones: "svg", Library: "svg", ListMusic: "svg", Video: "svg" },
  }
  const exports = {}
  const code = ts.transpileModule(readFileSync(new URL("../../../lectures/page.tsx", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  vm.runInNewContext(code, {
    exports,
    require(name) { assert.ok(Object.hasOwn(modules, name), `Unexpected import: ${name}`); return modules[name] },
  })
  const tree = await exports.default({ searchParams: Promise.resolve({}) })
  const hrefs = []
  function collect(node) {
    if (!node || typeof node !== "object") return
    if (node.type === "a") hrefs.push(node.props.href)
    const children = node.props?.children
    for (const child of Array.isArray(children) ? children.flat(Infinity) : [children]) collect(child)
  }
  collect(tree)
  assert.ok(hrefs.includes("/api/audio/audio-1"))
  assert.ok(hrefs.includes("https://www.youtube.com/watch?v=video-id"))
  assert.ok(!hrefs.includes(lectureUrl))
})
