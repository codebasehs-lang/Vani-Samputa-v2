export function PageHeader({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow?: string
  title: string
  description?: string
  align?: "left" | "center"
}) {
  return (
    <div className={`mb-8 ${align === "center" ? "text-center" : ""}`}>
      {eyebrow && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          {eyebrow}
        </p>
      )}
      <h1 className="font-serif text-3xl font-bold text-[var(--foreground)] sm:text-4xl">{title}</h1>
      {description && <p className="mt-2 text-sm text-[var(--muted)]">{description}</p>}
    </div>
  )
}
