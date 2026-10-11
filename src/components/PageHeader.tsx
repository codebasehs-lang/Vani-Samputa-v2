import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

type Crumb = { label: string; href?: string }
type Meta = { label: string; icon?: LucideIcon }

const PETALS = Array.from({ length: 12 }, (_, i) => i * 30)

/** Navy + gold page banner shared by all inner pages. */
export function PageHeader({
  eyebrow,
  title,
  description,
  align = "left",
  icon: Icon,
  media,
  crumbs,
  meta,
  children,
}: {
  eyebrow?: string
  title: string
  description?: ReactNode
  align?: "left" | "center"
  icon?: LucideIcon
  /** Custom artwork (e.g. a playlist cover) shown instead of the icon tile. */
  media?: ReactNode
  crumbs?: Crumb[]
  meta?: Meta[]
  children?: ReactNode
}) {
  return (
    <header className="page-hero mb-8" data-align={align}>
      <span className="page-hero-glow" aria-hidden="true" />
      <svg className="page-hero-mandala" viewBox="-100 -100 200 200" aria-hidden="true">
        <circle r="96" />
        <circle r="70" />
        <circle r="22" />
        {PETALS.map((deg) => (
          <ellipse key={deg} rx="14" ry="44" cy="-46" transform={`rotate(${deg})`} />
        ))}
      </svg>

      <div className="page-hero-inner">
        {crumbs && crumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="page-hero-crumbs">
            {crumbs.map((c, i) => (
              <span key={`${c.label}-${i}`} className="inline-flex items-center gap-1.5">
                {i > 0 && <span aria-hidden="true" className="opacity-50">/</span>}
                {c.href ? <Link href={c.href}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}
              </span>
            ))}
          </nav>
        )}

        <div className="page-hero-row">
          {media}
          {!media && Icon && (
            <span className="page-hero-icon" aria-hidden="true">
              <Icon size={24} />
            </span>
          )}
          <div className="min-w-0">
            {eyebrow && <p className="page-hero-eyebrow">{eyebrow}</p>}
            <h1 className="page-hero-title">{title}</h1>
            {description && <p className="page-hero-desc">{description}</p>}
          </div>
        </div>

        {(meta?.length || children) && (
          <div className="page-hero-foot">
            {meta?.map(({ label, icon: MetaIcon }) => (
              <span key={label} className="page-hero-chip">
                {MetaIcon && <MetaIcon size={13} />}
                {label}
              </span>
            ))}
            {children}
          </div>
        )}
      </div>
    </header>
  )
}
