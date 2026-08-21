import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/adminAuth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const guard = await requireAdmin()
  if (guard.response) return guard.response
  const config = await prisma.liveConfig.findFirst()
  return NextResponse.json(config ?? {})
}

export async function PUT(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard.response) return guard.response

  const { id, channelId, streamUrl, isLive, autoFetch } = await req.json()

  const data = { channelId, streamUrl: streamUrl || null, isLive: Boolean(isLive), autoFetch: Boolean(autoFetch) }

  const config = id
    ? await prisma.liveConfig.update({ where: { id }, data })
    : await prisma.liveConfig.create({ data })

  return NextResponse.json(config)
}
