"use client"

import { BrandLogo } from "@/components/BrandLogo"
import { ThemeToggle } from "@/components/ThemeToggle"
import { ADMIN_COLORS } from "@/lib/adminColors"
import { usePlayerStore } from "@/store/playerStore"
import {
  BookOpen, CalendarDays, ChevronRight, CircleUserRound, ExternalLink, Headphones, House,
  Info, Library, LogIn, LogOut, Menu, Newspaper, Radio, Video, X,
  type LucideIcon,
} from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { signOut, useSession } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState, useSyncExternalStore } from "react"
import { createPortal } from "react-dom"

type NavLink = { href: string; label: string; external?: boolean; live?: boolean }

const NAV_ICONS: Record<string, LucideIcon> = {
  Home: House,
  Audio: Headphones,
  Video: Video,
  Lectures: Library,
  Articles: Newspaper,
  Programs: CalendarDays,
  Live: Radio,
  Books: BookOpen,
  About: Info,
}

const navLinks: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/audio", label: "Audio" },
  { href: "/video", label: "Video" },
  { href: "/lectures", label: "Lectures" },
  { href: "/articles", label: "Articles" },
  { href: "/events", label: "Programs" },
  { href: "/live", label: "Live", live: true },
  { href: "https://books.vanisamputa.com", label: "Books", external: true },
  { href: "/about", label: "About" },
]

function noopSubscribe() {
  return () => {}
}

function NavLabel({ label, live }: { label: string; live?: boolean }) {
  if (!live) return <>{label}</>
  return (
    <span className="nav-live">
      <span className="hero-live-dot" aria-hidden="true" />
      {label}
    </span>
  )
}

export function Header() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { currentTrack, resume } = usePlayerStore()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false)
  const isHome = pathname === "/"
  const isAdminRoute = pathname.startsWith("/admin")
  const isActiveLink = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href))
  const logoHref = currentTrack?.playlistId
    ? `/${currentTrack.mediaType === "AUDIO" ? "audio" : "video"}/playlist/${currentTrack.playlistId}`
    : "/"

  function handleLogoClick() {
    if (currentTrack) resume()
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener("keydown", onKey)
    }
  }, [open])

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
                aria-label="Log out"
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
    <header
      className="site-header sticky top-0 z-50"
      data-over-hero={isHome && !scrolled ? "true" : undefined}
      data-scrolled={scrolled ? "true" : undefined}
    >
      <div className="relative flex h-20 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href={logoHref}
          onClick={handleLogoClick}
          className="brand-link flex items-center gap-3.5 rounded-full font-serif font-semibold sm:gap-4"
        >
          <BrandLogo className="h-[52px] w-[52px] sm:h-[62px] sm:w-[62px]" />
          <span className="flex flex-col leading-tight">
            <span className="header-title font-iast text-lg tracking-[0.06em] sm:text-[1.35rem]">
              Vāṇī Saṃpuṭa
            </span>
            <span className="header-subtitle font-iast text-[9px] font-medium uppercase tracking-[0.2em] sm:text-[10px]">
              HH Haladhara Svāmī
            </span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="ml-8 mr-auto hidden items-center gap-1 lg:flex xl:ml-12 xl:gap-2">
          {navLinks.map(({ href, label, external, live }) => {
            const active = !external && isActiveLink(href)
            const content = (
              <>
                <NavLabel label={label} live={live} />
                {active && (
                  <motion.span
                    layoutId="nav-underline"
                    className="nav-underline"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
              </>
            )
            return external ? (
              <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="nav-link">
                {content}
              </a>
            ) : (
              <Link key={href} href={href} className="nav-link" data-active={active ? "true" : undefined} aria-current={active ? "page" : undefined}>
                {content}
              </Link>
            )
          })}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-2.5">
          <ThemeToggle className="theme-toggle" />

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
                aria-label="Log out"
                className="icon-btn inline-flex items-center justify-center p-2"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="btn-gold hidden items-center gap-2 px-5 py-2 text-sm lg:inline-flex"
            >
              <LogIn size={16} />
              Log in
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

      {/* Mobile menu drawer — portalled to <body>: the header's backdrop-filter
          would otherwise become the containing block for this fixed overlay. */}
      {mounted && createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              key="mobile-drawer"
              className="fixed inset-0 z-[70] lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <button
                aria-label="Close menu"
                className="drawer-backdrop absolute inset-0"
                onClick={() => setOpen(false)}
              />
              <motion.aside
                aria-label="Mobile navigation"
                className="drawer-panel absolute inset-y-0 right-0 flex w-[min(20rem,86vw)] flex-col"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
              >
                <div className="drawer-glow" aria-hidden="true" />

                <div className="drawer-head relative flex items-center justify-between gap-3 px-5 pb-5 pt-6">
                  <div className="flex min-w-0 items-center gap-3">
                    <BrandLogo className="h-11 w-11 shrink-0" />
                    <span className="flex min-w-0 flex-col leading-tight">
                      <span className="drawer-title font-iast truncate">Vāṇī Saṃpuṭa</span>
                      <span className="drawer-sub font-iast truncate">HH Haladhara Svāmī</span>
                    </span>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    aria-label="Close menu"
                    className="drawer-close"
                  >
                    <X size={18} />
                  </button>
                </div>

                <p className="drawer-eyebrow relative px-6 pb-2 pt-4">Explore</p>
                <nav className="relative flex flex-1 flex-col gap-1 overflow-y-auto px-3 pb-4">
                  {navLinks.map(({ href, label, external, live }) => {
                    const active = !external && isActiveLink(href)
                    const Icon = NAV_ICONS[label] ?? Info
                    const content = (
                      <>
                        <span className="drawer-icon"><Icon size={17} /></span>
                        <span className="flex-1"><NavLabel label={label} live={live} /></span>
                        {external
                          ? <ExternalLink size={14} className="drawer-chev" />
                          : <ChevronRight size={16} className="drawer-chev" />}
                      </>
                    )
                    return external ? (
                      <a key={href} href={href} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className="drawer-link">
                        {content}
                      </a>
                    ) : (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setOpen(false)}
                        className="drawer-link"
                        data-active={active ? "true" : undefined}
                        aria-current={active ? "page" : undefined}
                      >
                        {content}
                      </Link>
                    )
                  })}
                </nav>

                <div className="drawer-foot relative px-5 pb-6 pt-4">
                  {session ? (
                    <div className="flex items-center gap-2">
                      <Link href="/profile" onClick={() => setOpen(false)} className="drawer-chip flex-1">
                        <CircleUserRound size={16} /> Profile
                      </Link>
                      <button onClick={() => { signOut(); setOpen(false) }} className="drawer-chip flex-1">
                        <LogOut size={16} /> Log out
                      </button>
                    </div>
                  ) : (
                    <Link
                      href="/login"
                      onClick={() => setOpen(false)}
                      className="btn-gold inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm"
                    >
                      <LogIn size={16} />
                      Log in
                    </Link>
                  )}
                </div>
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </header>
  )
}
