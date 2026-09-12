import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: RouteContext<"/api/audio/[id]">) {
  const { id } = await params
  const lecture = await prisma.lecture.findFirst({
    where: { id, mediaType: "AUDIO" },
    select: { url: true },
  })

  if (!lecture) return NextResponse.json({ error: "Audio lecture not found" }, { status: 404 })

  let source: URL
  try {
    source = new URL(lecture.url)
  } catch {
    return NextResponse.json({ error: "Audio source is invalid" }, { status: 422 })
  }
  if (source.protocol !== "https:" && source.protocol !== "http:") {
    return NextResponse.json({ error: "Audio source is unsupported" }, { status: 422 })
  }

  const range = request.headers.get("range")
  const upstream = await fetch(source, {
    headers: range ? { range } : undefined,
  })
  if (!upstream.ok && upstream.status !== 206) {
    return NextResponse.json({ error: "Audio source is unavailable" }, { status: 502 })
  }

  const headers = new Headers()
  headers.set("Content-Type", upstream.headers.get("content-type") ?? "audio/mpeg")
  headers.set("Accept-Ranges", "bytes")
  for (const header of ["content-length", "content-range"]) {
    const value = upstream.headers.get(header)
    if (value) headers.set(header, value)
  }
  if (request.nextUrl.searchParams.has("download")) {
    headers.set("Content-Disposition", 'attachment; filename="vani-samputa-lecture.mp3"')
  }

  return new NextResponse(upstream.body, { status: upstream.status, headers })
}