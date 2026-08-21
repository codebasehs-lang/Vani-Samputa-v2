import type { Metadata } from "next"
import { AboutEditorForm } from "@/components/admin/AboutEditorForm"

export const metadata: Metadata = { title: "New About Section" }

export default function NewAboutSectionPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-[var(--foreground)]">New About Section</h1>
      <AboutEditorForm mode="create" />
    </div>
  )
}