import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/PageHeader"

export const metadata: Metadata = { title: "Upcoming Programs" }

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date)
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

export default async function EventsPage() {
  const events = await prisma.event.findMany({
    where: { startAt: { gte: new Date() } },
    orderBy: { startAt: "asc" },
    take: 30,
  })

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <PageHeader eyebrow="Gatherings & broadcasts" title="Upcoming Programs" />

      {events.length === 0 ? (
        <div className="empty-state px-6 py-16 text-center">
          <span className="mb-3 block text-3xl text-[var(--accent)]" aria-hidden="true">◷</span>
          <p className="text-sm text-[var(--muted)]">No upcoming programs have been scheduled.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {events.map((event) => (
            <article key={event.id} className="surface-panel overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                {event.coverUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={event.coverUrl}
                    alt=""
                    className="h-40 w-full object-cover sm:h-auto sm:w-40"
                  />
                )}
                <div className="min-w-0 flex-1 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
                    {formatDate(event.startAt)}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-[var(--foreground)]">{event.title}</h2>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--muted)]">
                    <span className="inline-flex items-center gap-1.5">
                      <span aria-hidden="true">◷</span>
                      {formatTime(event.startAt)}
                      {event.endAt && ` – ${formatTime(event.endAt)}`}
                    </span>
                    {event.location && (
                      <span className="inline-flex items-center gap-1.5">
                        <span aria-hidden="true">⌖</span>
                        {event.location}
                      </span>
                    )}
                  </div>
                  {event.description && (
                    <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{event.description}</p>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
