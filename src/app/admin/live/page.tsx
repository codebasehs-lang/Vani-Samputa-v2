import { prisma } from "@/lib/prisma"
import { LiveConfigForm } from "@/components/admin/LiveConfigForm"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Live Config" }

export default async function AdminLivePage() {
  const config = await prisma.liveConfig.findFirst()

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-bold text-[var(--foreground)]">Live Config</h1>
      <LiveConfigForm
        channelId={config?.channelId ?? ""}
        streamUrl={config?.streamUrl ?? ""}
        isLive={config?.isLive ?? false}
        autoFetch={config?.autoFetch ?? true}
        id={config?.id}
      />
    </div>
  )
}
