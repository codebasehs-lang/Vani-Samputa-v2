import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import vm from "node:vm"
import ts from "typescript"
import React from "react"
import * as jsxRuntime from "react/jsx-runtime"

const playlists = [
  { id: "one", title: "English Bhagavatam", language: "English", mediaType: "VIDEO", categories: [{ name: "Bhagavatam" }], _count: { lectures: 2 } },
  { id: "two", title: "Hindi Bhagavatam", language: "Hindi", mediaType: "AUDIO", categories: [{ name: "Bhagavatam" }], _count: { lectures: 3 } },
  { id: "three", title: "English Holy Name", language: "English", mediaType: "AUDIO", categories: [], _count: { lectures: 0 } },
]

// Exercise the component's state and event handlers without adding a DOM test dependency.
async function setup({ failLoad = false, failMutation = false } = {}) {
  const state = []
  const effects = []
  const requests = []
  const messages = []
  let cursor = 0
  let mounted = false
  function ConfirmDialog() {}
  function PlaylistLectures() {}
  const modules = {
    react: {
      ...React,
      useState(initial) {
        const index = cursor++
        if (!(index in state)) state[index] = initial
        return [state[index], (value) => { state[index] = typeof value === "function" ? value(state[index]) : value }]
      },
      useEffect(effect) { if (!mounted) effects.push(effect) },
      useCallback(callback) { return callback },
    },
    "react/jsx-runtime": jsxRuntime,
    sonner: { toast: { success: (message) => messages.push(message), error: (message) => messages.push(message) } },
    "lucide-react": { ChevronDown: () => null, Trash2: () => null, X: () => null },
    "@/components/admin/ConfirmDialog": { ConfirmDialog },
    "@/components/admin/PlaylistLectures": { PlaylistLectures },
  }
  const code = ts.transpileModule(readFileSync(new URL("./AdminPlaylistsTable.tsx", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  const exports = {}
  vm.runInNewContext(code, {
    exports,
    Error,
    AbortController,
    fetch: async (url, options = {}) => {
      requests.push({ url, ...options })
      if (options.method) {
        if (failMutation) return Response.json({ error: "Request failed" }, { status: 500 })
        if (options.method === "PATCH") {
          const { id, categories } = JSON.parse(options.body)
          return Response.json({ ...playlists.find((playlist) => playlist.id === id), categories: categories.map((name) => ({ name })) })
        }
        return Response.json({ ok: true, deletedLectures: 2 })
      }
      if (failLoad) throw new Error("Connection lost")
      return Response.json(url.endsWith("/categories") ? [{ name: "Bhagavatam" }, { name: "Holy Name" }] : playlists)
    },
    require(name) {
      assert.ok(Object.hasOwn(modules, name), `Unexpected import: ${name}`)
      return modules[name]
    },
  })
  function render() {
    cursor = 0
    return exports.AdminPlaylistsTable()
  }
  function nodes(element = render()) {
    if (!element || typeof element !== "object") return []
    return [element, ...React.Children.toArray(element.props?.children).flatMap((child) => nodes(child))]
  }
  render()
  mounted = true
  for (const effect of effects) effect()
  const flush = () => new Promise((resolve) => setImmediate(resolve))
  await flush()
  return {
    nodes,
    requests,
    messages,
    flush,
    select: (index, value) => nodes().filter((node) => node.type === "select")[index].props.onChange({ target: { value } }),
    search: (value) => nodes().find((node) => node.type === "input").props.onChange({ target: { value } }),
    titles: () => nodes().filter((node) => node.type === "td" && typeof node.props.children === "string" && playlists.some((p) => p.title === node.props.children)).map((node) => node.props.children),
    dialog: () => nodes().find((node) => node.type === ConfirmDialog).props,
    deleteButton: () => nodes().find((node) => node.type === "button" && node.props["aria-label"]?.startsWith("Delete playlist")),
    panel: () => nodes().find((node) => node.type === PlaylistLectures),
  }
}

test("title, language, type and category filters combine and can be cleared", async () => {
  const app = await setup()
  assert.equal(app.titles().length, 3)
  app.search("  BHAGAVATAM  ")
  assert.deepEqual(app.titles(), ["English Bhagavatam", "Hindi Bhagavatam"])
  app.select(0, "English")
  app.select(1, "VIDEO")
  app.select(2, "Bhagavatam")
  assert.deepEqual(app.titles(), ["English Bhagavatam"])
  app.select(1, "AUDIO")
  assert.deepEqual(app.titles(), [])
  assert.ok(app.nodes().some((node) => node.props.children === "No playlists match your filters."))
  app.nodes().find((node) => node.type === "button" && node.props.children === "Clear filters").props.onClick()
  assert.equal(app.titles().length, 3)
  app.select(2, "__uncategorized__")
  assert.deepEqual(app.titles(), ["English Holy Name"])
})

test("delete requires confirmation, cancellation does not send a request, and success removes only its row", async () => {
  const app = await setup()
  app.deleteButton().props.onClick()
  assert.equal(app.dialog().open, true)
  assert.match(app.dialog().description, /all its associated lectures \(currently 2\)/)
  app.dialog().onCancel()
  assert.equal(app.dialog().open, false)
  assert.equal(app.requests.filter((request) => request.method === "DELETE").length, 0)
  app.deleteButton().props.onClick()
  app.dialog().onConfirm()
  assert.equal(app.dialog().busy, true)
  app.dialog().onCancel()
  assert.equal(app.dialog().open, true)
  await app.flush()
  assert.deepEqual(app.titles(), ["Hindi Bhagavatam", "English Holy Name"])
  assert.equal(app.dialog().open, false)
  assert.match(app.messages[0], /2 associated lectures deleted/)
})

test("failed deletes preserve the row and confirmation for retry", async () => {
  const app = await setup({ failMutation: true })
  app.deleteButton().props.onClick()
  app.dialog().onConfirm()
  await app.flush()
  assert.equal(app.titles().length, 3)
  assert.equal(app.dialog().open, true)
  assert.equal(app.dialog().busy, false)
  assert.equal(app.messages[0], "Request failed")
})

test("category edits show server results and remain unchanged on failure", async () => {
  for (const failMutation of [false, true]) {
    const app = await setup({ failMutation })
    app.select(3, "Holy Name")
    await app.flush()
    app.select(2, "Holy Name")
    assert.deepEqual(app.titles(), failMutation ? [] : ["English Bhagavatam"])
    assert.equal(app.messages[0], failMutation ? "Request failed" : "Playlist category updated.")
  }
})

test("load failures are shown as errors instead of an empty playlist list", async () => {
  const app = await setup({ failLoad: true })
  const alert = app.nodes().find((node) => node.props.role === "alert")
  assert.equal(alert.props.children, "Connection lost")
})

test("playlists expand independently, pass exact playlist identity, and update lecture counts", async () => {
  const app = await setup()
  const toggle = () => app.nodes().find((node) => node.type === "button" && node.props["aria-controls"] === "playlist-lectures-one")
  assert.equal(toggle().props["aria-expanded"], false)
  assert.equal(app.panel(), undefined)
  toggle().props.onClick()
  assert.equal(toggle().props["aria-expanded"], true)
  assert.equal(app.panel().props.playlist.id, "one")
  app.panel().props.onCountChange("one", 42)
  assert.equal(app.panel().props.playlist._count.lectures, 42)
  toggle().props.onClick()
  assert.equal(app.panel(), undefined)
})
