import type { Metadata } from "next"
import Link from "next/link"
import { CalendarDays, Clock, Headphones, MapPin, Radio } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/PageHeader"

export const metadata: Metadata = { title: "Upcoming Programs" }

const monthFmt = new Intl.DateTimeFormat("en-IN", { month: "short" })
const dayFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric" })
const weekdayFmt = new Intl.DateTimeFormat("en-IN", { weekday: "short" })

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
      <PageHeader
        icon={CalendarDays}
        eyebrow="Gatherings & broadcasts"
        title="Upcoming Programs"
        description="Kīrtanas, kathās and festivals with HH Haladhara Svāmī Mahārāja — come and join in person or online."
        crumbs={[{ label: "Home", href: "/" }, { label: "Programs" }]}
        meta={events.length ? [{ label: `${events.length} upcoming`, icon: CalendarDays }] : undefined}
      >
        <Link href="/live" className="page-hero-chip hover:border-[#e9c977]">
          <span className="hero-live-dot" aria-hidden="true" /> Watch live
        </Link>
      </PageHeader>

      {events.length === 0 ? (
        <div className="live-empty">
          <span className="live-orb"><CalendarDays size={30} /></span>
          <h2 className="article-title">No programs scheduled yet</h2>
          <p className="max-w-md text-sm text-[var(--muted)]">
            New gatherings will appear here as soon as they are announced. Meanwhile, enjoy the lecture archive.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/audio" className="btn-gold inline-flex items-center gap-2 px-5 py-2.5 text-sm">
              <Headphones size={15} /> Audio lectures
            </Link>
            <Link href="/live" className="pill-filter gap-2 px-5 py-2.5"><Radio size={15} /> Live satsang</Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {events.map((event) => (
            <article key={event.id} className="event-card flex-col sm:flex-row">
              <div className="flex gap-4 sm:contents">
                <div className="event-date" aria-hidden="true">
                  <span className="event-date-month">{monthFmt.format(event.startAt)}</span>
                  <span className="event-date-day">{dayFmt.format(event.startAt)}</span>
                  <span className="event-date-wd">{weekdayFmt.format(event.startAt)}</span>
                </div>
                <div className="min-w-0 flex-1 sm:order-2">
                  <p className="section-eyebrow">{formatDate(event.startAt)}</p>
                  <h2 className="article-title mt-1">{event.title}</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="event-meta">
                      <Clock size={13} />
                      {formatTime(event.startAt)}
                      {event.endAt && ` – ${formatTime(event.endAt)}`}
                    </span>
                    {event.location && (
                      <span className="event-meta">
                        <MapPin size={13} />
                        {event.location}
                      </span>
                    )}
                  </div>
                  {event.description && (
                    <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{event.description}</p>
                  )}
                </div>
              </div>
              {event.coverUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={event.coverUrl} alt="" className="event-cover sm:order-3" />
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
