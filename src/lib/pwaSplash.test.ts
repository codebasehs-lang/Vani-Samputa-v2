import assert from "node:assert/strict"
import { test } from "node:test"
import { runInNewContext } from "node:vm"
import { PWA_SPLASH_SESSION_KEY, pwaLaunchScript } from "./pwaSplash"

function launch({ seen = false, installed = true, mobile = true, ios = false, blocked = false } = {}) {
    const attributes = new Map<string, string>()
    const location = { pathname: "/audio", search: "?search=lecture" }
    runInNewContext(pwaLaunchScript, {
        window: {
            location,
            matchMedia: (query: string) => ({ matches: query.includes("standalone") ? installed : mobile }),
            sessionStorage: {
                getItem(key: string) {
                    assert.equal(key, PWA_SPLASH_SESSION_KEY)
                    if (blocked) throw new Error("Storage unavailable")
                    return seen ? "1" : null
                },
            },
        },
        navigator: { standalone: ios },
        document: { documentElement: { setAttribute: (key: string, value: string) => attributes.set(key, value) } },
    })
    assert.deepEqual(location, { pathname: "/audio", search: "?search=lecture" })
    return attributes.has("data-pwa-launch")
}

test("mobile app startup shows the splash only in a fresh session", () => {
    assert.equal(launch(), true)
    assert.equal(launch({ seen: true }), false)
    assert.equal(launch({ installed: false, ios: true }), true)
    assert.equal(launch({ installed: false, ios: true, seen: true }), false)
})

test("browser visits, desktop, and unavailable session storage do not activate the mobile splash", () => {
    assert.equal(launch({ installed: false }), false)
    assert.equal(launch({ mobile: false }), false)
    assert.equal(launch({ blocked: true }), false)
})
