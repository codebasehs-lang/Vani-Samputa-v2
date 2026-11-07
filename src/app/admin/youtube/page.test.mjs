import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import vm from "node:vm"
import React from "react"
import * as jsxRuntime from "react/jsx-runtime"
import ts from "typescript"

function setup({ from = "", to = "", failure = false, empty = false, videos = [], selectedPlaylist = "ALL", mutationFailure = false } = {}) {
    const state = [false, false, ["Gita", "Tour"], videos, "ALL", "", "ALL", "ALL", selectedPlaylist, null, "", from, to, false]
    const calls = []
    const messages = []
    let cursor = 0
    const modules = {
        react: { useState: () => { const index = cursor++; return [state[index], (value) => { state[index] = typeof value === "function" ? value(state[index]) : value }] }, useEffect() { } },
        "react/jsx-runtime": jsxRuntime,
        "@/components/admin/AdminPageHeader": { AdminPageHeader: () => null },
        "@/components/admin/UploadDateRangePicker": { UploadDateRangePicker: () => null },
        "@/lib/adminColors": { ADMIN_COLORS: {}, adminGradient: () => "" },
        "lucide-react": Object.fromEntries(["CircleAlert", "CircleCheck", "Download", "ExternalLink", "RefreshCw", "Upload", "Video", "X"].map((name) => [name, () => null])),
        sonner: { toast: { error: (message) => messages.push(message), success: (message) => messages.push(message) } },
        xlsx: {},
    }
    const code = ts.transpileModule(readFileSync(new URL("./page.tsx", import.meta.url), "utf8"), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText
    const exports = {}
    vm.runInNewContext(code, {
        exports, Error,
        fetch: async (url, options) => {
            calls.push({ url, body: options?.body ? JSON.parse(options.body) : null })
            if (failure) throw new Error("Network unavailable")
            if (options?.method === "PATCH") return mutationFailure ? Response.json({ error: "Write failed" }, { status: 500 }) : Response.json({ updated: JSON.parse(options.body).videoIds?.length ?? 1 })
            if (url.endsWith("youtube-preview")) return Response.json({ fetched: empty ? 0 : 1, inserted: empty ? 0 : 1, updated: 0, ...(from ? { videoIds: empty ? [] : ["matching"] } : {}) })
            return Response.json({ categories: [], videos: ["matching", "outside"].map((videoId) => ({ videoId, title: videoId, status: "NEW", detectedCategory: "Gita", detectedLanguage: "Odia" })) })
        },
        require(name) { assert.ok(Object.hasOwn(modules, name), `Unexpected import: ${name}`); return modules[name] },
    })
    function nodes(element) {
        if (!element || typeof element !== "object") return []
        return [element, ...React.Children.toArray(element.props?.children).flatMap(nodes)]
    }
    function render() { cursor = 0; return nodes(exports.default()) }
    return {
        state, calls, messages, nodes: render,
        sync: () => render().find((node) => node.type === "button" && node.props.onClick?.name === "handleSync").props.onClick(),
        syncDisabled: () => render().find((node) => node.type === "button" && node.props.onClick?.name === "handleSync").props.disabled,
        clear: () => render().find((node) => node.type?.name === "UploadDateRangePicker").props.onChange({ from: "", to: "" }),
        editLanguage: (title, value) => render().find((node) => node.props["aria-label"] === `Language for ${title}`).props.onChange({ target: { value } }),
        editTags: (videoId, next) => {
            const title = state[3].find((row) => row.videoId === videoId).title
            const row = render().find((node) => node.type === "tr" && nodes(node).some((child) => child.props["aria-label"] === `Language for ${title}`))
            return nodes(row).find((node) => node.type?.name === "CategoryCell").props.onChange(next)
        },
        editPlaylist: (title, value) => render().find((node) => node.props["aria-label"] === `Playlist for ${title}`).props.onBlur({ currentTarget: { value } }),
        approve: (title) => render().find((node) => node.props["aria-label"] === `Approve ${title}`).props.onChange(),
    }
}

test("date-range picker is always rendered and updates both controlled dates", () => {
    const app = setup()
    const picker = app.nodes().find((node) => node.type?.name === "UploadDateRangePicker")
    assert.ok(picker)
    assert.equal(picker.props.from, "")
    assert.equal(picker.props.to, "")
    picker.props.onChange({ from: "2026-11-02", to: "2026-11-03" })
    assert.equal(app.state[11], "2026-11-02")
    assert.equal(app.state[12], "2026-11-03")
})

test("range sync sends selected dates and displays matching staged videos only", async () => {
    const app = setup({ from: "2026-11-02", to: "2026-11-03" })
    await app.sync()
    assert.deepEqual(app.calls[0].body, { from: "2026-11-02", to: "2026-11-03" })
    assert.equal(app.state[3].length, 1)
    assert.equal(app.state[3][0].videoId, "matching")
    assert.match(app.state[10], /2026-11-02 to 2026-11-03/)
    assert.equal(app.state[1], false)
    const empty = setup({ from: "2026-11-02", to: "2026-11-03", empty: true })
    await empty.sync()
    assert.equal(empty.state[3].length, 0)
})

test("blank dates retain full sync and clearing resets both inputs", async () => {
    const app = setup()
    await app.sync()
    assert.deepEqual(app.calls[0].body, {})
    assert.equal(app.state[3].length, 2)
    const selected = setup({ from: "2026-11-02", to: "2026-11-03" })
    selected.clear()
    assert.equal(selected.state[11], "")
    assert.equal(selected.state[12], "")
})

test("partial and reversed dates disable sync and prevent API calls", async () => {
    for (const range of [{ from: "2026-11-02" }, { to: "2026-11-03" }, { from: "2026-11-04", to: "2026-11-03" }]) {
        const app = setup(range)
        assert.equal(app.syncDisabled(), true)
        await app.sync()
        assert.equal(app.calls.length, 0)
    }
})

test("network failures release busy state and show an error", async () => {
    const app = setup({ failure: true })
    await app.sync()
    assert.equal(app.state[1], false)
    assert.equal(app.state[10], "Sync could not complete.")
    assert.ok(app.messages.includes("Network unavailable"))
})

function playlistVideos() {
    return [
        { videoId: "one", title: "First", ytPlaylistTitle: "Tour", detectedLanguage: "Odia", detectedCategory: "Gita", status: "NEW" },
        { videoId: "two", title: "Second", ytPlaylistTitle: "Tour", detectedLanguage: "Hindi", detectedCategory: "Tour", status: "APPROVED" },
        { videoId: "locked", title: "Imported", ytPlaylistTitle: "Tour", detectedLanguage: "Odia", detectedCategory: "Gita", status: "IMPORTED" },
        { videoId: "other", title: "Other", ytPlaylistTitle: "Other", detectedLanguage: "Odia", detectedCategory: "Gita", status: "NEW" },
    ]
}

test("language edits apply to the whole selected playlist, including rows hidden by search", async () => {
    const app = setup({ videos: playlistVideos(), selectedPlaylist: "Tour" })
    app.state[5] = "First"
    await app.editLanguage("First", "English")
    assert.deepEqual(app.calls[0].body, { videoIds: ["one", "two"], language: "English" })
    assert.deepEqual(app.state[3].slice(0, 2).map((row) => row.language), ["English", "English"])
    assert.equal(app.state[3][2].language, undefined)
    assert.equal(app.state[3][3].language, undefined)
})

test("tag replacement and clearing update all editable playlist rows", async () => {
    const app = setup({ videos: playlistVideos(), selectedPlaylist: "Tour" })
    await app.editTags("one", ["Gita", "Tour"])
    assert.deepEqual(app.calls[0].body, { videoIds: ["one", "two"], category: "Gita, Tour" })
    await app.editTags("one", [])
    assert.equal(app.state[3][0].category, "")
    assert.equal(app.state[3][1].category, "")
})

test("playlist rename follows the updated group and refreshes every input value", async () => {
    const app = setup({ videos: playlistVideos(), selectedPlaylist: "Tour" })
    await app.editPlaylist("First", " New Tour ")
    assert.deepEqual(app.calls[0].body, { videoIds: ["one", "two"], playlistTitle: "New Tour" })
    assert.equal(app.state[8], "New Tour")
    const fields = app.nodes().filter((node) => node.props["aria-label"]?.startsWith("Playlist for"))
    assert.deepEqual(fields.map((node) => node.props.defaultValue), ["New Tour", "New Tour"])
})

test("unfiltered edits and approval remain row-specific; failed saves preserve rows", async () => {
    const single = setup({ videos: playlistVideos() })
    await single.editLanguage("First", "English")
    assert.deepEqual(single.calls[0].body, { videoId: "one", language: "English" })
    const selected = setup({ videos: playlistVideos(), selectedPlaylist: "Tour" })
    await selected.approve("First")
    assert.deepEqual(selected.calls[0].body, { videoId: "one", status: "APPROVED" })
    const failure = setup({ videos: playlistVideos(), selectedPlaylist: "Tour", mutationFailure: true })
    await failure.editLanguage("First", "English")
    assert.equal(failure.state[3][0].language, undefined)
    assert.equal(failure.state[3][1].language, undefined)
    assert.equal(failure.state[13], false)
    assert.ok(failure.messages.includes("Write failed"))
})
