import { create } from "zustand"
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware"

export type Track = {
  id: string
  title: string
  url: string
  mediaType: "AUDIO" | "VIDEO"
  duration?: number
  thumbnail?: string
  playlistId?: string
}

type PlayerState = {
  currentTrack: Track | null
  isPlaying: boolean
  positionS: number
  duration: number
  speed: number
  volume: number
  queue: Track[]
  history: Track[]
  trackProgress: Record<string, { positionS: number; duration: number }>
  isFullScreen: boolean
  isMiniPlayer: boolean
  isVideoMini: boolean
  videoProgressMap: Record<string, number>  // lectureId → progress 0-100
  requestedPositionS: number | null  // consumed by AudioEngine to seek the audio element
  sleepTimerEnd: number | null       // epoch ms; AudioEngine pauses when reached

  play: (track: Track, positionS?: number) => void
  playPlaylist: (tracks: Track[], trackId: string, positionS?: number) => void
  finishTrack: (trackId: string) => void
  pause: () => void
  stop: () => void
  resume: () => void
  seek: (positionS: number) => void
  clearSeekRequest: () => void
  setDuration: (duration: number, trackId?: string) => void
  setPosition: (positionS: number, trackId?: string) => void
  setSpeed: (speed: number) => void
  setVolume: (volume: number) => void
  setSleepTimer: (minutes: number | null) => void
  addToQueue: (track: Track) => void
  removeFromQueue: (id: string) => void
  reorderQueue: (from: number, to: number) => void
  playNext: () => void
  openFullScreen: () => void
  closeFullScreen: () => void
  showMiniPlayer: () => void
  hideMiniPlayer: () => void
  setVideoMini: (v: boolean) => void
  setVideoProgress: (lectureId: string, pct: number) => void
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      currentTrack: null,
      isPlaying: false,
      positionS: 0,
      duration: 0,
      speed: 1,
      volume: 1,
      queue: [],
      history: [],
      trackProgress: {},
      isFullScreen: false,
      isMiniPlayer: false,
      isVideoMini: false,
      videoProgressMap: {},
      requestedPositionS: null,
      sleepTimerEnd: null,

      play(track, positionS = 0) {
        set((s) => ({
          currentTrack: track,
          isPlaying: true,
          positionS,
          duration: s.trackProgress[track.id]?.duration || track.duration || 0,
          requestedPositionS: null,
          isMiniPlayer: true,
          isVideoMini: track.mediaType === "VIDEO",
          // prepend to history, dedup by id, cap at 20
          history: [track, ...s.history.filter((t) => t.id !== track.id)].slice(0, 20),
        }))
      },
      playPlaylist(tracks, trackId, positionS = 0) {
        const index = tracks.findIndex((track) => track.id === trackId)
        if (index < 0) throw new Error("Selected lecture is not in the playlist")
        const isCurrent = get().currentTrack?.id === trackId
        set({ queue: tracks.slice(index + 1) })
        get().play(tracks[index], positionS)
        if (isCurrent) get().seek(positionS)
      },
      finishTrack(trackId) {
        const state = get()
        if (state.currentTrack?.id !== trackId) return
        if (state.duration > 0) state.setPosition(state.duration, trackId)
        if (state.currentTrack.mediaType === "VIDEO") state.setVideoProgress(trackId, 100)
        if (state.queue.length) state.playNext()
        else state.pause()
      },
      pause() {
        set({ isPlaying: false })
      },
      stop() {
        set({
          currentTrack: null,
          isPlaying: false,
          positionS: 0,
          duration: 0,
          requestedPositionS: null,
          isFullScreen: false,
          isMiniPlayer: false,
          isVideoMini: false,
        })
      },
      resume() {
        set((s) => ({
          isPlaying: true,
          isMiniPlayer: s.currentTrack?.mediaType === "AUDIO" ? true : s.isMiniPlayer,
          isVideoMini: s.currentTrack?.mediaType === "VIDEO" ? true : s.isVideoMini,
        }))
      },
      seek(positionS) {
        get().setPosition(positionS)
        set({ positionS, requestedPositionS: positionS })
      },
      clearSeekRequest() {
        set({ requestedPositionS: null })
      },
      setDuration(duration, trackId = get().currentTrack?.id) {
        if (!trackId || !Number.isFinite(duration) || duration <= 0) return
        set((s) => ({
          ...(s.currentTrack?.id === trackId ? { duration } : {}),
          trackProgress: {
            ...s.trackProgress,
            [trackId]: {
              positionS: s.trackProgress[trackId]?.positionS ?? (s.currentTrack?.id === trackId ? s.positionS : 0),
              duration,
            },
          },
        }))
      },
      setPosition(positionS, trackId = get().currentTrack?.id) {
        if (!trackId || !Number.isFinite(positionS) || positionS < 0) return
        set((s) => ({
          ...(s.currentTrack?.id === trackId ? { positionS } : {}),
          trackProgress: {
            ...s.trackProgress,
            [trackId]: {
              positionS,
              duration: s.trackProgress[trackId]?.duration ?? (s.currentTrack?.id === trackId ? s.duration : 0),
            },
          },
        }))
      },
      setSpeed(speed) {
        set({ speed })
      },
      setVolume(volume) {
        set({ volume })
      },
      setSleepTimer(minutes) {
        set({ sleepTimerEnd: minutes ? Date.now() + minutes * 60_000 : null })
      },
      addToQueue(track) {
        set((s) => ({ queue: [...s.queue, track] }))
      },
      removeFromQueue(id) {
        set((s) => ({ queue: s.queue.filter((t) => t.id !== id) }))
      },
      reorderQueue(from, to) {
        set((s) => {
          const q = [...s.queue]
          const [item] = q.splice(from, 1)
          q.splice(to, 0, item)
          return { queue: q }
        })
      },
      playNext() {
        const { queue } = get()
        if (!queue.length) return
        const [next, ...rest] = queue
        set((s) => ({
          queue: rest,
          trackProgress: {
            ...s.trackProgress,
            [next.id]: {
              positionS: 0,
              duration: s.trackProgress[next.id]?.duration || next.duration || 0,
            },
          },
        }))
        get().play(next)
      },
      openFullScreen() {
        set({ isFullScreen: true })
      },
      closeFullScreen() {
        set({ isFullScreen: false })
      },
      showMiniPlayer() {
        set({ isMiniPlayer: true })
      },
      hideMiniPlayer() {
        set({ isMiniPlayer: false })
      },
      setVideoMini(v) {
        set({ isVideoMini: v })
      },
      setVideoProgress(lectureId, pct) {
        set((s) => ({ videoProgressMap: { ...s.videoProgressMap, [lectureId]: pct } }))
      },
    }),
    {
      name: "vs-player",
      storage: createJSONStorage(getPlayerStorage),
      partialize: (s) => ({
        currentTrack: s.currentTrack,
        positionS: s.positionS,
        speed: s.speed,
        volume: s.volume,
        queue: s.queue,
        history: s.history,
        trackProgress: s.trackProgress,
        videoProgressMap: s.videoProgressMap,
      }),
    }
  )
)

function getPlayerStorage(): StateStorage {
  const dummy: StateStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  }

  if (typeof window === "undefined" && typeof globalThis.localStorage === "undefined") {
    return dummy
  }

  let storage: StateStorage
  try {
    storage = typeof window !== "undefined" ? window.localStorage : globalThis.localStorage
    storage.setItem("vs-player-storage-check", "1")
    storage.removeItem("vs-player-storage-check")
  } catch (error) {
    console.warn("Playback history cannot use local storage; app restarts may lose progress.", error)
    try {
      storage = typeof window !== "undefined" ? window.sessionStorage : globalThis.sessionStorage
      storage.setItem("vs-player-storage-check", "1")
      storage.removeItem("vs-player-storage-check")
      return storage
    } catch (sessionError) {
      console.error("Playback history storage is unavailable.", sessionError)
      return dummy
    }
  }

  try {
    const session = typeof window !== "undefined" ? window.sessionStorage : globalThis.sessionStorage
    const legacy = session?.getItem("vs-player")
    if (!storage.getItem("vs-player") && legacy) {
      storage.setItem("vs-player", legacy)
      session.removeItem("vs-player")
    }
  } catch (error) {
    console.warn("Could not migrate playback history from session storage.", error)
  }

  return storage
}
