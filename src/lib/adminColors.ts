// One accent color per admin section, reused for sidebar icons, page action
// buttons, and badge chips so each section reads as its own "world" while
// staying on a shared, deliberate palette (not ad-hoc per-component colors).
export const ADMIN_COLORS = {
  dashboard:  "#6366f1", // indigo
  lectures:   "#0ea5e9", // sky
  import:     "#10b981", // emerald
  categories: "#f59e0b", // amber
  quotes:     "#8b5cf6", // violet
  youtube:    "#ef4444", // red
  articles:   "#14b8a6", // teal
  about:      "#64748b", // slate
  live:       "#ec4899", // pink
} as const

export function adminGradient(color: string, angle = 135) {
  return `linear-gradient(${angle}deg, ${color}, color-mix(in oklab, ${color} 65%, black 35%))`
}
