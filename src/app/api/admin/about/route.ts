import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/adminAuth"
import { prisma } from "@/lib/prisma"
import { isAboutSlug } from "@/lib/aboutContent"

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export async function GET() {
  const guard = await requireAdmin()
  if (guard.response) return guard.response

  const sections = await prisma.article.findMany({
    where: { slug: { startsWith: "about-" } },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(sections)
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard.response) return guard.response

  const input = await req.json()
  const title = readString(input.title)
  const slug = normalizeSlug(readString(input.slug))
  const body = readString(input.body)
  const excerpt = readString(input.excerpt)
  const coverUrl = readString(input.coverUrl)

  if (!title || !slug || !body) {
    return NextResponse.json({ error: "Title, slug and body are required." }, { status: 400 })
  }

  if (!isAboutSlug(slug)) {
    return NextResponse.json({ error: "About slug must start with about-." }, { status: 400 })
  }

  const existing = await prisma.article.findUnique({ where: { slug } })
  if (existing) {
    return NextResponse.json({ error: "Slug already exists." }, { status: 409 })
  }

  const section = await prisma.article.create({
    data: {
      title,
      slug,
      body,
      excerpt: excerpt || null,
      coverUrl: coverUrl || null,
      publishedAt: new Date(),
    },
  })

  return NextResponse.json(section)
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard.response) return guard.response

  const slugParam = req.nextUrl.searchParams.get("slug")
  const slug = normalizeSlug(readString(slugParam))
  if (!slug || !isAboutSlug(slug)) {
    return NextResponse.json({ error: "Valid about slug is required." }, { status: 400 })
  }

  const input = await req.json()
  const title = readString(input.title)
  const body = readString(input.body)
  const excerpt = readString(input.excerpt)
  const coverUrl = readString(input.coverUrl)

  if (!title || !body) {
    return NextResponse.json({ error: "Title and body are required." }, { status: 400 })
  }

  const existing = await prisma.article.findUnique({ where: { slug } })
  if (!existing || !isAboutSlug(existing.slug)) {
    return NextResponse.json({ error: "About section not found." }, { status: 404 })
  }

  const section = await prisma.article.update({
    where: { slug },
    data: {
      title,
      body,
      excerpt: excerpt || null,
      coverUrl: coverUrl || null,
      publishedAt: existing.publishedAt ?? new Date(),
    },
  })

  return NextResponse.json(section)
}