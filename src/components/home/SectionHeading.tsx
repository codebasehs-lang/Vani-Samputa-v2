import { ArrowRight, type LucideIcon } from "lucide-react"
import Link from "next/link"

export function SectionHeading({
  eyebrow,
  title,
  icon: Icon,
  href,
  actionLabel = "See all",
}: {
  eyebrow: string
  title: string
  icon: LucideIcon
  href?: string
  actionLabel?: string
}) {
  return (
    <div className="section-head">
      <div className="flex items-center gap-3">
        <span className="section-head-icon" aria-hidden="true">
          <Icon size={18} />
        </span>
        <div>
          <p className="section-eyebrow">{eyebrow}</p>
          <h2 className="section-title">{title}</h2>
        </div>
      </div>
      {href && (
        <Link href={href} className="section-action">
          {actionLabel}
          <ArrowRight size={14} />
        </Link>
      )}
    </div>
  )
}
