"use client"

import { ArrowRight, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { DayPicker, type DateRange } from "react-day-picker"

type UploadRange = { from: string; to: string }

function calendarDate(value: string) {
    if (!value) return undefined
    const date = new Date(`${value}T12:00:00.000Z`)
    return Number.isNaN(date.getTime()) ? undefined : date
}

function dateLabel(value: string) {
    const date = calendarDate(value)
    return date ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(date) : "Choose date"
}

export function UploadDateRangePicker({ from, to, disabled, onChange }: UploadRange & {
    disabled: boolean
    onChange: (range: UploadRange) => void
}) {
    const [open, setOpen] = useState(false)
    const [draft, setDraft] = useState<DateRange | undefined>()
    const dialogRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLElement | null>(null)

    useEffect(() => {
        if (!open) return
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = "hidden"
        function onKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                event.preventDefault()
                setOpen(false)
            }
            if (event.key !== "Tab") return
            const controls = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), select:not([disabled]), [tabindex="0"]') ?? []).filter((element) => element.tabIndex >= 0)
            const first = controls[0]
            const last = controls[controls.length - 1]
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault()
                last?.focus()
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault()
                first?.focus()
            }
        }
        document.addEventListener("keydown", onKeyDown)
        return () => {
            document.body.style.overflow = previousOverflow
            document.removeEventListener("keydown", onKeyDown)
            triggerRef.current?.focus()
        }
    }, [open])

    function openCalendar(event: React.MouseEvent<HTMLButtonElement>) {
        triggerRef.current = event.currentTarget
        setDraft({ from: calendarDate(from), to: calendarDate(to) })
        setOpen(true)
    }

    function recentRange(days: number) {
        const now = new Date()
        const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12))
        const start = new Date(end)
        start.setUTCDate(start.getUTCDate() - days + 1)
        setDraft({ from: start, to: end })
    }

    return (
        <>
            <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                {([{ label: "From", value: from }, { label: "To", value: to }] as const).map(({ label, value }) => (
                    <button key={label} type="button" disabled={disabled} onClick={openCalendar} aria-label={`Choose ${label} date`} aria-haspopup="dialog" aria-expanded={open} className="admin-date-trigger flex min-h-16 min-w-0 items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-left disabled:opacity-50">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--accent)]/10 text-[var(--accent)]"><CalendarDays size={18} /></span>
                        <span className="min-w-0 flex-1"><span className="block text-[11px] text-[var(--muted)]">{label}</span><span className="block text-sm font-semibold text-[var(--foreground)]">{dateLabel(value)}</span></span>
                        <ChevronDown size={15} className="shrink-0 text-[var(--muted)]" />
                    </button>
                ))}
                <button type="button" disabled={disabled || (!from && !to)} onClick={() => onChange({ from: "", to: "" })} aria-label="Clear date range" title="Clear date range" className="flex h-11 w-11 items-center justify-center self-center rounded-md text-[var(--muted)] hover:bg-[var(--admin-hover)] disabled:opacity-40"><X size={16} /></button>
            </div>
            {open && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-3 py-4" role="dialog" aria-modal="true" aria-labelledby="upload-calendar-title">
                    <div className="absolute inset-0 bg-black/45" onClick={() => setOpen(false)} aria-hidden="true" />
                    <div ref={dialogRef} className="relative max-h-[calc(100dvh-2rem)] w-full min-w-0 max-w-sm overflow-y-auto overscroll-contain rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 shadow-xl sm:p-5">
                        <div className="mb-3 flex items-center justify-between gap-2">
                            <div><h2 id="upload-calendar-title" className="text-base font-semibold text-[var(--foreground)]">Upload dates</h2><p className="text-xs text-[var(--muted)]">Inclusive range · UTC</p></div>
                            <button type="button" onClick={() => setOpen(false)} aria-label="Close date picker" title="Close date picker" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-[var(--muted)] hover:bg-[var(--admin-hover)]"><X size={18} /></button>
                        </div>
                        <div className="mb-4 grid grid-cols-2 gap-2">
                            <button type="button" onClick={() => recentRange(7)} className="admin-input px-2 py-2 text-xs font-medium">Last 7 days</button>
                            <button type="button" onClick={() => recentRange(30)} className="admin-input px-2 py-2 text-xs font-medium">Last 30 days</button>
                        </div>
                        <div className="flex justify-center">
                            <DayPicker className="admin-calendar" mode="range" timeZone="UTC" selected={draft} onSelect={setDraft} defaultMonth={draft?.from ?? draft?.to} captionLayout="dropdown" navLayout="after" showOutsideDays fixedWeeks autoFocus components={{ Chevron: ({ orientation }) => orientation === "left" ? <ChevronLeft size={18} /> : orientation === "right" ? <ChevronRight size={18} /> : <ChevronDown size={18} /> }} />
                        </div>
                        <div className="mt-4 flex items-center justify-center gap-2 border-t border-[var(--border)] pt-3 text-xs text-[var(--muted)]">
                            <span>{draft?.from ? dateLabel(draft.from.toISOString().slice(0, 10)) : "From"}</span><ArrowRight size={13} /><span>{draft?.to ? dateLabel(draft.to.toISOString().slice(0, 10)) : "To"}</span>
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                            <button type="button" onClick={() => setOpen(false)} className="admin-input px-3 py-2 text-sm">Cancel</button>
                            <button type="button" disabled={!draft?.from || !draft?.to} onClick={() => {
                                if (!draft?.from || !draft.to) return
                                onChange({ from: draft.from.toISOString().slice(0, 10), to: draft.to.toISOString().slice(0, 10) })
                                setOpen(false)
                            }} className="btn-accent px-3 py-2 text-sm font-semibold disabled:opacity-40">Apply range</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
