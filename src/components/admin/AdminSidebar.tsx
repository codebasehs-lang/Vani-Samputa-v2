"use client"

import { BrandLogo } from "@/components/BrandLogo"
import { ADMIN_COLORS } from "@/lib/adminColors"
import {
  ArrowLeft,
  BookOpen,
  Info,
  LayoutDashboard,
  ListMusic, Menu,
  Newspaper,
  Quote,
  Radio,
  Tag,
  Upload, Video,
  X,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState, type CSSProperties } from "react"

const NAV = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard, color: ADMIN_COLORS.dashboard },
  { href: "/admin/lectures", label: "Lectures", Icon: BookOpen, color: ADMIN_COLORS.lectures },
  { href: "/admin/playlists", label: "Playlists", Icon: ListMusic, color: ADMIN_COLORS.lectures },
  { href: "/admin/import", label: "Import Excel", Icon: Upload, color: ADMIN_COLORS.import },
  { href: "/admin/categories", label: "Tags", Icon: Tag, color: ADMIN_COLORS.categories },
  { href: "/admin/quotes", label: "Daily Quotes", Icon: Quote, color: ADMIN_COLORS.quotes },
  { href: "/admin/youtube", label: "YouTube Sync", Icon: Video, color: ADMIN_COLORS.youtube },
  { href: "/admin/articles", label: "Articles", Icon: Newspaper, color: ADMIN_COLORS.articles },
  { href: "/admin/about", label: "About", Icon: Info, color: ADMIN_COLORS.about },
  { href: "/admin/live", label: "Live Config", Icon: Radio, color: ADMIN_COLORS.live },
]

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <BrandLogo animated={false} className="h-11 w-11" />
      <div>
        <p className="font-iast text-lg font-semibold text-[var(--foreground)]">Vāṇī Saṃpuṭa</p>
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--muted)]">Administration</p>
      </div>
    </div>
  )
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Admin navigation" className="admin-nav-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-2">
      {NAV.map(({ href, label, Icon, color }, index) => {
        const active = pathname === href || (href !== "/admin" && pathname.startsWith(href))
        const group = index === 0 ? "Workspace" : index === 1 ? "Library" : index === 5 ? "Publishing" : index === 8 ? "Settings" : null
        return (
          <div key={href}>
            {group && <p className={`${index ? "mt-2" : ""} mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]`}>{group}</p>}
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              style={{ "--section-color": color } as CSSProperties}
              className={`admin-nav-link mb-0.5 flex min-h-11 items-center gap-2.5 rounded-md px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] lg:min-h-9 lg:py-1 ${active
                ? "font-semibold"
                : "font-medium"
                }`}
            >
              <span
                className="admin-section-icon flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
              >
                <Icon size={15} strokeWidth={2} />
              </span>
              {label}
              {active && <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} />}
            </Link>
          </div>
        )
      })}
    </nav>
  )
}

export function AdminSidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener("keydown", closeOnEscape)
    }
  }, [open])

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="admin-sidebar fixed inset-y-0 left-0 z-[60] hidden w-64 shrink-0 flex-col border-r border-[var(--border)] lg:flex"
      >
        <div className="shrink-0 border-b border-[var(--border)] px-5 py-3">
          <Brand />
        </div>
        <NavLinks pathname={pathname} />
        <div className="shrink-0 border-t border-[var(--border)] p-2">
          <Link
            href="/"
            className="admin-nav-link flex items-center gap-2.5 rounded-md px-3.5 py-2.5 text-sm"
          >
            <ArrowLeft size={16} strokeWidth={1.75} /> Back to Site
          </Link>
        </div>
      </aside>

      {/* Mobile topbar */}
      <div
        className="admin-sidebar sticky top-[59px] z-[60] flex items-center justify-between gap-2 border-b border-[var(--border)] px-3 py-3 lg:hidden"
      >
        <Brand />
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="admin-mobile-navigation"
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg p-2 text-[var(--foreground)] transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] dark:hover:bg-white/5"
        >
          {open ? <X size={20} strokeWidth={1.75} /> : <Menu size={20} strokeWidth={1.75} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside
            id="admin-mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Admin menu"
            className="admin-sidebar absolute inset-y-0 left-0 flex w-72 max-w-[90vw] flex-col border-r border-[var(--border)]"
          >
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--border)] px-4 py-4">
              <Brand />
              <button type="button" autoFocus onClick={() => setOpen(false)} aria-label="Close menu" title="Close menu" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"><X size={18} /></button>
            </div>
            <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
            <div className="shrink-0 border-t border-[var(--border)] p-3">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm text-[var(--muted)] transition-colors hover:bg-black/5 hover:text-[var(--foreground)] dark:hover:bg-white/5"
              >
                <ArrowLeft size={16} strokeWidth={1.75} /> Back to Site
              </Link>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
