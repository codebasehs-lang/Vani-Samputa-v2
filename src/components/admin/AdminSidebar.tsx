"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, BookOpen, Upload, Video,
  Newspaper, Radio, Quote, ArrowLeft, Info, Tag,
  Menu, X,
} from "lucide-react"

const NAV = [
  { href: "/admin",           label: "Dashboard",    Icon: LayoutDashboard },
  { href: "/admin/lectures",  label: "Lectures",     Icon: BookOpen        },
  { href: "/admin/import",    label: "Import Excel", Icon: Upload          },
  { href: "/admin/categories",label: "Categories",   Icon: Tag             },
  { href: "/admin/quotes",    label: "Daily Quotes", Icon: Quote           },
  { href: "/admin/youtube",   label: "YouTube Sync", Icon: Video           },
  { href: "/admin/articles",  label: "Articles",     Icon: Newspaper       },
  { href: "/admin/about",     label: "About",        Icon: Info            },
  { href: "/admin/live",      label: "Live Config",  Icon: Radio           },
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
      {NAV.map(({ href, label, Icon }) => {
        const active = pathname === href || (href !== "/admin" && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`mb-1.5 flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
              active
                ? "admin-gradient-accent text-white"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <Icon size={16} strokeWidth={active ? 2.25 : 1.75} />
            {label}
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
