import assert from "node:assert/strict"
import { test } from "node:test"
import { getStratusAudioSource } from "./stratusAudio"

const origin = "https://vani-samputa-audio-development.zohostratus.in"
const key = "HH Haladhara Swami Maharaj/0001 BG 03-01 - Introduction to Chapter Three - 2022-02-15.mp3"

test("permanent Stratus URLs normalize spaces and preserve the object key", () => {
    const source = getStratusAudioSource(`${origin}/${key}`, origin)
    assert.ok(source)
    assert.equal(source.objectKey, key)
    assert.equal(source.url, `${origin}/${key.split("/").map(encodeURIComponent).join("/")}`)
    assert.deepEqual(getStratusAudioSource(source.url, origin), source)
})

test("temporary signed URLs, function URLs and foreign buckets are rejected", () => {
    for (const value of [
        `${origin}/_signed/${key}?stsSignature=temporary`,
        `${origin}/_signed/${key}`,
        `${origin}/${key}?download=true`,
        `${origin}/${key}#fragment`,
        "https://project.development.catalystserverless.in/server/signer/",
        "https://other.example/audio.mp3",
        `${origin.replace("https:", "http:")}/${key}`,
    ]) assert.equal(getStratusAudioSource(value, origin), null)
})

test("invalid object paths and invalid bucket configuration are rejected", () => {
    for (const pathname of ["/", "/audio/", "/audio//track.mp3", "/audio/%ZZ.mp3", "/audio/%2ftrack.mp3", "/audio/%5ctrack.mp3", "/audio/%00track.mp3"]) {
        assert.equal(getStratusAudioSource(`${origin}${pathname}`, origin), null)
    }
    assert.equal(getStratusAudioSource(`${origin}/${key}`, `${origin}/folder/`), null)
    assert.equal(getStratusAudioSource(`${origin}/${key}`, ""), null)
})
