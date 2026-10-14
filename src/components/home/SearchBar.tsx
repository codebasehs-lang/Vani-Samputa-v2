"use client"

import { useState, useRef, useEffect } from "react"
import { ArrowRight, ArrowUpRight, Headphones, ListMusic, LoaderCircle, PlayCircle, Search, SearchX, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { usePlayerStore } from "@/store/playerStore"

const MIN_QUERY_LENGTH = 2

type Result = {
  id: string
  title: string
  type: "lecture" | "playlist"
  language: string
  mediaType: "AUDIO" | "VIDEO"
  playlistId?: string | null
  url?: string
  duration?: number | null
  thumbnail?: string | null
}

export function SearchBar({ className = "" }: { className?: string }) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Result[]>([])
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)
  const [activeIndex, setActiveIndex] = useState(-1)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const play = usePlayerStore((s) => s.play)

  const trimmed = query.trim()
  const searchable = trimmed.length >= MIN_QUERY_LENGTH

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!searchable) return
    const controller = new AbortController()
    timerRef.current = setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
            signal: controller.signal,
            cache: "no-store",
          })
          if (!res.ok) throw new Error(`Search request failed (${res.status})`)
          const data: Result[] = await res.json()
          if (controller.signal.aborted) return
          setResults(data)
          setActiveIndex(-1)
          setError(null)
        } catch (cause) {
          if (controller.signal.aborted) return
          console.error("Could not search lectures and playlists.", cause)
          setResults([])
          setError(navigator.onLine
            ? "Search could not load. Please try again."
            : "Search needs an internet connection. Connect and try again.")
        } finally {
          if (!controller.signal.aborted) setIsPending(false)
        }
      })()
    }, 300)
    return () => {
      controller.abort()
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [trimmed, searchable, retry])

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [open])

  // "/" focuses search from anywhere on the page (unless already typing).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return
      const el = e.target as HTMLElement | null
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return
      e.preventDefault()
      inputRef.current?.focus()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  function clear() {
    setQuery("")
    setResults([])
    setActiveIndex(-1)
    setOpen(false)
    setIsPending(false)
    setError(null)
  }

  function retrySearch() {
    if (!searchable) {
      inputRef.current?.focus()
      return
    }
    setError(null)
    setIsPending(true)
    setOpen(true)
    setRetry((value) => value + 1)
  }

  function goTo(r: Result) {
    clear()
    const section = r.mediaType === "AUDIO" ? "audio" : "video"

    if (r.type === "playlist") {
      router.push(`/${section}/playlist/${r.id}`)
      return
    }

    // Lectures have no page of their own — open them inside their playlist,
    // which auto-plays the selected lecture via the query param.
    if (r.playlistId) {
      const param = r.mediaType === "AUDIO" ? "lecture" : "video"
      router.push(`/${section}/playlist/${r.playlistId}?${param}=${encodeURIComponent(r.id)}`)
      return
    }

    // Standalone lecture: play it directly in the global player.
    play({
      id: r.id,
      title: r.title,
      url: r.mediaType === "AUDIO" ? `/api/audio/${r.id}` : (r.url ?? ""),
      mediaType: r.mediaType,
      duration: r.duration ?? undefined,
      thumbnail: r.thumbnail ?? undefined,
    })
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.nativeEvent.isComposing) return
    if (e.key === "Escape") {
      setOpen(false)
      return
    }
    if (!showResults || !ordered.length) {
      if (e.key === "Enter") {
        e.preventDefault()
        retrySearch()
      }
      if (e.key === "ArrowDown" && results.length) setOpen(true)
      return
    }
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % ordered.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => (i <= 0 ? ordered.length - 1 : i - 1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      goTo(ordered[activeIndex >= 0 ? activeIndex : 0])
    }
  }

  const showResults = open && searchable
  const playlists = results.filter((r) => r.type === "playlist")
  const lectures = results.filter((r) => r.type === "lecture")
  const ordered = [...playlists, ...lectures]

  function renderGroup(label: string, items: Result[], offset: number) {
    if (!items.length) return null
    return (
      <div role="group" aria-label={label}>
        <p className="search-group-label">{label}</p>
        {items.map((r, i) => {
          const index = offset + i
          const Icon = r.type === "playlist" ? ListMusic : r.mediaType === "AUDIO" ? Headphones : PlayCircle
          return (
            <button
              key={r.id}
              id={`search-option-${r.id}`}
              role="option"
              aria-selected={activeIndex === index}
              data-active={activeIndex === index}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => goTo(r)}
              className="search-option"
            >
              <span className="search-option-icon" data-media={r.mediaType}>
                <Icon size={16} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-[var(--foreground)]">
                  <Highlight text={r.title} query={trimmed} />
                </span>
                <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
                  <span className="search-chip">{r.mediaType === "AUDIO" ? "Audio" : "Video"}</span>
                  <span>{r.language}</span>
                </span>
              </span>
              <ArrowUpRight size={15} className="search-option-arrow" />
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className={`relative z-20 text-left ${className}`}>
      <div ref={rootRef} className="search-root relative mx-auto max-w-2xl">
        <div className="search-shell" data-open={showResults}>
          {isPending ? (
            <LoaderCircle size={19} className="shrink-0 animate-spin text-[var(--accent)]" />
          ) : (
            <Search size={19} className="search-icon shrink-0" />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              if (e.target.value.trim() === trimmed) return
              setActiveIndex(-1)
              setResults([])
              setError(null)
              const canSearch = e.target.value.trim().length >= MIN_QUERY_LENGTH
              setIsPending(canSearch)
              setOpen(canSearch)
            }}
            onFocus={() => {
              if (searchable) setOpen(true)
              if (window.matchMedia("(max-width: 639px)").matches) {
                rootRef.current?.scrollIntoView({ block: "start" })
              }
            }}
            type="search"
            enterKeyHint="search"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            onKeyDown={onKeyDown}
            placeholder="Search lectures, playlists…"
            aria-label="Search lectures and playlists"
            role="combobox"
            aria-expanded={showResults}
            aria-controls="search-results"
            aria-autocomplete="list"
            aria-activedescendant={activeIndex >= 0 && ordered[activeIndex] ? `search-option-${ordered[activeIndex].id}` : undefined}
            className="search-input"
          />
          {query ? (
            <button onClick={() => { clear(); inputRef.current?.focus() }} aria-label="Clear search" className="search-clear">
              <X size={15} />
            </button>
          ) : (
            <span className="search-hint hidden md:inline-flex" aria-hidden="true">
              Press <kbd className="search-kbd">/</kbd> to search
            </span>
          )}
          <button
            type="button"
            aria-label="Search"
            onClick={() => {
              if (showResults && ordered.length) goTo(ordered[activeIndex >= 0 ? activeIndex : 0])
              else retrySearch()
            }}
            className="search-submit"
          >
            <ArrowRight size={18} strokeWidth={2.4} />
          </button>
        </div>

        {showResults && (
          <div id="search-results" role="listbox" aria-busy={isPending} className="search-panel">
            {error ? (
              <div className="px-6 py-6 text-center">
                <p role="alert" className="text-sm text-[var(--foreground)]">{error}</p>
                <button type="button" onClick={retrySearch} className="mt-3 text-sm font-semibold text-[var(--accent)]">
                  Try again
                </button>
              </div>
            ) : ordered.length > 0 ? (
              <>
                {renderGroup("Playlists", playlists, 0)}
                {renderGroup("Lectures", lectures, playlists.length)}
                <p className="search-footer">
                  <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
                  <span><kbd>Enter</kbd> open</span>
                  <span><kbd>Esc</kbd> close</span>
                </p>
              </>
            ) : !isPending ? (
              <div className="px-6 py-8 text-center">
                <SearchX size={26} className="mx-auto mb-2 text-[var(--muted)] opacity-70" />
                <p className="text-sm font-medium text-[var(--foreground)]">No matches for &ldquo;{trimmed}&rdquo;</p>
                <p className="mt-1 text-xs text-[var(--muted)]">Try a shorter word, e.g. &ldquo;Gita&rdquo; or &ldquo;Bhagavatam&rdquo;.</p>
              </div>
            ) : (
              <p role="status" className="px-6 py-6 text-center text-xs text-[var(--muted)]">Searching…</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className="search-mark">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}
