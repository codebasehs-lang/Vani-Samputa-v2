import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"

export type Crumb = { label: string; href?: string }

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-xs text-[var(--muted)]">
      <Link href="/admin" className="flex items-center gap-1 transition-colors hover:text-[var(--foreground)]">
        <Home size={13} strokeWidth={1.75} />
        Dashboard
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <ChevronRight size={13} strokeWidth={1.75} aria-hidden="true" />
          {item.href ? (
            <Link href={item.href} className="transition-colors hover:text-[var(--foreground)]">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-[var(--foreground)]">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
