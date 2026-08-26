"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { useState } from "react"
import { Menu, X, LogOut, CircleUserRound } from "lucide-react"
import { ThemeToggle } from "@/components/ThemeToggle"

const navLinks = [
  { href: "/",         label: "Home"     },
  { href: "/audio",    label: "Audio"    },
  { href: "/video",    label: "Video"    },
  { href: "/lectures", label: "Lectures" },
  { href: "/articles", label: "Articles" },
  { href: "/events",   label: "Programs" },
  { href: "/live",     label: "🔴 Live"  },
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
            <ThemeToggle />

            <div className="hidden items-center gap-2 lg:flex">
              <Link href="/profile" aria-label="Open profile" className="icon-btn inline-flex items-center justify-center rounded-full">
                {session?.user?.image ? (
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
                className="rounded-full p-2 transition-colors hover:bg-black/10 dark:hover:bg-white/10"
              >
                <LogOut size={18} className="text-[var(--muted)]" />
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
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 lg:flex">
          {navLinks.map(({ href, label }) => {
            const active = isActiveLink(href)
            return (
              <Link
                key={href}
                href={href}
                className={`text-sm font-medium transition-colors ${
                  active
                    ? "text-[var(--foreground)]"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
                style={active ? { textShadow: "0 0 0.01px currentColor", borderBottom: "2px solid var(--accent)", paddingBottom: "2px" } : {}}
              >
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
        <div className="nav-surface flex flex-col gap-2 border-t border-[var(--border)] px-4 py-4 lg:hidden">
          {navLinks.map(({ href, label }) => {
            const active = isActiveLink(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-2 text-base font-medium transition-colors ${
                  active
                    ? "text-[var(--foreground)]"
                    : "text-[var(--foreground)]/90 hover:bg-black/5 dark:hover:bg-white/5"
                }`}
                style={active ? { background: "color-mix(in oklab, var(--accent) 14%, transparent 86%)" } : {}}
              >
                {label}
              </Link>
            )
          })}
          {session ? (
            <button
              onClick={() => { signOut(); setOpen(false) }}
              className="rounded-lg px-3 py-2 text-left text-base font-medium text-[var(--muted)] transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            >
              Sign out
            </button>
          ) : (
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="btn-accent mt-1 inline-flex items-center justify-center px-4 py-2 text-sm"
            >
              Sign in
            </Link>
          )}
        </div>
      )}
    </header>
  )
}
