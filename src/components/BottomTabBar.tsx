"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { House, Headphones, Video, BookOpen, User } from "lucide-react"

const tabs = [
  { href: "/",        label: "Home",    Icon: House      },
  { href: "/audio",   label: "Audio",   Icon: Headphones },
  { href: "/video",   label: "Video",   Icon: Video      },
  { href: "/articles",label: "Articles",Icon: BookOpen   },
  { href: "/profile", label: "Profile", Icon: User       },
]

export function BottomTabBar() {
  const pathname = usePathname()
  if (pathname.startsWith("/admin")) return null

  return (
    <nav className="nav-surface fixed bottom-0 inset-x-0 z-40 md:hidden border-t border-[var(--border)]">
      <ul className="flex">
        {tabs.map(({ href, label, Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href))
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={`relative flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] transition-colors ${
                  active
                    ? "font-bold text-[var(--accent)]"
                    : "font-medium text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full transition-all"
                  style={active ? {
                    background: "color-mix(in oklab, var(--accent) 24%, var(--surface))",
                    boxShadow: "inset 0 0 0 1.5px color-mix(in oklab, var(--accent) 60%, transparent), 0 2px 8px color-mix(in oklab, var(--accent) 22%, transparent)",
                  } : undefined}
                >
                  <Icon
                    size={20}
                    strokeWidth={active ? 2.5 : 2}
                    fill={active ? "color-mix(in oklab, var(--accent) 38%, var(--surface))" : "none"}
                  />
                </span>
                {label}
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 h-0.5 w-7 rounded-full bg-[var(--accent)]"
                  />
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
