export const ABOUT_SLUGS = [
  "about-his-holiness-haladhara-swami",
  "about-preaching-mission",
  "about-founder-of-taptajivanam",
] as const

export const ABOUT_SLUG_PREFIX = "about-"

export function isAboutSlug(slug: string) {
  return slug.toLowerCase().startsWith(ABOUT_SLUG_PREFIX)
}