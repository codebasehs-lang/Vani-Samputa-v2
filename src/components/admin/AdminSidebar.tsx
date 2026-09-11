"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, BookOpen, Upload, Video,
  Newspaper, Radio, Quote, ArrowLeft, Info, Tag,
  ListMusic, Menu, X,
} from "lucide-react"
import { ADMIN_COLORS, adminGradient } from "@/lib/adminColors"

const NAV = [
  { href: "/admin",            label: "Dashboard",    Icon: LayoutDashboard, color: ADMIN_COLORS.dashboard  },
  { href: "/admin/lectures",   label: "Lectures",     Icon: BookOpen,        color: ADMIN_COLORS.lectures   },
  { href: "/admin/playlists",  label: "Playlists",    Icon: ListMusic,       color: ADMIN_COLORS.lectures   },
  { href: "/admin/import",     label: "Import Excel", Icon: Upload,          color: ADMIN_COLORS.import     },
  { href: "/admin/categories", label: "Categories",   Icon: Tag,             color: ADMIN_COLORS.categories },
  { href: "/admin/quotes",     label: "Daily Quotes", Icon: Quote,           color: ADMIN_COLORS.quotes     },
  { href: "/admin/youtube",    label: "YouTube Sync", Icon: Video,           color: ADMIN_COLORS.youtube    },
  { href: "/admin/articles",   label: "Articles",     Icon: Newspaper,       color: ADMIN_COLORS.articles   },
  { href: "/admin/about",      label: "About",        Icon: Info,            color: ADMIN_COLORS.about      },
  { href: "/admin/live",       label: "Live Config",  Icon: Radio,           color: ADMIN_COLORS.live       },
]

function Brand() {
  return (
    <div className="flex items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/branding/logo-192.png" alt="Vani Samputa" className="h-11 w-11 rounded-full object-cover" />
      <div>
        <p className="font-iast text-lg font-semibold tracking-[0.03em] text-[var(--foreground)]">Vāṇī Saṃpuṭa</p>
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--muted)]">Admin Console</p>
      </div>
    </div>
  )
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4">
      {NAV.map(({ href, label, Icon, color }) => {
        const active = pathname === href || (href !== "/admin" && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            style={active ? { background: `color-mix(in oklab, ${color} 14%, var(--surface) 86%)` } : undefined}
            className={`mb-1.5 flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
              active
                ? "font-semibold text-[var(--foreground)]"
                : "font-medium text-[var(--muted)] hover:bg-black/[0.03] hover:text-[var(--foreground)] dark:hover:bg-white/5"
            }`}
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white"
              style={{ background: adminGradient(color) }}
            >
              <Icon size={15} strokeWidth={2} />
            </span>
            {label}
            {active && <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} />}
          </Link>
        )
      })}
    </nav>
  )
}

export function AdminSidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-[60] hidden w-64 shrink-0 flex-col border-r border-[var(--border)] lg:flex"
        style={{ background: "var(--surface)" }}
      >
        <div className="border-b border-[var(--border)] px-5 py-5">
          <Brand />
        </div>
        <NavLinks pathname={pathname} />
        <div className="border-t border-[var(--border)] p-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm text-[var(--muted)] transition-colors hover:bg-black/5 hover:text-[var(--foreground)] dark:hover:bg-white/5"
          >
            <ArrowLeft size={16} strokeWidth={1.75} /> Back to Site
          </Link>
        </div>
      </aside>

      {/* Mobile topbar */}
      <div
        className="sticky top-0 z-[60] flex items-center justify-between border-b border-[var(--border)] px-4 py-3 lg:hidden"
        style={{ background: "var(--surface)" }}
      >
        <Brand />
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
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
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-[var(--border)]"
            style={{ background: "var(--surface)" }}
          >
            <div className="border-b border-[var(--border)] px-5 py-5">
              <Brand />
            </div>
            <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
            <div className="border-t border-[var(--border)] p-3">
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
