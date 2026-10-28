import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getStratusAudioSource } from "@/lib/stratusAudio"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: RouteContext<"/api/audio/[id]">) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  }

  const { id } = await params
  const lecture = await prisma.lecture.findFirst({
    where: { id, mediaType: "AUDIO" },
    select: { url: true },
  })

  if (!lecture) return NextResponse.json({ error: "Audio lecture not found" }, { status: 404 })

  const signerUrlValue = process.env.CATALYST_AUDIO_SIGNER_URL
  const signerSecret = process.env.CATALYST_AUDIO_SIGNER_SECRET
  const bucketOriginValue = process.env.STRATUS_AUDIO_BUCKET_ORIGIN
  if (!signerUrlValue || !signerSecret || !bucketOriginValue) {
    return NextResponse.json({ error: "Audio service is not configured" }, { status: 503 })
  }

  let signerUrl: URL
  try {
    signerUrl = new URL(signerUrlValue)
  } catch {
    return NextResponse.json({ error: "Audio service configuration is invalid" }, { status: 503 })
  }

  const source = getStratusAudioSource(lecture.url, bucketOriginValue)
  if (!source) {
    return NextResponse.json({ error: "Audio source is invalid" }, { status: 422 })
  }

  if (
    signerUrl.protocol !== "https:"
    || signerUrl.username
    || signerUrl.password
    || signerUrl.hash
  ) {
    return NextResponse.json({ error: "Audio service configuration is invalid" }, { status: 503 })
  }

  signerUrl.searchParams.set("key", source.objectKey)
  let signerResponse: Response
  try {
    signerResponse = await fetch(signerUrl, {
      headers: {
        Accept: "application/json",
        "X-Audio-Signer-Secret": signerSecret,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    })
  } catch (error) {
    console.error("Could not contact the audio URL signer.", {
      name: error instanceof Error ? error.name : "UnknownError",
    })
    return NextResponse.json({ error: "Audio signing service is unavailable" }, { status: 502 })
  }

  if (!signerResponse.ok) {
    console.error("Audio URL signer returned an error.", { status: signerResponse.status })
    return NextResponse.json({ error: "Audio signing service is unavailable" }, { status: 502 })
  }

  let signedUrlValue: unknown
  try {
    const payload: unknown = await signerResponse.json()
    if (typeof payload !== "object" || payload === null || !("url" in payload)) {
      return NextResponse.json({ error: "Audio signing service returned an invalid response" }, { status: 502 })
    }
    signedUrlValue = payload.url
  } catch (error) {
    console.error("Could not read the audio URL signer response.", {
      name: error instanceof Error ? error.name : "UnknownError",
    })
    return NextResponse.json({ error: "Audio signing service returned an invalid response" }, { status: 502 })
  }

  let signedUrl: URL
  try {
    if (typeof signedUrlValue !== "string") throw new Error("Missing signed URL")
    signedUrl = new URL(signedUrlValue)
  } catch {
    return NextResponse.json({ error: "Audio signing service returned an invalid URL" }, { status: 502 })
  }

  if (signedUrl.protocol !== "https:" || signedUrl.origin !== new URL(source.url).origin) {
    return NextResponse.json({ error: "Audio signing service returned an invalid URL" }, { status: 502 })
  }

  const range = request.headers.get("range")
  let upstream: Response
  try {
    upstream = await fetch(signedUrl, {
      headers: range ? { range } : undefined,
      cache: "no-store",
    })
  } catch (error) {
    console.error("Could not fetch the signed audio object.", {
      name: error instanceof Error ? error.name : "UnknownError",
    })
    return NextResponse.json({ error: "Audio source is unavailable" }, { status: 502 })
  }

  if (!upstream.ok && upstream.status !== 206) {
    return NextResponse.json({ error: "Audio source is unavailable" }, { status: 502 })
  }

  const headers = new Headers()
  headers.set("Cache-Control", "private, no-store")
  headers.set("Content-Type", upstream.headers.get("content-type") ?? "audio/mpeg")
  headers.set("Accept-Ranges", upstream.headers.get("accept-ranges") ?? "bytes")
  for (const header of ["content-length", "content-range"]) {
    const value = upstream.headers.get(header)
    if (value) headers.set(header, value)
  }
  if (request.nextUrl.searchParams.has("download")) {
    headers.set("Content-Disposition", 'attachment; filename="vani-samputa-lecture.mp3"')
  }

  return new NextResponse(upstream.body, { status: upstream.status, headers })
}
