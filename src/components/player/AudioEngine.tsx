"use client"

import { useEffect } from "react"
import { usePlayerStore } from "@/store/playerStore"

export function AudioEngine() {
  // All audio control is done via raw store subscriptions — no React re-render cycle
  useEffect(() => {
    const audio = new Audio()
    audio.preload = "metadata"
    let objectUrl: string | null = null
    let sourceRequest = 0
    let loadedTrackId: string | null = null
    let loadingTrackId: string | null = null
    let historyTrackId: string | null = null

    async function recordPlayback(trackId: string, positionS: number) {
      if (historyTrackId === trackId) return
      historyTrackId = trackId
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lectureId: trackId, positionS, completed: false }),
      }).catch(() => {})
    }

    async function setAudioSource(
      track: { id: string; url: string; mediaType: "AUDIO" | "VIDEO" },
      positionS: number,
      requestId: number,
    ) {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      objectUrl = null
      loadedTrackId = null
      if (track.mediaType !== "AUDIO") {
        loadingTrackId = null
        audio.pause()
        audio.src = ""
        return
      }

      try {
        if (requestId === sourceRequest) loadingTrackId = track.id
        const cached = await caches.open("vani-samputa-audio-v1").then((cache) => cache.match(track.url))
        if (requestId !== sourceRequest) return
        if (cached) {
          objectUrl = URL.createObjectURL(await cached.blob())
          audio.src = objectUrl
        } else {
          audio.src = track.url
        }
        await new Promise<void>((resolve, reject) => {
          const ready = () => { cleanup(); resolve() }
          const failed = () => { cleanup(); reject(new Error("Audio could not be loaded")) }
          const cleanup = () => {
            audio.removeEventListener("canplay", ready)
            audio.removeEventListener("error", failed)
          }
          audio.addEventListener("canplay", ready, { once: true })
          audio.addEventListener("error", failed, { once: true })
          audio.load()
        })
        if (requestId !== sourceRequest) return
        audio.currentTime = Math.min(positionS, Number.isFinite(audio.duration) ? audio.duration : positionS)
        audio.playbackRate = usePlayerStore.getState().speed
        audio.volume = usePlayerStore.getState().volume
        const currentTrack = usePlayerStore.getState().currentTrack
        loadedTrackId = currentTrack?.url === track.url ? currentTrack.id : null
        loadingTrackId = null
        if (usePlayerStore.getState().isPlaying) await audio.play()
      } catch {
        if (requestId !== sourceRequest) return
        loadingTrackId = null
        usePlayerStore.getState().pause()
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
    // Wire store changes → DOM
    const unsub = usePlayerStore.subscribe((s, prev) => {
      // Track change
      if (s.currentTrack?.id !== prev.currentTrack?.id) {
        sourceRequest += 1
        historyTrackId = null
        audio.pause()
        usePlayerStore.getState().setDuration(0)
        if (s.currentTrack) {
          void recordPlayback(s.currentTrack.id, s.positionS)
          void setAudioSource(s.currentTrack, s.positionS, sourceRequest)
        }
        return
      }
      // Play / pause
      if (s.isPlaying !== prev.isPlaying) {
        if (s.isPlaying && s.currentTrack?.mediaType === "AUDIO") {
          if (loadedTrackId === s.currentTrack.id) {
            void recordPlayback(s.currentTrack.id, s.positionS)
            audio.play().catch(() => {})
          } else if (loadingTrackId === s.currentTrack.id) {
            return
          } else {
            sourceRequest += 1
            void recordPlayback(s.currentTrack.id, s.positionS)
            void setAudioSource(s.currentTrack, s.positionS, sourceRequest)
          }
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
        artist: "HH Haladhara Svāmī Mahārāja",
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
