"use client"

import { useState, useRef, useEffect, useTransition } from "react"
import { Search, X, LoaderCircle } from "lucide-react"
import { useRouter } from "next/navigation"

type Result = {
  id: string
  title: string
  type: "lecture" | "playlist"
  language: string
  mediaType: "AUDIO" | "VIDEO"
}

export function SearchBar() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Result[]>([])
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (!query.trim()) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      startTransition(async () => {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        if (res.ok) {
          const data: Result[] = await res.json()
          setResults(data)
          setOpen(true)
        }
      })
    }, 300)
  }, [query])

  function clear() {
    setQuery("")
    setResults([])
    setOpen(false)
  }

  function goTo(r: Result) {
    clear()
    const base = r.type === "playlist"
      ? `/${r.mediaType === "AUDIO" ? "audio" : "video"}/playlist/${r.id}`
      : `/${r.mediaType === "AUDIO" ? "audio" : "video"}/lecture/${r.id}`
    router.push(base)
  }

  return (
    <div className="px-4 py-4" style={{ background: "var(--surface)" }}>
      <div className="relative mx-auto max-w-2xl">
        <div className="field-input flex items-center gap-2 px-4 py-2.5">
          {isPending ? (
            <LoaderCircle size={18} className="shrink-0 animate-spin text-[var(--muted)]" />
          ) : (
            <Search size={18} className="shrink-0 text-[var(--muted)]" />
          )}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search lectures, playlists…"
            className="flex-1 bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
          />
          {query && (
            <button
              onClick={clear}
              aria-label="Clear"
              className="icon-btn inline-flex items-center justify-center rounded-full p-1"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Results dropdown */}
        {open && query.trim() && results.length > 0 && (
          <ul className="surface-panel absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto">
            {results.map((r) => (
              <li key={r.id}>
                <button
                  onClick={() => goTo(r)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--accent)]/10"
                >
                  <span className="text-lg">{r.mediaType === "AUDIO" ? "🎙️" : "🎬"}</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--foreground)]">{r.title}</p>
                    <p className="text-[10px] text-[var(--muted)]">
                      {r.type === "playlist" ? "Playlist" : "Lecture"} · {r.language}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        {open && results.length === 0 && !isPending && query.trim() && (
          <div className="surface-panel absolute left-0 right-0 top-full z-50 mt-1 px-4 py-5 text-center text-sm text-[var(--muted)]">
            No results for &quot;{query}&quot;
          </div>
        )}
      </div>
    </div>
  )
}
