import { prisma } from "@/lib/prisma"
import { LiveConfigForm } from "@/components/admin/LiveConfigForm"
import { Radio } from "lucide-react"
import type { Metadata } from "next"
import { ADMIN_COLORS, adminGradient } from "@/lib/adminColors"

export const metadata: Metadata = { title: "Live Config" }

export default async function AdminLivePage() {
  const config = await prisma.liveConfig.findFirst()

  return (
    <div className="max-w-lg">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full text-white" style={{ background: adminGradient(ADMIN_COLORS.live) }}>
          <Radio size={18} strokeWidth={1.75} />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Live Config</h1>
          <p className="text-xs text-[var(--muted)]">
            {config?.isLive ? "Currently marked as live" : "Not live right now"}
          </p>
        </div>
      </div>
      <div className="admin-panel p-4 sm:p-5">
        <LiveConfigForm
          channelId={config?.channelId ?? ""}
          streamUrl={config?.streamUrl ?? ""}
          isLive={config?.isLive ?? false}
          autoFetch={config?.autoFetch ?? true}
          id={config?.id}
        />
      </div>
    </div>
  )
}
