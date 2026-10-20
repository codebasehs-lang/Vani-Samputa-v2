import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import vm from "node:vm"
import ts from "typescript"
import React from "react"
import * as jsxRuntime from "react/jsx-runtime"

const playlist = { id: "exact-id", title: "Shared title", language: "Sanskrit", mediaType: "VIDEO", categories: [{ name: "General" }] }
const lecture = {
  id: "lecture", title: "Existing lecture", url: "video", language: "Sanskrit", mediaType: "VIDEO",
  categories: [{ name: "General" }], description: null, duration: null, lectureDate: null, playlist: { title: playlist.title },
}

function harness(filename, exportName, props, fetchImpl) {
  const state = []
  const effects = []
  const calls = []
  let cursor = 0
  function EditLectureModal() {}
  function DeleteLectureButton() {}
  function ConfirmDialog() {}
  const modules = {
    react: {
      ...React,
      useState(initial) {
        const index = cursor++
        if (!(index in state)) state[index] = typeof initial === "function" ? initial() : initial
        return [state[index], (value) => { state[index] = typeof value === "function" ? value(state[index]) : value }]
      },
      useEffect(effect, deps) {
        const index = cursor++
        if (!state[index] || deps.some((dep, i) => dep !== state[index][i])) {
          state[index] = deps
          effects.push(effect)
        }
      },
    },
    "react/jsx-runtime": jsxRuntime,
    "lucide-react": { Pencil: () => null, Plus: () => null, X: () => null, Trash2: () => null },
    "@/components/admin/EditLectureModal": { EditLectureModal },
    "@/components/admin/DeleteLectureButton": { DeleteLectureButton },
    "@/components/admin/ConfirmDialog": { ConfirmDialog },
    "@/lib/duration": { formatDuration: () => "" },
    "@/lib/adminColors": { ADMIN_COLORS: {}, adminGradient: () => "" },
    "next/navigation": { useRouter: () => ({ refresh: () => calls.push("refresh") }) },
    sonner: { toast: { success: (message) => calls.push(message), error: (message) => calls.push(message) } },
  }
  const exports = {}
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL(filename, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, {
    exports, Error, AbortController,
    document: { addEventListener() {}, removeEventListener() {} },
    fetch: async (url, options = {}) => {
      calls.push({ url, ...options })
      return fetchImpl(url, options)
    },
    require(name) {
      assert.ok(Object.hasOwn(modules, name), `Unexpected import: ${name}`)
      return modules[name]
    },
  })
  function render() {
    cursor = 0
    return exports[exportName](props)
  }
  function nodes(element = render()) {
    if (!element || typeof element !== "object") return []
    return [element, ...React.Children.toArray(element.props?.children).flatMap((child) => nodes(child))]
  }
  return {
    calls, nodes, render,
    async settle() {
      render()
      for (const effect of effects.splice(0)) effect()
      await new Promise((resolve) => setImmediate(resolve))
    },
    editor: () => nodes().find((node) => node.type === EditLectureModal)?.props,
    deleteButton: () => nodes().find((node) => node.type === DeleteLectureButton)?.props,
    confirm: () => nodes().find((node) => node.type === ConfirmDialog)?.props,
  }
}

test("expanded lectures load by ID and support add, edit, delete refresh, and count updates", async () => {
  const counts = []
  const app = harness("./PlaylistLectures.tsx", "PlaylistLectures", {
    playlist, onCountChange: (...args) => counts.push(args),
  }, () => Response.json({ lectures: [lecture], total: 1 }))
  await app.settle()
  assert.match(app.calls[0].url, /playlistId=exact-id/)
  assert.deepEqual(counts, [["exact-id", 1]])
  app.nodes().find((node) => node.type === "button" && React.Children.toArray(node.props.children).some((child) =>
    typeof child === "string" && child.trim() === "Add Lecture"
  )).props.onClick()
  assert.equal(app.editor().lecture, null)
  assert.equal(app.editor().playlist.id, "exact-id")
  app.editor().onClose()
  app.nodes().find((node) => node.props["aria-label"] === "Edit lecture Existing lecture").props.onClick()
  assert.equal(app.editor().lecture.id, "lecture")
  app.editor().onSaved()
  await app.settle()
  assert.equal(counts.length, 2)
  assert.equal(app.deleteButton().id, "lecture")
  app.deleteButton().onDeleted()
  await app.settle()
  assert.equal(counts.length, 3)
})

test("expanded lecture load errors offer retry and empty playlists offer Add Lecture", async () => {
  let fail = true
  const app = harness("./PlaylistLectures.tsx", "PlaylistLectures", { playlist, onCountChange() {} }, () =>
    fail ? Response.json({}, { status: 500 }) : Response.json({ lectures: [], total: 0 })
  )
  await app.settle()
  assert.ok(app.nodes().some((node) => node.props.role === "alert"))
  fail = false
  app.nodes().find((node) => node.type === "button" && node.props.children === "Retry").props.onClick()
  await app.settle()
  assert.ok(app.nodes().some((node) => node.props.children === "No lectures in this playlist yet. Add the first lecture above."))
})

test("shared modal creates and edits within the exact playlist and refreshes only on success", async () => {
  for (const existing of [null, lecture]) {
    const events = []
    const app = harness("./EditLectureModal.tsx", "EditLectureModal", {
      lecture: existing, playlist, onSaved: () => events.push("saved"), onClose: () => events.push("closed"),
    }, () => Response.json([]))
    await app.settle()
    const input = (id) => app.nodes().find((node) => node.props.id === id)
    assert.equal(input("lecture-playlistName").props.readOnly, true)
    assert.equal(input("lecture-language").props.disabled, true)
    assert.equal(input("lecture-language").props.value, "Sanskrit")
    input("lecture-title").props.onChange({ target: { value: "New title" } })
    input("lecture-url").props.onChange({ target: { value: "new-video" } })
    await app.nodes().find((node) => node.type === "form").props.onSubmit({ preventDefault() {} })
    const request = app.calls.find((call) => call.method)
    assert.equal(request.method, existing ? "PATCH" : "POST")
    assert.equal(request.url, existing ? "/api/admin/lectures?id=lecture" : "/api/admin/lectures")
    const body = JSON.parse(request.body)
    assert.equal(body.playlistId, "exact-id")
    assert.equal(body.title, "New title")
    assert.equal(body.language, "Sanskrit")
    assert.equal(body.mediaType, "VIDEO")
    assert.equal(body.categories, "General")
    assert.deepEqual(events, ["saved", "closed"])
  }
})

test("failed modal saves keep the form open and show an error", async () => {
  const events = []
  const app = harness("./EditLectureModal.tsx", "EditLectureModal", {
    lecture: null, playlist, onSaved: () => events.push("saved"), onClose: () => events.push("closed"),
  }, (url, options) => options.method
    ? Response.json({ error: "Save rejected" }, { status: 400 })
    : Response.json([])
  )
  await app.settle()
  await app.nodes().find((node) => node.type === "form").props.onSubmit({ preventDefault() {} })
  assert.deepEqual(events, [])
  assert.equal(app.nodes().find((node) => node.props.role === "alert").props.children, "Save rejected")
})

test("lecture deletion confirms first and refreshes the expanded list only after success", async () => {
  for (const fail of [false, true]) {
    let deleted = false
    const app = harness("./DeleteLectureButton.tsx", "DeleteLectureButton", {
      id: "lecture", onDeleted: () => { deleted = true },
    }, () => Response.json({}, { status: fail ? 500 : 200 }))
    app.nodes().find((node) => node.type === "button").props.onClick()
    assert.equal(app.confirm().open, true)
    assert.equal(app.calls.length, 0)
    await app.confirm().onConfirm()
    assert.equal(deleted, !fail)
    assert.equal(app.confirm().open, fail)
    assert.equal(app.confirm().busy, false)
    assert.equal(app.calls[0].url, "/api/admin/lectures?id=lecture")
    assert.equal(app.calls[0].method, "DELETE")
  }
})

test("the existing standalone lecture editor remains name-based", async () => {
  const app = harness("./EditLectureModal.tsx", "EditLectureModal", {
    lecture, onClose() {},
  }, () => Response.json([]))
  await app.settle()
  assert.equal(app.nodes().find((node) => node.props.id === "lecture-playlistName").props.readOnly, false)
  assert.equal(app.nodes().find((node) => node.props.id === "lecture-type").props.disabled, false)
  await app.nodes().find((node) => node.type === "form").props.onSubmit({ preventDefault() {} })
  const body = JSON.parse(app.calls.find((call) => call.method).body)
  assert.equal(body.playlistId, undefined)
  assert.equal(body.playlistName, playlist.title)
})
