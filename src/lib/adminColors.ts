// One accent color per admin section, reused for sidebar icons, page action
// buttons, and badge chips so each section reads as its own "world" while
// staying on a shared, deliberate palette (not ad-hoc per-component colors).
export const ADMIN_COLORS = {
  dashboard: "#2563b5", // royal blue
  lectures: "#0877b6", // azure
  import: "#07845b", // emerald
  categories: "#a66b08", // amber
  quotes: "#ae4c83", // orchid
  youtube: "#ce493f", // coral
  articles: "#087f89", // turquoise
  about: "#516894", // steel blue
  live: "#bc426b", // raspberry
} as const

export function adminGradient(color: string, angle = 135) {
  return `linear-gradient(${angle}deg, ${color}, color-mix(in oklab, ${color} 65%, black 35%))`
}
