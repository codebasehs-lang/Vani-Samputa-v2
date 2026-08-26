"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Heart } from "lucide-react"

export function PlaylistFavoriteButton({ playlistId, compact = false }: { playlistId: string; compact?: boolean }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [favorited, setFavorited] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!session) return
    fetch("/api/playlist-favorites")
      .then((response) => response.json())
      .then((ids: string[]) => setFavorited(ids.includes(playlistId)))
      .catch(() => {})
  }, [session, playlistId])

  async function toggle() {
    if (!session) {
      router.push("/login")
      return
    }
    if (busy) return
    setBusy(true)
    try {
      const response = await fetch("/api/playlist-favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlistId }),
      })
      if (!response.ok) return
      const data = await response.json() as { favorited: boolean }
      setFavorited(data.favorited)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-label={favorited ? "Remove playlist from favorites" : "Add playlist to favorites"}
      title={favorited ? "Remove playlist from favorites" : "Add playlist to favorites"}
      className={compact
        ? "icon-btn inline-flex items-center justify-center rounded-full bg-[var(--surface)]/90 p-2 shadow-sm disabled:opacity-40"
        : "chip inline-flex shrink-0 self-start items-center gap-2 px-5 py-2 text-sm font-semibold disabled:opacity-40"}
      data-active={favorited}
    >
      <Heart size={compact ? 16 : 16} fill={favorited ? "currentColor" : "none"} />
      {!compact && (favorited ? "Saved" : "Favorite")}
    </button>
  )
}
