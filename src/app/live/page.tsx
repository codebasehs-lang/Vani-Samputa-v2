import type { Metadata } from "next"
import { LivePageClient } from "@/components/LivePageClient"

export const metadata: Metadata = { title: "Live" }

export default function LivePage() {
  return <LivePageClient />
}
