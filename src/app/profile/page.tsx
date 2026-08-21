import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Profile" }

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.email) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      _count: { select: { favorites: true, history: true, notes: true } },
    },
  })
  if (!user) redirect("/login")

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {/* Avatar + name */}
      <div className="mb-8 flex items-center gap-4">
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt={user.name ?? ""} className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-white"
            style={{ background: "var(--saffron)" }}
          >
            {user.name?.[0]?.toUpperCase() ?? "U"}
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)]">{user.name ?? "Devotee"}</h1>
          <p className="text-sm text-[var(--muted)]">{user.email}</p>
          {user.role === "ADMIN" && (
            <span
              className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
              style={{ background: "var(--saffron)" }}
            >
              Admin
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-3 divide-x divide-[var(--border)] rounded-2xl border border-[var(--border)]" style={{ background: "var(--surface)" }}>
        {[
          { label: "Favorites", value: user._count.favorites },
          { label: "Listened", value: user._count.history },
          { label: "Notes", value: user._count.notes },
        ].map(({ label, value }) => (
          <div key={label} className="px-4 py-5 text-center">
            <p className="text-2xl font-bold" style={{ color: "var(--saffron)" }}>{value}</p>
            <p className="mt-0.5 text-xs text-[var(--muted)] uppercase tracking-wide">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="space-y-2">
        {[
          { href: "/history",  label: "Listening History" },
          { href: "/settings", label: "Settings" },
          { href: "/admin",    label: "Admin Dashboard", adminOnly: true },
        ]
          .filter((l) => !l.adminOnly || user.role === "ADMIN")
          .map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center justify-between rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-medium text-[var(--foreground)] transition-colors hover:border-[var(--saffron)]/40"
              style={{ background: "var(--surface)" }}
            >
              {label}
              <span className="text-[var(--muted)]">→</span>
            </Link>
          ))}
      </div>
    </div>
  )
}
