"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useSession } from "next-auth/react"
import {
  X, Play, Pause, SkipBack, SkipForward,
  RotateCcw, RotateCw,
  ListMusic, Moon, Volume2, NotebookPen, Share2,
} from "lucide-react"
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext, verticalListSortingStrategy, useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { usePlayerStore, type Track } from "@/store/playerStore"

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2]
const SLEEP_OPTIONS = [15, 30, 45, 60]

export function FullScreenPlayer() {
  const {
    currentTrack, isPlaying, positionS, duration, speed, volume, queue, sleepTimerEnd,
    pause, resume, seek, setSpeed, setVolume, playNext,
    closeFullScreen, isFullScreen,
    reorderQueue, removeFromQueue, setSleepTimer,
  } = usePlayerStore()

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [showQueue, setShowQueue] = useState(false)
  const [showSleep, setShowSleep] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [noteText, setNoteText] = useState("")
  const [notes, setNotes] = useState<Array<{ id: string; content: string; timestampS: number }>>([])
  const [noteSaving, setNoteSaving] = useState(false)
  const [shareLabel, setShareLabel] = useState("Share")
  const [now, setNow] = useState(() => Date.now())
  const { data: session } = useSession()
  const sensors = useSensors(useSensor(PointerSensor))

  const remaining = sleepTimerEnd ? Math.max(0, Math.ceil((sleepTimerEnd - now) / 60_000)) : null

  useEffect(() => {
    if (!isFullScreen || !sleepTimerEnd) return
    const timer = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(timer)
  }, [isFullScreen, sleepTimerEnd])

  // Animated waveform canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!
    let animId: number
    let phase = 0
    // capture as non-null so TypeScript preserves the type inside draw()
    const cv: HTMLCanvasElement = canvas

    function draw() {
      const { isPlaying } = usePlayerStore.getState()
      cv.width = cv.offsetWidth * window.devicePixelRatio
      cv.height = cv.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
      ctx.clearRect(0, 0, cv.offsetWidth, cv.offsetHeight)

      const bars = 36
      const totalW = cv.offsetWidth
      const barW = totalW / (bars * 2.2)
      const cy = cv.offsetHeight / 2

      for (let i = 0; i < bars; i++) {
        const x = (i / bars) * totalW + barW / 2
        const amp = isPlaying
          ? (Math.sin(i * 0.5 + phase) * 0.4 + 0.6) * cy * 0.75
          : cy * 0.06
        const alpha = 0.35 + Math.sin(i * 0.4 + phase) * 0.25
        ctx.fillStyle = `rgba(74,93,143,${alpha})`
        ctx.beginPath()
        ctx.roundRect(x, cy - amp, barW, amp * 2, barW / 2)
        ctx.fill()
      }
      if (isPlaying) phase += 0.05
      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animId)
  }, [isFullScreen])

  useEffect(() => {
    if (!showNotes || !currentTrack || !session) return
    fetch(`/api/notes?lectureId=${encodeURIComponent(currentTrack.id)}`)
      .then((response) => response.ok ? response.json() : [])
      .then((data: Array<{ id: string; content: string; timestampS: number }>) => setNotes(data))
      .catch(() => setNotes([]))
  }, [showNotes, currentTrack, session])

  async function saveNote() {
    if (!currentTrack || !session) return
    if (!noteText.trim()) return
    setNoteSaving(true)
    const response = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lectureId: currentTrack.id, content: noteText, timestampS: positionS }),
    })
    if (response.ok) {
      const note = await response.json() as { id: string; content: string; timestampS: number }
      setNotes((currentNotes) => [note, ...currentNotes])
      setNoteText("")
    }
    setNoteSaving(false)
  }

  async function shareTrack() {
    if (!currentTrack) return
    const path = currentTrack.mediaType === "AUDIO" ? "audio" : "video"
    const url = new URL(`/${path}/playlist/${currentTrack.playlistId ?? ""}`, window.location.origin)
    url.searchParams.set("lectureId", currentTrack.id)
    url.searchParams.set("t", String(Math.floor(positionS)))
    const shareData = { title: currentTrack.title, url: url.toString() }
    const canShare = "share" in navigator

    try {
      if (canShare) await navigator.share(shareData)
      else await navigator.clipboard.writeText(url.toString())
      setShareLabel(canShare ? "Shared" : "Link copied")
      setTimeout(() => setShareLabel("Share"), 1500)
    } catch {
      // Sharing can be cancelled by the user.
    }
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const from = queue.findIndex((t) => t.id === active.id)
    const to = queue.findIndex((t) => t.id === over.id)
    reorderQueue(from, to)
  }

  function formatTime(s: number) {
    if (!isFinite(s)) return "–:––"
    const m = Math.floor(s / 60)
    return `${m}:${Math.floor(s % 60).toString().padStart(2, "0")}`
  }

  return (
    <AnimatePresence>
      {isFullScreen && currentTrack && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 280 }}
          className="fixed inset-0 z-50 flex flex-col overflow-hidden"
          style={{ background: "linear-gradient(180deg, #1a1a3e 0%, #0d0d22 100%)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-12 pb-4">
            <button onClick={closeFullScreen} aria-label="Close player">
              <X size={24} className="text-white/70" />
            </button>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
              Now Playing
            </p>
            <div className="w-6" />
          </div>

          {/* Waveform canvas */}
          <div className="mx-auto w-full max-w-sm px-6">
            <div
              className="relative flex h-40 items-center justify-center overflow-hidden rounded-2xl"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
              <span className="relative z-10 text-5xl select-none">
                {currentTrack.mediaType === "AUDIO" ? "🎙️" : "🎬"}
              </span>
            </div>
          </div>

          {/* Track info */}
          <div className="px-6 pt-5 text-center">
            <h2 className="text-lg font-bold text-white leading-tight line-clamp-2">
              {currentTrack.title}
            </h2>
            <p className="font-iast mt-1 text-sm text-white/50">HH Haladhara Svāmī Mahārāja</p>
          </div>

          {/* Scrubber */}
          <div className="mx-auto w-full max-w-sm px-6 pt-5">
            <input
              type="range"
              min={0}
              max={duration || 1}
              step={1}
              value={positionS}
              onChange={(e) => seek(Number(e.target.value))}
              className="w-full accent-[var(--accent)]"
              aria-label="Seek"
            />
            <div className="flex justify-between text-[11px] text-white/40">
              <span>{formatTime(positionS)}</span>
              <span>-{formatTime(duration - positionS)}</span>
            </div>
          </div>

          {/* Main controls */}
          <div className="mx-auto flex w-full max-w-sm items-center justify-between px-6 py-3">
            <button
              onClick={() => seek(Math.max(0, positionS - 30))}
              className="flex flex-col items-center gap-0.5 text-white/60"
              aria-label="Back 30s"
            >
              <RotateCcw size={22} strokeWidth={2.5} />
              <span className="text-[9px]">30</span>
            </button>

            <button
              className="flex h-10 w-10 items-center justify-center rounded-full text-white/60"
              onClick={() => seek(0)}
              aria-label="Previous"
            >
              <SkipBack size={26} fill="currentColor" />
            </button>

            <button
              onClick={() => (isPlaying ? pause() : resume())}
              className="flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg transition-opacity hover:opacity-90"
              style={{ background: "var(--accent)" }}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
            </button>

            <button
              onClick={playNext}
              className="flex h-10 w-10 items-center justify-center rounded-full text-white/60"
              aria-label="Next"
            >
              <SkipForward size={26} fill="currentColor" />
            </button>

            <button
              onClick={() => seek(Math.min(duration, positionS + 30))}
              className="flex flex-col items-center gap-0.5 text-white/60"
              aria-label="Forward 30s"
            >
              <RotateCw size={22} strokeWidth={2.5} />
              <span className="text-[9px]">30</span>
            </button>
          </div>

          {/* Speed + Sleep + Queue + Volume */}
          <div className="mx-auto w-full max-w-sm px-6 pb-4 space-y-3">
            {/* Speed */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-white/40 w-10">Speed</span>
              <div className="flex gap-1.5 flex-wrap">
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className="rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors"
                    style={
                      speed === s
                        ? { background: "var(--accent)", color: "var(--accent-fg)" }
                        : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }
                    }
                  >
                    {s}×
                  </button>
                ))}
              </div>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <Volume2 size={14} className="text-white/40 w-10 shrink-0" />
              <input
                type="range" min={0} max={1} step={0.05}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="flex-1 accent-[var(--accent)]"
                aria-label="Volume"
              />
            </div>

            {/* Sleep timer + Queue row */}
            <div className="flex gap-2">
              <div className="relative">
                <button
                  onClick={() => { setShowSleep((v) => !v); setShowQueue(false) }}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
                  style={
                    remaining
                      ? { background: "rgba(255,215,0,0.15)", color: "#FFD700" }
                      : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }
                  }
                >
                  <Moon size={14} />
                  {remaining ? `${remaining}m` : "Sleep"}
                </button>
                {showSleep && (
                  <div
                    className="absolute bottom-full left-0 mb-2 flex gap-1.5 rounded-xl p-2 shadow-xl"
                    style={{ background: "#2d2d5e" }}
                  >
                    {SLEEP_OPTIONS.map((m) => (
                      <button
                        key={m}
                        onClick={() => { setSleepTimer(m); setShowSleep(false) }}
                        className="rounded-lg px-2.5 py-1 text-xs text-white/70 hover:bg-white/10"
                      >
                        {m}m
                      </button>
                    ))}
                    {remaining && (
                      <button
                        onClick={() => { setSleepTimer(null); setShowSleep(false) }}
                        className="rounded-lg px-2 py-1 text-xs text-red-400 hover:bg-white/10"
                      >
                        Off
                      </button>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={() => { setShowQueue((v) => !v); setShowSleep(false) }}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
                style={
                  showQueue
                    ? { background: "rgba(74,93,143,0.24)", color: "#9FB2E8" }
                    : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }
                }
              >
                <ListMusic size={14} />
                Queue {queue.length > 0 && `(${queue.length})`}
              </button>

              <button
                onClick={shareTrack}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-white/60 transition-colors hover:text-white"
              >
                <Share2 size={14} /> {shareLabel}
              </button>

              <button
                onClick={() => { setShowNotes((value) => !value); setShowQueue(false); setShowSleep(false) }}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-white/60 transition-colors hover:text-white"
                aria-expanded={showNotes}
              >
                <NotebookPen size={14} /> Notes
              </button>
            </div>

            {/* Queue panel (dnd-kit) */}
            {showQueue && (
              <div
                className="max-h-48 overflow-y-auto rounded-xl p-2"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                {queue.length === 0 ? (
                  <p className="py-3 text-center text-xs text-white/30">Queue is empty</p>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={queue.map((t) => t.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {queue.map((track) => (
                        <SortableQueueItem
                          key={track.id}
                          track={track}
                          onRemove={() => removeFromQueue(track.id)}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            )}
          </div>

          {showNotes && (
            <aside className="fixed inset-x-3 bottom-3 z-10 max-h-[42vh] overflow-y-auto rounded-xl border border-white/10 bg-[#20203f] p-3 text-white/80 shadow-2xl md:inset-x-auto md:right-6 md:top-20 md:bottom-6 md:w-96 md:max-h-none">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Lecture notes</h3>
                  <p className="mt-0.5 text-[10px] text-white/40">Capture ideas as you listen.</p>
                </div>
                <span className="text-[10px] text-white/40">{notes.length} saved</span>
              </div>

              <div className="grid gap-3 md:grid-cols-1">
                <div>
                  <textarea
                    value={noteText}
                    onChange={(event) => setNoteText(event.target.value)}
                    placeholder="Write an essential point..."
                    className="min-h-28 w-full resize-y rounded-lg border border-white/10 bg-black/10 px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-white/30"
                  />
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-white/40">Timestamp: {formatTime(positionS)}</span>
                    <button
                      onClick={saveNote}
                      disabled={noteSaving || !noteText.trim()}
                      className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-fg)] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {noteSaving ? "Saving..." : "Save note"}
                    </button>
                  </div>
                </div>

                <div className="max-h-56 overflow-y-auto rounded-lg border border-white/10 bg-black/10 p-2">
                    {notes.length === 0 ? (
                    <p className="p-2 text-xs text-white/40">Your saved notes will appear here.</p>
                  ) : (
                    <div className="space-y-2">
                      {notes.map((note) => (
                        <div key={note.id} className="rounded-md bg-white/[0.06] p-2">
                          <div className="mb-1 text-[10px] font-semibold text-[var(--gold)]">{formatTime(note.timestampS)}</div>
                          <p className="text-xs leading-5 text-white/70">{note.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </aside>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function SortableQueueItem({ track, onRemove }: { track: Track; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: track.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-white/5"
    >
      <span {...attributes} {...listeners} className="cursor-grab text-white/30 px-1 text-sm">
        ⠿
      </span>
      <p className="flex-1 truncate text-xs text-white/70">{track.title}</p>
      <button onClick={onRemove} className="shrink-0 text-white/30 hover:text-white/70">
        <X size={12} />
      </button>
    </div>
  )
}
