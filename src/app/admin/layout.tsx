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
    <div className="min-h-full bg-[var(--background)]">
      <AdminSidebar />
      <main className="min-h-full px-4 py-6 sm:px-6 lg:ml-64 lg:px-8">{children}</main>
    </div>
  )
}
