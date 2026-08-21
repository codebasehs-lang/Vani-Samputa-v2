import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/adminAuth"
import { prisma } from "@/lib/prisma"
import { isAboutSlug } from "@/lib/aboutContent"

export async function GET() {
  const guard = await requireAdmin()
  if (guard.response) return guard.response
  const articles = await prisma.article.findMany({
    where: { NOT: { slug: { startsWith: "about-" } } },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(articles)
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard.response) return guard.response

  const { title, slug, body, excerpt, coverUrl } = await req.json()
  if (typeof slug !== "string" || isAboutSlug(slug)) {
    return NextResponse.json({ error: "This slug is reserved for About content." }, { status: 400 })
  }

  const existing = await prisma.article.findUnique({ where: { slug } })
  if (existing) return NextResponse.json({ error: "Slug already exists." }, { status: 409 })

  const article = await prisma.article.create({
    data: {
      title,
      slug,
      body,
      excerpt: excerpt || null,
      coverUrl: coverUrl || null,
      publishedAt: new Date(),
    },
  })
  return NextResponse.json(article)
}

export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard.response) return guard.response
  const id = req.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  await prisma.article.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
