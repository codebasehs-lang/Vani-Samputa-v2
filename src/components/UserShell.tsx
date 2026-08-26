"use client"

import { usePathname } from "next/navigation"

// Admin manages its own full-bleed shell/background, so it opts out here.
export function UserShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (pathname.startsWith("/admin")) return <>{children}</>

  return <div className="user-shell-bg min-h-full">{children}</div>
}
