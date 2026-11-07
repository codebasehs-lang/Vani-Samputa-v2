import { requireAdmin } from "@/lib/adminAuth"
import { ensureCategories } from "@/lib/categories"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  const guard = await requireAdmin()
  if (guard.response) return guard.response
  const categories = await prisma.category.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] })
  return NextResponse.json(categories)
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard.response) return guard.response
  const body = await req.json().catch(() => null)
  const name = typeof body?.name === "string" ? body.name.trim() : ""
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 })
  if (name.length > 191) return NextResponse.json({ error: "Name must be 191 characters or fewer" }, { status: 400 })
  try {
    const [category] = await ensureCategories([name])
    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? error.code : null
    if (code === "P2002") return NextResponse.json({ error: "A tag with this name or slug already exists" }, { status: 409 })
    console.error("Failed to create category:", error)
    return NextResponse.json({ error: "Could not create tag" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard.response) return guard.response

  const body = await req.json().catch(() => null)
  const id = typeof body?.id === "string" ? body.id.trim() : ""
  const name = typeof body?.name === "string" ? body.name.trim() : ""
  if (!id || !name) return NextResponse.json({ error: "Tag id and name are required" }, { status: 400 })
  if (name.length > 191) return NextResponse.json({ error: "Name must be 191 characters or fewer" }, { status: 400 })

  try {
    const category = await prisma.$transaction(async (tx) => {
      const current = await tx.category.findUnique({ where: { id } })
      if (!current) return null

      const updated = await tx.category.update({ where: { id }, data: { name } })
      await tx.lecture.updateMany({ where: { category: current.name }, data: { category: name } })
      await tx.playlist.updateMany({ where: { category: current.name }, data: { category: name } })
      return updated
    })

    if (!category) return NextResponse.json({ error: "Tag not found" }, { status: 404 })
    return NextResponse.json(category)
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? error.code : null
    if (code === "P2002") return NextResponse.json({ error: "A tag with this name already exists" }, { status: 409 })
    if (code === "P2025") return NextResponse.json({ error: "Tag not found" }, { status: 404 })
    console.error("Failed to rename category:", error)
    return NextResponse.json({ error: "Could not rename tag" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard.response) return guard.response
  const id = req.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  await prisma.category.update({ where: { id }, data: { active: false } })
  return NextResponse.json({ ok: true })
}
