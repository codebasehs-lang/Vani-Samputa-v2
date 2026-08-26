"use client"

import { useState } from "react"
import { Search, Play } from "lucide-react"
import { usePlayerStore, type Track } from "@/store/playerStore"

type TranscriptLecture = {
  id: string
  title: string
  url: string
  duration: number | null
  mediaType: "AUDIO" | "VIDEO"
  thumbnail: string | null
  transcript: string | null
}

type Result = {
  lecture: TranscriptLecture
  text: string
  timestampS: number
}

function timestampFromLine(line: string) {
  const match = line.match(/\[?(\d{1,3}):(\d{2})\]?/)
  return match ? Number(match[1]) * 60 + Number(match[2]) : 0
}

function toTrack(lecture: TranscriptLecture, playlistId: string): Track {
  return {
    id: lecture.id,
    title: lecture.title,
    url: lecture.url,
    mediaType: lecture.mediaType,
    duration: lecture.duration ?? undefined,
    thumbnail: lecture.thumbnail ?? undefined,
    playlistId,
  }
}

export function TranscriptSearch({ lectures, playlistId }: { lectures: TranscriptLecture[]; playlistId: string }) {
  const [query, setQuery] = useState("")
  const { play, seek } = usePlayerStore()
  const normalizedQuery = query.trim().toLocaleLowerCase()

  const results: Result[] = []
  if (normalizedQuery.length >= 2) {
    for (const lecture of lectures) {
      if (!lecture.transcript) continue
      for (const line of lecture.transcript.split(/\r?\n/)) {
        if (line.toLocaleLowerCase().includes(normalizedQuery)) {
          results.push({
            lecture,
            text: line.trim().slice(0, 180),
            timestampS: timestampFromLine(line),
          })
        }
        if (results.length >= 30) break
      }
      if (results.length >= 30) break
    }
  }

  function selectResult(result: Result) {
    play(toTrack(result.lecture, playlistId))
    if (result.timestampS > 0) seek(result.timestampS)
  }

  return (
    <section className="mt-10 border-t border-[var(--border)] pt-6" aria-labelledby="transcript-search-title">
      <div className="mb-3">
        <h2 id="transcript-search-title" className="text-lg font-semibold text-[var(--foreground)]">Search transcripts</h2>
        <p className="mt-1 text-xs text-[var(--muted)]">Find a phrase across the lectures in this playlist.</p>
      </div>
      <label className="relative block">
        <Search size={16} className="pointer-events-none absolute left-3 top-3 text-[var(--muted)]" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search transcript text"
          aria-label="Search transcript text"
          className="field-input w-full py-2.5 pl-9 pr-3 text-sm"
        />
      </label>

      {normalizedQuery.length >= 2 && results.length === 0 && (
        <div className="empty-state py-6 text-center text-sm text-[var(--muted)]">No transcript matches found.</div>
      )}
      {results.length > 0 && (
        <div className="surface-panel mt-3 divide-y divide-[var(--border)]" role="list">
          {results.map((result, index) => (
            <button
              key={`${result.lecture.id}-${index}`}
              type="button"
              onClick={() => selectResult(result)}
              className="flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-[var(--accent)]/5"
              role="listitem"
            >
              <Play size={14} fill="currentColor" className="mt-1 shrink-0 text-[var(--accent)]" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold text-[var(--foreground)]">{result.lecture.title}</span>
                <span className="mt-1 block text-sm text-[var(--muted)]">{result.text || "Transcript match"}</span>
              </span>
              {result.timestampS > 0 && (
                <span className="shrink-0 text-xs font-semibold text-[var(--accent)]">
                  {Math.floor(result.timestampS / 60)}:{String(result.timestampS % 60).padStart(2, "0")}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
