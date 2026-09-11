// Normalises a pasted YouTube URL (watch/youtu.be/embed/live/shorts) down to the raw 11-char video ID.
// Falls back to the original string if it doesn't look like a full URL (i.e. already an ID).
export function extractYouTubeId(urlOrId: string): string {
  const value = urlOrId.trim()
  if (!/^https?:\/\//i.test(value)) return value

  try {
    const u = new URL(value)
    if (u.searchParams.has("v")) return u.searchParams.get("v")!

    const segments = u.pathname.split("/").filter(Boolean)
    // youtu.be/<id>, /embed/<id>, /live/<id>, /shorts/<id>
    return segments.pop() ?? value
  } catch {
    return value
  }
}
