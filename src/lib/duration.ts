export function parseDuration(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value)
  if (typeof value !== "string") return null

  const input = value.trim()
  if (!input) return null
  if (/^\d+$/.test(input)) return Number(input)

  const parts = input.split(":").map(Number)
  if (parts.some((part) => !Number.isFinite(part) || part < 0)) return null
  if (parts.length === 2) return Math.round(parts[0] * 60 + parts[1])
  if (parts.length === 3) return Math.round(parts[0] * 3600 + parts[1] * 60 + parts[2])
  return null
}