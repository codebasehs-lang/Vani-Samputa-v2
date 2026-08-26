import { prisma } from "@/lib/prisma"

export function parseCategoryNames(value: unknown): string[] {
  if (typeof value !== "string") return []
  return [...new Set(value.split(",").map((name) => name.trim()).filter(Boolean))]
}

export function categorySlug(name: string): string {
  return name.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

export async function ensureCategories(names: string[]) {
  return Promise.all(names.map((name) => prisma.category.upsert({
    where: { name },
    update: { active: true },
    create: { name, slug: categorySlug(name) },
  })))
}

export async function validateCategories(names: string[]) {
  const categories = await prisma.category.findMany({
    where: { name: { in: names }, active: true },
    select: { name: true },
  })
  const existing = new Set(categories.map((category) => category.name))
  return names.filter((name) => !existing.has(name))
}

export function categoryConnect(names: string[]) {
  return { connect: names.map((name) => ({ name })) }
}