"use client"

import { useEffect } from "react"

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Page error:", error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <div className="surface-panel max-w-md p-8 text-center">
        <div className="mb-4 text-4xl">⚠️</div>
        <h1 className="mb-2 text-lg font-semibold text-[var(--foreground)]">
          Something went wrong
        </h1>
        <p className="mb-6 text-sm" style={{ color: "color-mix(in oklab, var(--muted) 85%, var(--foreground) 15%)" }}>
          We&apos;re unable to reach the server right now. Please check your
          connection and try again in a moment.
        </p>
        <button onClick={() => reset()} className="chip px-4 py-2 text-sm" data-active="true">
          Try again
        </button>
      </div>
    </div>
  )
}
