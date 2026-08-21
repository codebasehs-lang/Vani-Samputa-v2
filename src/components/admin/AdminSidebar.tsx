"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Gauge, BookOpen, UploadSimple, YoutubeLogo,
  Article, Broadcast, Quotes, ArrowLeft, Info,
} from "phosphor-react"

const NAV = [
  { href: "/admin",           label: "Dashboard",    Icon: Gauge         },
  { href: "/admin/lectures",  label: "Lectures",     Icon: BookOpen      },
  { href: "/admin/import",    label: "Import Excel", Icon: UploadSimple  },
  { href: "/admin/quotes",    label: "Daily Quotes", Icon: Quotes        },
  { href: "/admin/youtube",   label: "YouTube Sync", Icon: YoutubeLogo   },
  { href: "/admin/articles",  label: "Articles",     Icon: Article       },
  { href: "/admin/about",     label: "About",        Icon: Info          },
  { href: "/admin/live",      label: "Live Config",  Icon: Broadcast     },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="fixed inset-y-0 left-0 z-[60] hidden w-64 shrink-0 flex-col border-r border-[var(--border)] lg:flex"
      style={{ background: "var(--surface)" }}
    >
      <div className="border-b border-[var(--border)] px-5 py-5">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/branding/logo-192.png" alt="Vani Samputa" className="h-11 w-11 rounded-full object-cover" />
          <div>
            <p className="font-iast text-lg font-semibold tracking-[0.03em] text-[var(--foreground)]">Vāṇī Saṃpuṭa</p>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--muted)]">Admin Console</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname === href || (href !== "/admin" && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`mb-1.5 flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "text-white"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
              style={
                active
                  ? { background: "linear-gradient(135deg, color-mix(in oklab, var(--accent) 86%, #0f172a 14%), var(--accent))" }
                  : {}
              }
            >
              <Icon size={16} weight={active ? "fill" : "regular"} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-[var(--border)] p-3">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm text-[var(--muted)] transition-colors hover:bg-black/5 hover:text-[var(--foreground)] dark:hover:bg-white/5"
        >
          <ArrowLeft size={16} /> Back to Site
        </Link>
      </div>
    </aside>
  )
}
