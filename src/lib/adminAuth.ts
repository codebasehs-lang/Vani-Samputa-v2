import { auth } from "@/auth"
import { NextResponse } from "next/server"

// Returns { session } if admin, or { response } with error to return early
export async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.email) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }
  const role = (session.user as { role?: string }).role
  if (role !== "ADMIN") {
    return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }
  return { session }
}
