"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Bold, Underline, Highlighter, Eraser, PenLine, Type, Undo2, Trash2 } from "lucide-react"

export const PEN_COLORS = [
  { name: "Gold", value: "#FFD700" },
  { name: "Leaf", value: "#34D399" },
  { name: "Blossom", value: "#F472B6" },
  { name: "Sky", value: "#60A5FA" },
  { name: "Black", value: "#1a1a2e" },
  { name: "Navy", value: "#1E3A8A" },
  { name: "Red", value: "#DC2626" },
] as const

type Mode = "type" | "draw"

export function NotebookEditor({
  initialContent = "",
  initialColor = PEN_COLORS[0].value,
  initialDrawing = null,
  timestampLabel,
  onTimestampChange,
  onSave,
  onCancel,
  saving,
  className = "",
}: {
  initialContent?: string
  initialColor?: string
  initialDrawing?: string | null
  timestampLabel: string
  onTimestampChange?: (value: string) => void
  onSave: (payload: { content: string; color: string; drawing: string | null }) => void
  onCancel?: () => void
  saving?: boolean
  className?: string
}) {
  const [mode, setMode] = useState<Mode>("type")
  const [penColor, setPenColor] = useState(initialColor)
  const editorRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef<string | null>(initialDrawing)
  const historyRef = useRef<string[]>([])
  const drawingState = useRef({ active: false })

  // Pen-nib cursor tinted to the active color, tip aligned to the hotspot (7,21) so it points at the exact draw position.
  const penCursor = useMemo(() => {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'>`
      + `<line x1='23' y1='5' x2='9' y2='19' stroke='white' stroke-width='7' stroke-linecap='round'/>`
      + `<line x1='23' y1='5' x2='9' y2='19' stroke='${penColor}' stroke-width='4.5' stroke-linecap='round'/>`
      + `<circle cx='7' cy='21' r='2.8' fill='${penColor}' stroke='white' stroke-width='1.2'/>`
      + `</svg>`
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 7 21, crosshair`
  }, [penColor])

  // (Re)sizes the canvas backing store to match its current on-screen size and
  // restores the last snapshot. Needed because an ancestor pane (e.g. the
  // player's Player/Notes tab) may render this with display:none at mount time,
  // when offsetWidth/offsetHeight are still 0 — a plain mount-only effect would
  // permanently leave the canvas with a 0x0 drawing buffer in that case.
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    const width = canvas.offsetWidth
    const height = canvas.offsetHeight
    if (width === 0 || height === 0) return
    const snapshot = drawingRef.current
    canvas.width = width * 2
    canvas.height = height * 2
    ctx.scale(2, 2)
    if (snapshot) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0, width, height)
      img.src = snapshot
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    resizeCanvas()
    const observer = new ResizeObserver(() => resizeCanvas())
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [resizeCanvas])

  function format(command: "bold" | "underline" | "hiliteColor" | "removeFormat", value?: string) {
    editorRef.current?.focus()
    document.execCommand(command, false, value)
  }

  function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    // Only accept plain text from the clipboard — blocks pasted markup/scripts.
    e.preventDefault()
    const text = e.clipboardData.getData("text/plain")
    document.execCommand("insertText", false, text)
  }

  function pointerPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function pushHistory() {
    const canvas = canvasRef.current
    if (!canvas) return
    historyRef.current.push(canvas.toDataURL("image/png"))
    if (historyRef.current.length > 20) historyRef.current.shift()
  }

  function startDraw(e: React.PointerEvent<HTMLCanvasElement>) {
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx) return
    e.currentTarget.setPointerCapture(e.pointerId)
    pushHistory()
    drawingState.current.active = true
    const { x, y } = pointerPos(e)
    ctx.strokeStyle = penColor
    ctx.fillStyle = penColor
    ctx.lineWidth = 3
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.beginPath()
    ctx.moveTo(x, y)
    // leave a visible dot immediately, so a simple tap/click still marks the page
    ctx.arc(x, y, 1.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  function moveDraw(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingState.current.active) return
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx) return
    const { x, y } = pointerPos(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  function endDraw() {
    if (!drawingState.current.active) return
    drawingState.current.active = false
    const canvas = canvasRef.current
    if (canvas) drawingRef.current = canvas.toDataURL("image/png")
  }

  function undoDraw() {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    const previous = historyRef.current.pop()
    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)
    if (previous) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.offsetWidth, canvas.offsetHeight)
      img.src = previous
    }
    drawingRef.current = previous ?? null
  }

  function clearDraw() {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    pushHistory()
    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)
    drawingRef.current = null
  }

  function canvasHasInk() {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return false
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
    for (let i = 3; i < data.length; i += 4) if (data[i] !== 0) return true
    return false
  }

  function handleSave() {
    const content = editorRef.current?.innerHTML ?? ""
    const drawing = canvasHasInk() ? (canvasRef.current?.toDataURL("image/png") ?? null) : null
    onSave({ content, color: penColor, drawing })
  }

  return (
    <div className={`notebook-shadow flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] bg-[var(--surface)] px-3 py-2">
        <div className="flex rounded-lg border border-[var(--border)] p-0.5">
          <button
            onClick={() => setMode("type")}
            aria-pressed={mode === "type"}
            className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
            style={mode === "type" ? { background: "var(--accent)", color: "var(--accent-fg)" } : { color: "var(--muted)" }}
          >
            <Type size={13} /> Type
          </button>
          <button
            onClick={() => setMode("draw")}
            aria-pressed={mode === "draw"}
            className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
            style={mode === "draw" ? { background: "var(--accent)", color: "var(--accent-fg)" } : { color: "var(--muted)" }}
          >
            <PenLine size={13} /> Draw
          </button>
        </div>

        {mode === "type" ? (
          <div className="flex items-center gap-1">
            <button onClick={() => format("bold")} aria-label="Bold" className="icon-btn p-1.5">
              <Bold size={15} />
            </button>
            <button onClick={() => format("underline")} aria-label="Underline" className="icon-btn p-1.5">
              <Underline size={15} />
            </button>
            <button onClick={() => format("hiliteColor", penColor)} aria-label="Highlight selection" className="icon-btn p-1.5">
              <Highlighter size={15} />
            </button>
            <button onClick={() => format("removeFormat")} aria-label="Clear formatting" className="icon-btn p-1.5">
              <Eraser size={15} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <button onClick={undoDraw} aria-label="Undo stroke" className="icon-btn p-1.5">
              <Undo2 size={15} />
            </button>
            <button onClick={clearDraw} aria-label="Clear drawing" className="icon-btn p-1.5">
              <Trash2 size={15} />
            </button>
          </div>
        )}

        <div className="flex items-center gap-1.5 pl-1">
          {PEN_COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => setPenColor(c.value)}
              aria-label={`${c.name} pen`}
              aria-pressed={penColor === c.value}
              className="h-5 w-5 rounded-full ring-offset-2 ring-offset-[var(--surface)] transition-transform"
              style={{
                background: c.value,
                boxShadow: penColor === c.value ? `0 0 0 2px var(--surface), 0 0 0 4px ${c.value}` : "none",
                transform: penColor === c.value ? "scale(1.1)" : "scale(1)",
              }}
            />
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1.5 text-xs text-[var(--muted)]">
          <span>Timestamp</span>
          <input
            value={timestampLabel}
            onChange={(e) => onTimestampChange?.(e.target.value)}
            disabled={!onTimestampChange}
            className="w-14 rounded border border-[var(--border)] bg-transparent px-1.5 py-0.5 text-center text-xs text-[var(--foreground)] outline-none disabled:opacity-70"
          />
        </div>
      </div>

      {/* Paper surface — min-height so the absolutely-positioned canvas always gets a real size, grows to fill available space */}
      <div className="notebook-paper relative min-h-56 flex-1">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onPaste={handlePaste}
          data-placeholder="Write an essential point…"
          className="notebook-editable relative z-10 h-full overflow-y-auto px-10 py-6 text-sm leading-8 text-[var(--foreground)] outline-none"
          style={{ display: mode === "type" ? "block" : "none" }}
          dangerouslySetInnerHTML={{ __html: initialContent }}
        />
        <canvas
          ref={canvasRef}
          onPointerDown={startDraw}
          onPointerMove={moveDraw}
          onPointerUp={endDraw}
          onPointerCancel={endDraw}
          className="absolute inset-0 z-20 h-full w-full touch-none"
          style={{ pointerEvents: mode === "draw" ? "auto" : "none", cursor: mode === "draw" ? penCursor : "default" }}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 border-t border-[var(--border)] bg-[var(--surface)] px-3 py-2">
        {onCancel && (
          <button onClick={onCancel} className="rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--muted)] hover:text-[var(--foreground)]">
            Cancel
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-accent px-4 py-1.5 text-xs disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save note"}
        </button>
      </div>
    </div>
  )
}
