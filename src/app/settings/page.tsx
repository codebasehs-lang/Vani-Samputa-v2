"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { usePlayerStore } from "@/store/playerStore"
import { ThemeToggle } from "@/components/ThemeToggle"

export default function SettingsPage() {
  const { speed, volume, setSpeed, setVolume } = usePlayerStore()

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <Link
        href="/profile"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
      >
        <ArrowLeft size={16} />
        Back to profile
      </Link>
      <h1 className="font-serif mb-6 text-2xl font-bold text-[var(--foreground)]">
        Settings
      </h1>

      <div className="space-y-4">
        <Section title="Appearance">
          <Row label="Theme">
            <ThemeToggle />
          </Row>
        </Section>

        <Section title="Playback">
          <Row label={`Default Speed — ${speed}×`}>
            <input
              type="range" min={0.5} max={2} step={0.25}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-32 accent-[var(--accent)]"
            />
          </Row>
          <Row label={`Volume — ${Math.round(volume * 100)}%`}>
            <input
              type="range" min={0} max={1} step={0.05}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-32 accent-[var(--accent)]"
            />
          </Row>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="surface-panel overflow-hidden">
      <p className="border-b border-[var(--border)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)]">
        {title}
      </p>
      <div className="divide-y divide-[var(--border)]">{children}</div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-[var(--foreground)]">{label}</span>
      {children}
    </div>
  )
}
