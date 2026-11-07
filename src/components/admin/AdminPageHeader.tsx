import type { LucideIcon } from "lucide-react"
import type { CSSProperties, ReactNode } from "react"

export function AdminPageHeader({ title, section, Icon, color, detail, actions }: {
    title: string
    section: string
    Icon: LucideIcon
    color: string
    detail?: ReactNode
    actions?: ReactNode
}) {
    return (
        <div className="admin-page-header mb-6 flex flex-wrap items-center justify-between gap-4 border-y border-[var(--border)] px-4 py-5 sm:px-5" style={{ "--section-color": color } as CSSProperties}>
            <div className="flex w-full min-w-0 items-center gap-3 sm:w-auto">
                <span className="admin-section-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-lg" style={{ "--section-color": color } as CSSProperties} aria-hidden="true"><Icon size={21} strokeWidth={1.75} /></span>
                <div className="min-w-0">
                    <p className="mb-0.5 text-[11px] font-medium text-[var(--muted)]">{section}</p>
                    <h1 className="break-words text-2xl text-[var(--foreground)] sm:text-3xl">{title}</h1>
                    {detail && <p className="mt-1 text-xs text-[var(--muted)]">{detail}</p>}
                </div>
            </div>
            {actions && <div className="grid w-full min-w-0 grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">{actions}</div>}
        </div>
    )
}
