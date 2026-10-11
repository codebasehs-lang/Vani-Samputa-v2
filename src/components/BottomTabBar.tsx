"use client"

import { BookOpen, Headphones, House, User, Video } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const tabs = [
  { href: "/", label: "Home", Icon: House },
  { href: "/audio", label: "Audio", Icon: Headphones },
  { href: "/video", label: "Video", Icon: Video },
  { href: "/articles", label: "Articles", Icon: BookOpen },
  { href: "/profile", label: "Profile", Icon: User },
]

export function BottomTabBar() {
  const pathname = usePathname()
  if (pathname.startsWith("/admin")) return null

  return (
    <nav className="tabbar nav-surface fixed bottom-0 inset-x-0 z-40 md:hidden" aria-label="Primary">
      <ul className="flex px-1">
        {tabs.map(({ href, label, Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href))
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`tabbar-item${active ? " is-active" : ""}`}
              >
                {active && <span aria-hidden="true" className="tabbar-notch" />}
                <span className="tabbar-icon">
                  <Icon size={19} strokeWidth={active ? 2.3 : 1.9} />
                </span>
                <span className="tabbar-label">{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
