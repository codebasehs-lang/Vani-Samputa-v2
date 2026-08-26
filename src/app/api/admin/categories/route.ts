import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/adminAuth"
import { categorySlug } from "@/lib/categories"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const guard = await requireAdmin()
  if (guard.response) return guard.response
  const categories = await prisma.category.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] })
  return NextResponse.json(categories)
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard.response) return guard.response
  const name = String((await req.json()).name ?? "").trim()
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 })
  const category = await prisma.category.create({ data: { name, slug: categorySlug(name) } })
  return NextResponse.json(category, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard.response) return guard.response
  const id = req.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  await prisma.category.update({ where: { id }, data: { active: false } })
  return NextResponse.json({ ok: true })
}