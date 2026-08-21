type Stat = { label: string; value: number; suffix?: string }

export function StatsStrip({
  audioCount,
  videoCount,
  playlistCount,
}: {
  audioCount: number
  videoCount: number
  playlistCount: number
}) {
  const stats: Stat[] = [
    { label: "Audio Lectures", value: audioCount },
    { label: "Video Lectures", value: videoCount },
    { label: "Playlists", value: playlistCount },
    { label: "Languages", value: 3 },
  ]

  return (
    <section className="border-y border-[var(--border)]" style={{ background: "var(--surface)" }}>
      <div className="mx-auto grid max-w-4xl grid-cols-2 divide-x divide-y divide-[var(--border)] sm:grid-cols-4 sm:divide-y-0">
        {stats.map(({ label, value }) => (
          <div key={label} className="flex flex-col items-center px-6 py-5 text-center">
            <span className="text-3xl font-bold" style={{ color: "var(--stat-number)" }}>
              {value.toLocaleString()}
            </span>
            <span className="mt-1 text-xs font-medium uppercase tracking-widest text-[var(--muted)]">
              {label}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
