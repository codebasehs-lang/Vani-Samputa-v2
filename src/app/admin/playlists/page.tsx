import { ListMusic } from "lucide-react"
import type { Metadata } from "next"
import { ADMIN_COLORS, adminGradient } from "@/lib/adminColors"
import { AdminPlaylistsTable } from "@/components/admin/AdminPlaylistsTable"

export const metadata: Metadata = { title: "Playlists" }

export default function AdminPlaylistsPage() {
  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full text-white" style={{ background: adminGradient(ADMIN_COLORS.categories) }}>
          <ListMusic size={18} strokeWidth={1.75} />
        </span>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Playlists</h1>
      </div>
      <p className="mb-6 max-w-2xl text-sm text-[var(--muted)]">
        Video and audio listing pages group playlists by category. Editing a lecture&apos;s category only
        affects that lecture — change a playlist&apos;s category here to move it between sections.
      </p>
      <AdminPlaylistsTable />
    </div>
  )
}
