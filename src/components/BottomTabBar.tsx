"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { House, Headphones, VideoCamera, BookOpen, User } from "phosphor-react"

const tabs = [
  { href: "/",        label: "Home",    Icon: House        },
  { href: "/audio",   label: "Audio",   Icon: Headphones   },
  { href: "/video",   label: "Video",   Icon: VideoCamera  },
  { href: "/articles",label: "Articles",Icon: BookOpen     },
  { href: "/profile", label: "Profile", Icon: User         },
]

export function BottomTabBar() {
  const pathname = usePathname()
  if (pathname.startsWith("/admin")) return null

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t border-[var(--border)]"
      style={{ background: "var(--surface)" }}
    >
      <ul className="flex">
        {tabs.map(({ href, label, Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href))
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                  active
                    ? "text-[var(--saffron)]"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                <Icon
                  size={22}
                  weight={active ? "fill" : "regular"}
                />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
