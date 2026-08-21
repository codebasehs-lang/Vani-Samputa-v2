import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/adminAuth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const guard = await requireAdmin()
  if (guard.response) return guard.response

  const [lectureCount, userCount, playlistCount] = await Promise.all([
    prisma.lecture.count(),
    prisma.user.count(),
    prisma.playlist.count(),
  ])
  return NextResponse.json({ lectureCount, userCount, playlistCount })
}
