import { auth } from "@/auth"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = { title: { default: "Admin", template: "%s — Admin" } }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const role = (session?.user as { role?: string } | undefined)?.role
  if (role !== "ADMIN") redirect("/login")

  return (
    <div className="admin-shell-bg min-h-full min-w-0">
      <AdminSidebar />
      <main className="min-h-full min-w-0 lg:ml-64">
        <div className="admin-content-surface min-h-[calc(100dvh-3.5rem)] min-w-0 px-3 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  )
}
