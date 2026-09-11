import { create } from "zustand"
import { persist } from "zustand/middleware"

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
  isFullScreen: boolean
  isMiniPlayer: boolean
  isVideoMini: boolean
  videoProgressMap: Record<string, number>  // lectureId → progress 0-100
  requestedPositionS: number | null  // consumed by AudioEngine to seek the audio element
  sleepTimerEnd: number | null       // epoch ms; AudioEngine pauses when reached

  play: (track: Track) => void
  pause: () => void
  resume: () => void
  seek: (positionS: number) => void
  clearSeekRequest: () => void
  setDuration: (duration: number) => void
  setPosition: (positionS: number) => void
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
      isFullScreen: false,
      isMiniPlayer: false,
      isVideoMini: false,
      videoProgressMap: {},
      requestedPositionS: null,
      sleepTimerEnd: null,

      play(track) {
        set((s) => ({
          currentTrack: track,
          isPlaying: true,
          positionS: 0,
          isMiniPlayer: true,
          isVideoMini: true,
          // prepend to history, dedup by id, cap at 20
          history: [track, ...s.history.filter((t) => t.id !== track.id)].slice(0, 20),
        }))
      },
      pause() {
        set({ isPlaying: false })
      },
      resume() {
        set({ isPlaying: true })
      },
      seek(positionS) {
        set({ positionS, requestedPositionS: positionS })
      },
      clearSeekRequest() {
        set({ requestedPositionS: null })
      },
      setDuration(duration) {
        set({ duration })
      },
      setPosition(positionS) {
        set({ positionS })
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
        set({ currentTrack: next, isPlaying: true, positionS: 0, isVideoMini: true, queue: rest })
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
      partialize: (s) => ({
        currentTrack: s.currentTrack,
        positionS: s.positionS,
        speed: s.speed,
        volume: s.volume,
        queue: s.queue,
        history: s.history,
      }),
    }
  )
)
