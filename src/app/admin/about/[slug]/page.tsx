import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { isAboutSlug } from "@/lib/aboutContent"
import { AboutEditorForm } from "@/components/admin/AboutEditorForm"

type PageProps = {
  params: Promise<{ slug: string }>
}

export const metadata: Metadata = { title: "Edit About Section" }

export default async function EditAboutSectionPage({ params }: PageProps) {
  const { slug } = await params
  if (!isAboutSlug(slug)) notFound()

  const article = await prisma.article.findUnique({
    where: { slug },
    select: {
      title: true,
      slug: true,
      excerpt: true,
      body: true,
      coverUrl: true,
    },
  })

  if (!article) notFound()

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-[var(--foreground)]">Edit About Section</h1>
      <AboutEditorForm
        mode="edit"
        initial={{
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt ?? "",
          body: article.body,
          coverUrl: article.coverUrl ?? "",
        }}
      />
    </div>
  )
}