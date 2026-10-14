import assert from "node:assert/strict"
import { after, before, beforeEach, test } from "node:test"
import type { Track } from "./playerStore"

const audio: Track = { id: "audio", title: "Audio", url: "audio.mp3", mediaType: "AUDIO", duration: 600 }
const video: Track = { id: "video", title: "Video", url: "video-id", mediaType: "VIDEO", duration: 1200 }
const localSaved = new Map<string, string>()
const sessionSaved = new Map<string, string>()
let usePlayerStore: typeof import("./playerStore").usePlayerStore
let initialState: ReturnType<typeof usePlayerStore.getInitialState>

before(async () => {
  sessionSaved.set("vs-player", JSON.stringify({
    state: { currentTrack: video, history: [video], positionS: 321 },
    version: 0,
  }))
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (name: string) => localSaved.get(name) ?? null,
      setItem: (name: string, value: string) => { localSaved.set(name, value) },
      removeItem: (name: string) => { localSaved.delete(name) },
    },
  })
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: {
      getItem: (name: string) => sessionSaved.get(name) ?? null,
      setItem: (name: string, value: string) => { sessionSaved.set(name, value) },
      removeItem: (name: string) => { sessionSaved.delete(name) },
    },
  })
  ;({ usePlayerStore } = await import("./playerStore"))
  assert.equal(JSON.parse(localSaved.get("vs-player")!).state.positionS, 321)
  assert.equal(sessionSaved.has("vs-player"), false, "legacy session history is migrated to local storage")
  initialState = usePlayerStore.getInitialState()
})

after(() => {
  Reflect.deleteProperty(globalThis, "localStorage")
  Reflect.deleteProperty(globalThis, "sessionStorage")
})

beforeEach(() => {
  usePlayerStore.setState(initialState, true)
  localSaved.clear()
  sessionSaved.clear()
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
  const persisted = localSaved.get("vs-player")!
  usePlayerStore.setState(initialState, true)
  localSaved.set("vs-player", persisted)
  await usePlayerStore.persist.rehydrate()
  assert.equal(usePlayerStore.getState().history[0].id, audio.id)
  assert.deepEqual(usePlayerStore.getState().trackProgress.audio, { positionS: 234, duration: 650 })
})

test("legacy history without checkpoints remains playable from zero", async () => {
  localSaved.set("vs-player", JSON.stringify({ state: { history: [audio], currentTrack: null, positionS: 0 }, version: 0 }))
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

test("resuming video activates isVideoMini", () => {
  const store = usePlayerStore.getState()
  store.play(video)
  store.pause()
  usePlayerStore.setState({ isVideoMini: false })
  assert.equal(usePlayerStore.getState().isVideoMini, false)
  usePlayerStore.getState().resume()
  assert.equal(usePlayerStore.getState().isPlaying, true)
  assert.equal(usePlayerStore.getState().isVideoMini, true)
})

test("video progress and map survive storage rehydration", async () => {
  const store = usePlayerStore.getState()
  store.play(video)
  store.setPosition(300)
  store.setVideoProgress(video.id, 25)
  const persisted = localSaved.get("vs-player")!
  usePlayerStore.setState(initialState, true)
  localSaved.set("vs-player", persisted)
  await usePlayerStore.persist.rehydrate()
  assert.equal(usePlayerStore.getState().currentTrack?.id, video.id)
  assert.equal(usePlayerStore.getState().videoProgressMap[video.id], 25)
})

test("app restart without session storage restores video and recent history while paused", async () => {
  const store = usePlayerStore.getState()
  store.play(audio)
  store.setPosition(123)
  store.play(video)
  store.setPosition(456.75)
  store.setDuration(1400)
  store.setVideoProgress(video.id, 33)
  const persisted = localSaved.get("vs-player")!
  usePlayerStore.setState(initialState, true)
  sessionSaved.clear()
  localSaved.set("vs-player", persisted)
  await usePlayerStore.persist.rehydrate()

  const restored = usePlayerStore.getState()
  assert.equal(restored.currentTrack?.id, video.id)
  assert.equal(restored.positionS, 456.75)
  assert.equal(restored.trackProgress.video.duration, 1400)
  assert.equal(restored.trackProgress.audio.positionS, 123)
  assert.deepEqual(restored.history.map((track) => track.id), ["video", "audio"])
  assert.equal(restored.isPlaying, false)
  assert.equal(restored.isVideoMini, false)

  restored.resume()
  assert.equal(usePlayerStore.getState().isPlaying, true)
  assert.equal(usePlayerStore.getState().isVideoMini, true)
  assert.equal(usePlayerStore.getState().positionS, 456.75)
})
