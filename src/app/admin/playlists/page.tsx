import { AdminPageHeader } from "@/components/admin/AdminPageHeader"
import { AdminPlaylistsTable } from "@/components/admin/AdminPlaylistsTable"
import { ADMIN_COLORS } from "@/lib/adminColors"
import { ListMusic } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Playlists" }

export default function AdminPlaylistsPage() {
  return (
    <div>
      <AdminPageHeader title="Playlists" section="Library" Icon={ListMusic} color={ADMIN_COLORS.lectures} />
      <p className="mb-6 max-w-2xl text-sm text-[var(--muted)]">
        Video and audio listing pages group playlists by tags. Editing a lecture&apos;s tags only
        affects that lecture — change a playlist&apos;s tags here to move it between sections.
      </p>
      <AdminPlaylistsTable />
    </div>
  )
}
