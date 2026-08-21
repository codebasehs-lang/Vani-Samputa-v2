"use client"

import { useEffect } from "react"
import { usePlayerStore } from "@/store/playerStore"

export function AudioEngine() {
  // All audio control is done via raw store subscriptions — no React re-render cycle
  useEffect(() => {
    const audio = new Audio()
    audio.preload = "metadata"
    let objectUrl: string | null = null

    async function setAudioSource(track: { url: string; mediaType: "AUDIO" | "VIDEO" }, positionS: number, isPlaying: boolean) {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      objectUrl = null
      if (track.mediaType !== "AUDIO") {
        audio.pause()
        audio.src = ""
        return
      }

      try {
        const cached = await caches.open("vani-samputa-audio-v1").then((cache) => cache.match(track.url))
        if (cached) {
          objectUrl = URL.createObjectURL(await cached.blob())
          audio.src = objectUrl
        } else {
          audio.src = track.url
        }
        audio.currentTime = positionS
        if (isPlaying) audio.play().catch(() => {})
      } catch {
        audio.src = track.url
        audio.currentTime = positionS
        if (isPlaying) audio.play().catch(() => {})
      }
    }

    // Wire DOM events → store
    audio.addEventListener("timeupdate", () =>
      usePlayerStore.getState().setPosition(audio.currentTime)
    )
    audio.addEventListener("durationchange", () =>
      usePlayerStore.getState().setDuration(audio.duration)
    )
    audio.addEventListener("ended", () => usePlayerStore.getState().playNext())
    audio.addEventListener("error", () => usePlayerStore.getState().pause())

    // Wire store changes → DOM
    const unsub = usePlayerStore.subscribe((s, prev) => {
      // Track change
      if (s.currentTrack?.id !== prev.currentTrack?.id) {
        if (s.currentTrack) setAudioSource(s.currentTrack, s.positionS, s.isPlaying)
        return
      }
      // Play / pause
      if (s.isPlaying !== prev.isPlaying) {
        if (s.isPlaying && s.currentTrack?.mediaType === "AUDIO") {
          audio.play().catch(() => {})
        } else {
          audio.pause()
        }
      }
      // User-initiated seek
      if (s.requestedPositionS !== null && s.requestedPositionS !== prev.requestedPositionS) {
        audio.currentTime = s.requestedPositionS
        usePlayerStore.getState().clearSeekRequest()
      }
      // Speed / volume
      if (s.speed !== prev.speed) audio.playbackRate = s.speed
      if (s.volume !== prev.volume) audio.volume = s.volume
    })

    // Media Session API (3.5)
    const unsubMedia = usePlayerStore.subscribe((s, prev) => {
      if (!("mediaSession" in navigator)) return
      if (s.currentTrack?.id === prev.currentTrack?.id) return

      if (!s.currentTrack) { navigator.mediaSession.playbackState = "none"; return }

      navigator.mediaSession.metadata = new MediaMetadata({
        title: s.currentTrack.title,
        artist: "HH Haladhara Swami Maharaja",
        album: "Vāṇī Saṃpuṭa",
      })
      const store = () => usePlayerStore.getState()
      navigator.mediaSession.setActionHandler("play", () => store().resume())
      navigator.mediaSession.setActionHandler("pause", () => store().pause())
      navigator.mediaSession.setActionHandler("nexttrack", () => store().playNext())
      navigator.mediaSession.setActionHandler("seekbackward", () =>
        store().seek(Math.max(0, store().positionS - 15))
      )
      navigator.mediaSession.setActionHandler("seekforward", () =>
        store().seek(Math.min(store().duration, store().positionS + 15))
      )
    })

    // Sleep timer polling
    const timer = setInterval(() => {
      const { sleepTimerEnd, isPlaying, pause, setSleepTimer } = usePlayerStore.getState()
      if (sleepTimerEnd && Date.now() >= sleepTimerEnd && isPlaying) {
        pause()
        setSleepTimer(null)
      }
    }, 5_000)

    return () => {
      audio.pause()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      unsub()
      unsubMedia()
      clearInterval(timer)
    }
  }, [])

  return null
}
