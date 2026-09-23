"use client"

import { Share2 } from "lucide-react"
import { toast } from "sonner"

export function ShareButton({
  href,
  title,
  className = "",
  showLabel = false,
}: {
  href: string
  title: string
  className?: string
  showLabel?: boolean
}) {
  async function share() {
    const url = new URL(href, window.location.origin).toString()

    try {
      if (navigator.share) {
        await navigator.share({ title, url })
      } else {
        await navigator.clipboard.writeText(url)
        toast.success("Link copied")
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return
      toast.error("Unable to share this link")
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className={className}
      aria-label={`Share ${title}`}
      title="Share"
    >
      <Share2 size={16} />
      {showLabel && <span>Share</span>}
    </button>
  )
}
