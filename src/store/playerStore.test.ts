import assert from "node:assert/strict"
import { after, before, beforeEach, test } from "node:test"
import type { Track } from "./playerStore"

const audio: Track = { id: "audio", title: "Audio", url: "audio.mp3", mediaType: "AUDIO", duration: 600 }
const video: Track = { id: "video", title: "Video", url: "video-id", mediaType: "VIDEO", duration: 1200 }
const saved = new Map<string, string>()
let usePlayerStore: typeof import("./playerStore").usePlayerStore
let initialState: ReturnType<typeof usePlayerStore.getInitialState>

before(async () => {
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: {
      getItem: (name: string) => saved.get(name) ?? null,
      setItem: (name: string, value: string) => { saved.set(name, value) },
      removeItem: (name: string) => { saved.delete(name) },
    },
  })
  ;({ usePlayerStore } = await import("./playerStore"))
  initialState = usePlayerStore.getInitialState()
})

after(() => { Reflect.deleteProperty(globalThis, "sessionStorage") })

beforeEach(() => {
  usePlayerStore.setState(initialState, true)
  saved.clear()
})

test("recent audio and video resume independently at their last positions", () => {
  const store = usePlayerStore.getState()
  store.play(audio)
  store.setPosition(123.5)
  store.play(video)
  store.setPosition(456.75)
  store.play(audio, usePlayerStore.getState().trackProgress[audio.id].positionS)
  assert.equal(usePlayerStore.getState().positionS, 123.5)
  assert.equal(usePlayerStore.getState().duration, 600)
  store.play(video, usePlayerStore.getState().trackProgress[video.id].positionS)
  assert.equal(usePlayerStore.getState().positionS, 456.75)
  assert.equal(usePlayerStore.getState().duration, 1200)
  assert.deepEqual(usePlayerStore.getState().history.map((track) => track.id), ["video", "audio"])
})

test("seeking and stopping retain the last checkpoint", () => {
  const store = usePlayerStore.getState()
  store.play(audio)
  store.seek(250)
  store.pause()
  store.stop()
  assert.deepEqual(usePlayerStore.getState().trackProgress.audio, { positionS: 250, duration: 600 })
  store.play(audio, usePlayerStore.getState().trackProgress.audio.positionS)
  assert.equal(usePlayerStore.getState().positionS, 250)
  assert.equal(usePlayerStore.getState().requestedPositionS, null)
})

test("outgoing player teardown updates only the outgoing track", () => {
  const store = usePlayerStore.getState()
  store.play(video)
  store.setPosition(45)
  store.play(audio, 120)
  store.setPosition(46, video.id)
  store.setDuration(1400, video.id)
  assert.equal(usePlayerStore.getState().positionS, 120)
  assert.equal(usePlayerStore.getState().duration, 600)
  assert.deepEqual(usePlayerStore.getState().trackProgress.video, { positionS: 46, duration: 1400 })
})

test("queue playback is added to history and clears stale seeks", () => {
  const store = usePlayerStore.getState()
  store.play(audio)
  store.seek(100)
  store.addToQueue(video)
  store.playNext()
  store.setPosition(90)
  assert.equal(usePlayerStore.getState().requestedPositionS, null)
  assert.equal(usePlayerStore.getState().currentTrack?.id, video.id)
  assert.deepEqual(usePlayerStore.getState().history.map((track) => track.id), ["video", "audio"])
  assert.equal(usePlayerStore.getState().trackProgress.audio.positionS, 100)
  assert.equal(usePlayerStore.getState().trackProgress.video.positionS, 90)
})

test("history and per-track progress survive storage rehydration", async () => {
  const store = usePlayerStore.getState()
  store.play(audio)
  store.setPosition(234)
  store.setDuration(650)
  const persisted = saved.get("vs-player")!
  usePlayerStore.setState(initialState, true)
  saved.set("vs-player", persisted)
  await usePlayerStore.persist.rehydrate()
  assert.equal(usePlayerStore.getState().history[0].id, audio.id)
  assert.deepEqual(usePlayerStore.getState().trackProgress.audio, { positionS: 234, duration: 650 })
})

test("legacy history without checkpoints remains playable from zero", async () => {
  saved.set("vs-player", JSON.stringify({ state: { history: [audio], currentTrack: null, positionS: 0 }, version: 0 }))
  await usePlayerStore.persist.rehydrate()
  const store = usePlayerStore.getState()
  store.play(store.history[0], store.trackProgress.audio?.positionS ?? 0)
  assert.equal(usePlayerStore.getState().positionS, 0)
})

test("ordinary play still starts at zero rather than implicitly resuming", () => {
  const store = usePlayerStore.getState()
  store.play(audio)
  store.setPosition(100)
  store.play(video)
  store.play(audio)
  assert.equal(usePlayerStore.getState().positionS, 0)
})

test("newly available duration metadata is used for older checkpoints", () => {
  const store = usePlayerStore.getState()
  store.play({ ...audio, duration: undefined })
  store.setPosition(100)
  store.play(video)
  store.play(audio, usePlayerStore.getState().trackProgress.audio.positionS)
  assert.equal(usePlayerStore.getState().positionS, 100)
  assert.equal(usePlayerStore.getState().duration, 600)
})
