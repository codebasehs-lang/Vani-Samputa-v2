import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import vm from "node:vm"
import React from "react"
import * as jsxRuntime from "react/jsx-runtime"
import ts from "typescript"

function setup({ from = "", to = "" } = {}) {
    const state = []
    const changes = []
    let cursor = 0
    function DayPicker() { }
    class FixedDate extends Date {
        constructor(...args) { super(...(args.length ? args : ["2026-11-07T00:30:00.000Z"])) }
    }
    const modules = {
        react: {
            useState(initial) { const index = cursor++; if (!(index in state)) state[index] = initial; return [state[index], (value) => { state[index] = value }] },
            useEffect() { }, useRef: () => ({ current: null }),
        },
        "react/jsx-runtime": jsxRuntime,
        "react-day-picker": { DayPicker },
        "lucide-react": Object.fromEntries(["ArrowRight", "CalendarDays", "ChevronDown", "ChevronLeft", "ChevronRight", "X"].map((name) => [name, () => null])),
    }
    const exports = {}
    const code = ts.transpileModule(readFileSync(new URL("./UploadDateRangePicker.tsx", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText
    vm.runInNewContext(code, { exports, Date: FixedDate, require(name) { assert.ok(Object.hasOwn(modules, name), `Unexpected import: ${name}`); return modules[name] } })
    function nodes(element) { if (!element || typeof element !== "object") return []; return [element, ...React.Children.toArray(element.props?.children).flatMap(nodes)] }
    function render() { cursor = 0; return nodes(exports.UploadDateRangePicker({ from, to, disabled: false, onChange: (range) => changes.push(range) })) }
    return {
        state, changes,
        open: () => render().find((node) => node.props["aria-label"] === "Choose From date").props.onClick({ currentTarget: { focus() { } } }),
        calendar: () => render().find((node) => node.type === DayPicker).props,
        button: (label) => render().find((node) => node.type === "button" && node.props.children === label),
        clear: () => render().find((node) => node.props["aria-label"] === "Clear date range").props.onClick(),
    }
}

test("calendar uses UTC and applying a selected range preserves exact dates", () => {
    const app = setup({ from: "2026-11-02", to: "2026-11-03" })
    app.open()
    assert.equal(app.calendar().timeZone, "UTC")
    assert.equal(app.calendar().selected.from.toISOString(), "2026-11-02T12:00:00.000Z")
    app.calendar().onSelect({ from: new Date("2026-11-04T12:00:00Z"), to: new Date("2026-11-06T12:00:00Z") })
    app.button("Apply range").props.onClick()
    assert.deepEqual(JSON.parse(JSON.stringify(app.changes)), [{ from: "2026-11-04", to: "2026-11-06" }])
    assert.equal(app.state[0], false)
})

test("cancel leaves applied dates untouched and incomplete ranges cannot apply", () => {
    const app = setup()
    app.open()
    assert.equal(app.button("Apply range").props.disabled, true)
    app.calendar().onSelect({ from: new Date("2026-11-04T12:00:00Z") })
    assert.equal(app.button("Apply range").props.disabled, true)
    app.button("Cancel").props.onClick()
    assert.equal(app.changes.length, 0)
})

test("quick ranges count inclusive UTC days and clear removes both dates", () => {
    const app = setup()
    app.open()
    app.button("Last 7 days").props.onClick()
    assert.equal(app.calendar().selected.from.toISOString(), "2026-11-01T12:00:00.000Z")
    assert.equal(app.calendar().selected.to.toISOString(), "2026-11-07T12:00:00.000Z")
    app.button("Last 30 days").props.onClick()
    assert.equal(app.calendar().selected.from.toISOString(), "2026-10-09T12:00:00.000Z")
    app.clear()
    assert.deepEqual(JSON.parse(JSON.stringify(app.changes)), [{ from: "", to: "" }])
})
