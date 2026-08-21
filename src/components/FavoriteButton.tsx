"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Heart } from "phosphor-react"

export function FavoriteButton({ lectureId }: { lectureId: string }) {
  const { data: session } = useSession()
  const [favorited, setFavorited] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!session) return
    fetch("/api/favorites")
      .then((r) => r.json())
      .then((ids: string[]) => setFavorited(ids.includes(lectureId)))
      .catch(() => {})
  }, [session, lectureId])

  async function toggle() {
    if (!session) return
    setBusy(true)
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lectureId }),
    })
    const { favorited: next } = await res.json()
    setFavorited(next)
    setBusy(false)
  }

  if (!session) return null

  return (
    <button
      onClick={toggle}
      disabled={busy}
      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
      className="p-1.5 transition-colors disabled:opacity-40"
    >
      <Heart
        size={18}
        weight={favorited ? "fill" : "regular"}
        style={{ color: favorited ? "#E8A4C8" : "var(--muted)" }}
      />
    </button>
  )
}
