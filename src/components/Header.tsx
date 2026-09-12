"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { useState } from "react"
import { Menu, X, LogOut, CircleUserRound } from "lucide-react"
import { ThemeToggle } from "@/components/ThemeToggle"
import { ADMIN_COLORS } from "@/lib/adminColors"

const navLinks = [
  { href: "/",         label: "Home"     },
  { href: "/audio",    label: "Audio"    },
  { href: "/video",    label: "Video"    },
  { href: "/lectures", label: "Lectures" },
  { href: "/articles", label: "Articles" },
  { href: "/events",   label: "Programs" },
  { href: "/live",     label: "🔴 Live"  },
  { href: "https://ggs.books.vanisamputa.com", label: "Books", external: true },
  { href: "/about",    label: "About"    },
]

export function Header() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const isAdminRoute = pathname.startsWith("/admin")
  const isActiveLink = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href))

  if (isAdminRoute) {
    return (
      <header
        className="sticky top-0 z-50 border-b border-[var(--border)]"
        style={{ background: "color-mix(in oklab, var(--surface) 96%, white 4%)" }}
      >
        <div className="flex h-20 items-center justify-between px-4 sm:px-6 lg:pl-[16.5rem] lg:pr-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Admin Workspace</p>

          <div className="flex items-center gap-2.5">
            <span className="rounded-full" style={{ background: `color-mix(in oklab, ${ADMIN_COLORS.categories} 14%, transparent)` }}>
              <ThemeToggle />
            </span>

            <div className="hidden items-center gap-2 lg:flex">
              <Link
                href="/profile"
                aria-label="Open profile"
                className="inline-flex items-center justify-center rounded-full p-1.5 transition-opacity hover:opacity-80"
                style={{ background: `color-mix(in oklab, ${ADMIN_COLORS.dashboard} 14%, transparent)` }}
              >
                {session?.user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.image}
                    alt={session.user.name ?? "User"}
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <CircleUserRound size={22} style={{ color: ADMIN_COLORS.dashboard }} />
                )}
              </Link>
              <button
                onClick={() => signOut()}
                aria-label="Sign out"
                className="rounded-full p-2 transition-opacity hover:opacity-80"
                style={{ background: `color-mix(in oklab, ${ADMIN_COLORS.youtube} 14%, transparent)` }}
              >
                <LogOut size={18} style={{ color: ADMIN_COLORS.youtube }} />
              </button>
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="nav-surface sticky top-0 z-50 border-b border-[var(--border)]">
      <div className="relative mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-5">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3.5 font-serif text-xl font-semibold">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/branding/logo-192.png" alt="Vani Samputa" className="h-14 w-14 rounded-full object-cover sm:h-16 sm:w-16" />
          <span className="font-iast tracking-[0.06em] text-[var(--foreground)]">Vāṇī Saṃpuṭa</span>
        </Link>

        {/* Desktop nav */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-5 lg:flex xl:gap-7">
          {navLinks.map(({ href, label, external }) => {
            const active = isActiveLink(href)
            const className = `whitespace-nowrap text-sm font-medium transition-colors ${
              active
                ? "text-[var(--foreground)]"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`
            const style = active ? { textShadow: "0 0 0.01px currentColor", borderBottom: "2px solid var(--accent)", paddingBottom: "2px" } : {}
            return external ? (
              <a key={href} href={href} target="_blank" rel="noopener noreferrer" className={className} style={style}>
                {label}
              </a>
            ) : (
              <Link key={href} href={href} className={className} style={style}>
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-2.5">
          <ThemeToggle />

          {session ? (
            <div className="hidden items-center gap-2 lg:flex">
              <Link href="/profile" aria-label="Open profile" className="icon-btn inline-flex items-center justify-center rounded-full">
                {session.user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.image}
                    alt={session.user.name ?? "User"}
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <CircleUserRound size={28} />
                )}
              </Link>
              <button
                onClick={() => signOut()}
                aria-label="Sign out"
                className="icon-btn inline-flex items-center justify-center p-2"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="btn-accent hidden items-center px-5 py-2 text-sm lg:inline-flex"
            >
              Sign in
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            className="icon-btn inline-flex items-center justify-center p-2 lg:hidden"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu drawer */}
      {open && (
        <div className="fixed inset-0 z-60 lg:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
            onClick={() => setOpen(false)}
          />
          <aside
            aria-label="Mobile navigation"
            className="nav-surface absolute inset-y-0 right-0 flex w-[min(21rem,88vw)] flex-col border-l border-[var(--border)] px-5 py-5 shadow-2xl"
          >
            <div className="mb-7 flex items-center justify-between">
              <span className="font-iast text-lg font-semibold tracking-[0.06em] text-[var(--foreground)]">Vāṇī Saṃpuṭa</span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="icon-btn inline-flex items-center justify-center p-2"
              >
                <X size={22} />
              </button>
            </div>
            <nav className="flex flex-col gap-2">
              {navLinks.map(({ href, label, external }) => {
                const active = isActiveLink(href)
                const className = `rounded-lg px-3 py-2 text-base font-medium transition-colors ${
                  active
                    ? "text-[var(--foreground)]"
                    : "text-[var(--foreground)]/90 hover:bg-black/5 dark:hover:bg-white/5"
                }`
                const style = active ? { background: "color-mix(in oklab, var(--accent) 14%, transparent 86%)" } : {}
                return external ? (
                  <a key={href} href={href} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className={className} style={style}>
                    {label}
                  </a>
                ) : (
                  <Link key={href} href={href} onClick={() => setOpen(false)} className={className} style={style}>
                    {label}
                  </Link>
                )
              })}
            </nav>
            <div className="mt-auto pt-6">
              {session ? (
                <button
                  onClick={() => { signOut(); setOpen(false) }}
                  className="w-full rounded-lg px-3 py-2 text-left text-base font-medium text-[var(--muted)] transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                >
                  Sign out
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="btn-accent inline-flex w-full items-center justify-center px-4 py-2 text-sm"
                >
                  Sign in
                </Link>
              )}
            </div>
          </aside>
        </div>
      )}
    </header>
  )
}
