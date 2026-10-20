"use client"

import { NotebookOverlay } from "@/components/player/NotebookOverlay"
import { ThemeToggle } from "@/components/ThemeToggle"
import { LectureThumbnail } from "@/components/LectureThumbnail"
import { usePlayerStore, type Track } from "@/store/playerStore"
import {
  closestCenter,
  DndContext,
  PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { AnimatePresence, motion } from "framer-motion"
import {
  ChevronDown,
  GripVertical,
  Headphones,
  ListMusic, Moon,
  Pause,
  Play,
  PlayCircle,
  RotateCcw, RotateCw,
  Share2,
  SkipBack, SkipForward,
  Volume1, Volume2, VolumeX,
  X,
} from "lucide-react"
import { useSession } from "next-auth/react"
import { useEffect, useRef, useState, type CSSProperties } from "react"

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2]
const SLEEP_OPTIONS = [15, 30, 45, 60]

export function FullScreenPlayer() {
  const {
    currentTrack, isPlaying, positionS, duration: liveDuration, speed, volume, queue, sleepTimerEnd, trackProgress,
    pause, resume, seek, setSpeed, setVolume, playNext,
    closeFullScreen, isFullScreen,
    reorderQueue, removeFromQueue, setSleepTimer,
  } = usePlayerStore()
  const duration =
    liveDuration ||
    (currentTrack ? trackProgress[currentTrack.id]?.duration || currentTrack.duration || 0 : 0)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [showQueue, setShowQueue] = useState(false)
  const [showSleep, setShowSleep] = useState(false)
  const [view, setView] = useState<"player" | "notes">("player")
  const [shareLabel, setShareLabel] = useState("Share")
  const [now, setNow] = useState(() => Date.now())
  const { data: session } = useSession()
  const sensors = useSensors(useSensor(PointerSensor))

  const remaining = sleepTimerEnd ? Math.max(0, Math.ceil((sleepTimerEnd - now) / 60_000)) : null
  const seekPct = duration > 0 ? Math.min(100, (positionS / duration) * 100) : 0
  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2
  const isAudio = currentTrack?.mediaType === "AUDIO"
  const TypeIcon = isAudio ? Headphones : PlayCircle

  useEffect(() => {
    if (!isFullScreen || !sleepTimerEnd) return
    const timer = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(timer)
  }, [isFullScreen, sleepTimerEnd])

  // Animated waveform canvas (gold bars on the navy artwork card)
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

      const bars = 40
      const totalW = cv.offsetWidth
      const barW = totalW / (bars * 2.2)
      const cy = cv.offsetHeight / 2

      for (let i = 0; i < bars; i++) {
        const x = (i / bars) * totalW + barW / 2
        // fade bars toward the centre so the artwork medallion stays readable
        const centreFade = Math.min(1, Math.abs(i - bars / 2) / (bars * 0.18))
        const amp = isPlaying
          ? (Math.sin(i * 0.5 + phase) * 0.4 + 0.6) * cy * 0.7
          : cy * 0.08
        const alpha = (0.3 + Math.sin(i * 0.4 + phase) * 0.2) * (0.35 + centreFade * 0.65)
        ctx.fillStyle = `rgba(233, 201, 119, ${alpha.toFixed(3)})`
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

  async function shareTrack() {
    if (!currentTrack) return
    const path = currentTrack.mediaType === "AUDIO" ? "audio" : "video"
    const url = new URL(`/${path}/playlist/${currentTrack.playlistId ?? ""}`, window.location.origin)
    url.searchParams.set(currentTrack.mediaType === "AUDIO" ? "lecture" : "video", currentTrack.id)
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
    if (!isFinite(s) || s < 0) return "–:––"
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = Math.floor(s % 60).toString().padStart(2, "0")
    return h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${sec}` : `${m}:${sec}`
  }

  return (
    <AnimatePresence>
      {isFullScreen && currentTrack && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 280 }}
          className="fsp fixed inset-0 z-50 flex flex-col overflow-hidden"
          data-playing={isPlaying ? "true" : undefined}
        >
          <div className="fsp-bg" aria-hidden="true" />

          {/* Header */}
          <div className="relative flex items-center justify-between px-5 pb-3 pt-10 sm:pt-8">
            <button onClick={closeFullScreen} aria-label="Close player" className="fsp-icon-btn">
              <ChevronDown size={22} />
            </button>
            {session ? (
              <div className="fsp-segment" role="tablist" aria-label="Player view">
                {(["player", "notes"] as const).map((v) => (
                  <button
                    key={v}
                    role="tab"
                    onClick={() => setView(v)}
                    aria-selected={view === v}
                    data-active={view === v ? "true" : undefined}
                    className="fsp-segment-btn px-4 py-1 text-[11px] uppercase tracking-[0.16em]"
                  >
                    {v === "player" ? "Player" : "Notes"}
                  </button>
                ))}
              </div>
            ) : (
              <p className="fsp-eyebrow">
                <span className="fsp-eyebrow-dot" aria-hidden="true" />
                Now Playing
              </p>
            )}
            <ThemeToggle className="fsp-icon-btn" />
          </div>

          <div
            className="relative flex flex-1 flex-col overflow-y-auto pb-8"
            style={{ display: view === "player" ? "flex" : "none" }}
          >
            {/* Artwork */}
            <div className="mx-auto w-full max-w-md px-6 pt-2">
              <div className="fsp-art">
                <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
                <div className="fsp-art-glow" aria-hidden="true" />
                <div className="fsp-medallion">
                  <LectureThumbnail src={currentTrack.thumbnail} alt="" className="h-full w-full object-cover" />
                </div>
                <span className="fsp-art-badge">
                  <TypeIcon size={11} />
                  {isAudio ? "Audio lecture" : "Video lecture"}
                </span>
              </div>
            </div>

            {/* Track info */}
            <div className="mx-auto w-full max-w-md px-6 pt-6 text-center">
              <h2 className="fsp-title line-clamp-2">{currentTrack.title}</h2>
              <p className="fsp-subtitle font-iast">HH Haladhara Svāmī Mahārāja</p>
            </div>

            {/* Scrubber */}
            <div className="mx-auto w-full max-w-md px-6 pt-6">
              <input
                type="range"
                min={0}
                max={duration || 1}
                step={1}
                value={positionS}
                onChange={(e) => seek(Number(e.target.value))}
                className="fsp-range fsp-range-lg"
                style={{ "--pct": `${seekPct}%` } as CSSProperties}
                aria-label="Seek"
              />
              <div className="mt-1.5 flex justify-between text-[11px] font-medium tabular-nums">
                <span className="fsp-time">{formatTime(positionS)}</span>
                <span className="fsp-time-muted">-{formatTime(duration - positionS)}</span>
              </div>
            </div>

            {/* Main controls */}
            <div className="mx-auto flex w-full max-w-md items-center justify-between px-6 py-4">
              <button
                onClick={() => seek(Math.max(0, positionS - 30))}
                className="fsp-ctrl fsp-skip"
                aria-label="Back 30s"
              >
                <RotateCcw size={20} strokeWidth={2.2} />
                <span>30</span>
              </button>

              <button className="fsp-ctrl" onClick={() => seek(0)} aria-label="Previous">
                <SkipBack size={24} fill="currentColor" />
              </button>

              <button
                onClick={() => (isPlaying ? pause() : resume())}
                className="fsp-play"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause size={30} fill="currentColor" /> : <Play size={30} fill="currentColor" className="ml-1" />}
              </button>

              <button onClick={playNext} className="fsp-ctrl" aria-label="Next">
                <SkipForward size={24} fill="currentColor" />
              </button>

              <button
                onClick={() => seek(Math.min(duration, positionS + 30))}
                className="fsp-ctrl fsp-skip"
                aria-label="Forward 30s"
              >
                <RotateCw size={20} strokeWidth={2.2} />
                <span>30</span>
              </button>
            </div>

            {/* Speed + Volume + actions */}
            <div className="mx-auto w-full max-w-md space-y-4 px-6">
              <div className="fsp-panel">
                <div className="flex items-center gap-3">
                  <span className="fsp-label">Speed</span>
                  <div className="fsp-segment flex-1 justify-between">
                    {SPEEDS.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSpeed(s)}
                        aria-pressed={speed === s}
                        data-active={speed === s ? "true" : undefined}
                        className="fsp-segment-btn flex-1 px-1 py-1 text-xs tabular-nums"
                      >
                        {s}×
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-3.5 flex items-center gap-3">
                  <button
                    onClick={() => setVolume(volume === 0 ? 1 : 0)}
                    aria-label={volume === 0 ? "Unmute" : "Mute"}
                    className="fsp-label flex items-center"
                  >
                    <VolumeIcon size={16} />
                  </button>
                  <input
                    type="range" min={0} max={1} step={0.05}
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="fsp-range flex-1"
                    style={{ "--pct": `${volume * 100}%` } as CSSProperties}
                    aria-label="Volume"
                  />
                  <span className="fsp-time-muted w-8 text-right text-[11px] tabular-nums">{Math.round(volume * 100)}</span>
                </div>
              </div>

              {/* Sleep timer + Queue + Share */}
              <div className="flex flex-wrap justify-center gap-2">
                <div className="relative">
                  <button
                    onClick={() => { setShowSleep((v) => !v); setShowQueue(false) }}
                    className="fsp-chip"
                    data-active={remaining || showSleep ? "true" : undefined}
                    aria-expanded={showSleep}
                  >
                    <Moon size={14} />
                    {remaining ? `${remaining}m left` : "Sleep"}
                  </button>
                  <AnimatePresence>
                    {showSleep && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.96 }}
                        transition={{ duration: 0.16 }}
                        className="fsp-popover absolute bottom-full left-1/2 mb-2 flex -translate-x-1/2 gap-1"
                      >
                        {SLEEP_OPTIONS.map((m) => (
                          <button
                            key={m}
                            onClick={() => { setSleepTimer(m); setShowSleep(false) }}
                            className="fsp-popover-btn"
                          >
                            {m}m
                          </button>
                        ))}
                        {remaining && (
                          <button
                            onClick={() => { setSleepTimer(null); setShowSleep(false) }}
                            className="fsp-popover-btn text-red-500"
                          >
                            Off
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  onClick={() => { setShowQueue((v) => !v); setShowSleep(false) }}
                  className="fsp-chip"
                  data-active={showQueue ? "true" : undefined}
                  aria-expanded={showQueue}
                >
                  <ListMusic size={14} />
                  Queue
                  {queue.length > 0 && <span className="fsp-chip-count">{queue.length}</span>}
                </button>

                <button onClick={shareTrack} className="fsp-chip">
                  <Share2 size={14} /> {shareLabel}
                </button>
              </div>

              {/* Queue panel (dnd-kit) */}
              <AnimatePresence initial={false}>
                {showQueue && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="fsp-panel max-h-56 overflow-y-auto !p-2">
                      <p className="fsp-label px-2 pb-1.5 pt-1">Up next</p>
                      {queue.length === 0 ? (
                        <p className="fsp-time-muted py-4 text-center text-xs">Queue is empty</p>
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
                            {queue.map((track, i) => (
                              <SortableQueueItem
                                key={track.id}
                                index={i + 1}
                                track={track}
                                onRemove={() => removeFromQueue(track.id)}
                              />
                            ))}
                          </SortableContext>
                        </DndContext>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {session && (
            <div
              className="relative flex-1 overflow-hidden"
              style={{ display: view === "notes" ? "block" : "none" }}
            >
              <NotebookOverlay
                lectureId={currentTrack.id}
                lectureTitle={currentTrack.title}
                positionS={positionS}
              />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}


function SortableQueueItem({ track, index, onRemove }: { track: Track; index: number; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: track.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="fsp-queue-item"
    >
      <span {...attributes} {...listeners} className="fsp-time-muted cursor-grab" aria-label="Drag to reorder">
        <GripVertical size={14} />
      </span>
      <span className="fsp-queue-index">{index}</span>
      <p className="flex-1 truncate text-xs font-medium">{track.title}</p>
      <button onClick={onRemove} aria-label={`Remove ${track.title} from queue`} className="fsp-time-muted shrink-0 rounded-full p-1 hover:text-red-500">
        <X size={13} />
      </button>
    </div>
  )
}
