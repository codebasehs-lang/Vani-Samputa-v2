import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import type { Metadata } from "next"

export const metadata: Metadata = { title: { default: "Admin", template: "%s — Admin" } }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const role = (session?.user as { role?: string } | undefined)?.role
  if (role !== "ADMIN") redirect("/login")

  return (
    <div className="admin-shell-bg min-h-full">
      <AdminSidebar />
      <main className="min-h-full px-4 py-6 sm:px-6 lg:ml-64 lg:px-8">
        <div className="admin-content-surface min-h-[calc(100vh-3rem)] p-4 sm:p-5 lg:p-6">{children}</div>
      </main>
    </div>
  )
}
