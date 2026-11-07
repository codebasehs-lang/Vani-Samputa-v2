import { AdminPageHeader } from "@/components/admin/AdminPageHeader"
import { LiveConfigForm } from "@/components/admin/LiveConfigForm"
import { ADMIN_COLORS } from "@/lib/adminColors"
import { prisma } from "@/lib/prisma"
import { Radio } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Live Config" }

export default async function AdminLivePage() {
  const config = await prisma.liveConfig.findFirst()

  return (
    <div className="max-w-3xl">
      <AdminPageHeader title="Live Config" section="Settings" Icon={Radio} color={ADMIN_COLORS.live} detail={config?.isLive ? "Live now" : "Offline"} />
      <div className="border-y border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6">
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
