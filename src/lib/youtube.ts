// Normalises a pasted YouTube URL (watch/youtu.be/embed/live/shorts) down to the raw 11-char video ID.
// Falls back to the original string if it doesn't look like a full URL (i.e. already an ID).
export function extractYouTubeId(urlOrId: string): string {
  const value = urlOrId.replace(/\p{Cf}/gu, "").trim()
  if (!/^https?:\/\//i.test(value)) return value

  try {
    const u = new URL(value)
    if (u.searchParams.has("v")) return u.searchParams.get("v")!.replace(/\p{Cf}/gu, "").trim()

    const segments = u.pathname.split("/").filter(Boolean)
    // youtu.be/<id>, /embed/<id>, /live/<id>, /shorts/<id>
    return decodeURIComponent(segments.pop() ?? value).replace(/\p{Cf}/gu, "").trim()
  } catch {
    return value
  }
}

export function youtubeThumbnailUrl(urlOrId: string): string {
  return `https://img.youtube.com/vi/${encodeURIComponent(extractYouTubeId(urlOrId))}/mqdefault.jpg`
}

export const DEFAULT_LECTURE_THUMBNAIL = "/images/lecture-fallback.webp"

export function normalizeThumbnailUrl(src: string | null | undefined): string {
  const value = src?.trim()
  if (!value) return DEFAULT_LECTURE_THUMBNAIL
  if (!/^https?:\/\/(?:img\.youtube\.com|i\.ytimg\.com)\//i.test(value)) return value
  try {
    const url = new URL(value)
    url.pathname = decodeURIComponent(url.pathname).replace(/\p{Cf}/gu, "")
    return url.toString()
  } catch {
    return value
  }
}

export function isYouTubePlaceholder(src: string, width: number, height: number): boolean {
  // YouTube serves a 120x90 placeholder even for unavailable larger thumbnails.
  return /^https?:\/\/(?:img\.youtube\.com|i\.ytimg\.com)\/vi(?:_webp)?\/[^/]+\/(?:mqdefault|hqdefault|sddefault|maxresdefault)\./i.test(src)
    && width === 120 && height === 90
}
