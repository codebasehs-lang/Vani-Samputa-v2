/**
 * Seed script — populates DB from v1 library data.
 * Run with: npm run db:seed
 *
 * TODO 1.16: import libraryData.js / englishAudioData.generated.json and insert
 * Lectures + Playlists via prisma.lecture.createMany / prisma.playlist.createMany.
 */
import "dotenv/config"
import { PrismaMariaDb } from "@prisma/adapter-mariadb"
import { PrismaClient } from "../src/generated/prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(process.env.DATABASE_URL!),
})

async function main() {
  console.log("🌱  Starting seed…")

  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@vani-samputa.local"
  const adminPassword = process.env.ADMIN_PASSWORD ?? "Gopal@108"
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } })
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        name: "admin",
        email: adminEmail,
        password: await bcrypt.hash(adminPassword, 12),
        role: "ADMIN",
      },
    })
    console.log(`✅  Initial admin created: ${adminEmail}`)
  } else if (existingAdmin.role !== "ADMIN") {
    await prisma.user.update({ where: { id: existingAdmin.id }, data: { name: "admin", role: "ADMIN" } })
    console.log(`✅  Existing user promoted to admin: ${adminEmail}`)
  } else {
    console.log(`ℹ️  Admin already exists: ${adminEmail}`)
  }

  // Seed a default LiveConfig row if none exists
  const existing = await prisma.liveConfig.count()
  if (!existing) {
    await prisma.liveConfig.create({
      data: {
        channelId: process.env.YOUTUBE_CHANNEL_ID ?? "",
        autoFetch: true,
      },
    })
    console.log("✅  LiveConfig created")
  }

  const aboutArticles = [
    {
      slug: "about-his-holiness-haladhara-swami",
      title: "His Holiness Haladhara Swami",
      excerpt:
        "Born and brought up in Odisha, he came in touch with ISKCON Bhubaneswar in 1992 and was initiated in 1994.",
      body:
        "His Holiness Haladhara Swami was born and brought up in Odisha, India. He came into contact with the devotees at ISKCON Bhubaneswar temple in 1992 and was initiated in 1994, receiving the name Halayudha Dasa. Soon after joining the temple as a full-time devotee, he rendered service in the traveling sankirtana party.\n\nHe also served as the head pujari of Sri Sri Krishna-Balarama Temple in Bhubaneswar, Odisha. Following the personal instructions of his spiritual master, he began preaching the teachings of Srimad Bhagavatam in Oriya.\n\nHis Holiness Haladhara Swami primarily preaches in Oriya, Hindi, and English.",
      coverUrl: "/branding/gurudeva-1.jpg",
    },
    {
      slug: "about-preaching-mission",
      title: "Preaching Mission",
      excerpt:
        "He accepted sannyasa in 2016 and continues to travel widely to share the teachings of Srila Prabhupada and his spiritual master.",
      body:
        "His selfless mood, loving service, and inspiring dedication led to his acceptance of the renounced order of life, sannyasa, on March 20, 2016, from His Holiness Radha Govinda Swami Maharaja at the Sri Sri Krishna-Balarama Temple in ISKCON Bhubaneswar.\n\nHis Holiness Haladhara Swami frequently travels to various European and Asian countries to propagate the glories and teachings of His Divine Grace A.C. Bhaktivedanta Swami Prabhupada and his revered spiritual master, Srila Gour Govinda Swami.\n\nThroughout his devotional life, His Holiness Haladhara Swami has exemplified the principle of simple living and high thinking, and strongly emphasizes the importance of serving the spiritual master and chanting the holy names of the Lord without compromise.",
      coverUrl: "/branding/gurudeva-2.jpg",
    },
    {
      slug: "about-founder-of-taptajivanam",
      title: "Founder of Taptajivanam",
      excerpt:
        "In 2019 he expressed a desire to create a platform where lectures of his spiritual master would be available for everyone.",
      body:
        "In 2019, during His Holiness Haladhara Swami's European tour in France at ISKCON New Mayapura, he expressed his cherished desire to create a platform where all audio lectures of his spiritual master would be available for everyone.\n\nIn 2020, with the assistance of his disciples and followers, he began curating daily selections of quotes and lectures, and transforming them into short audio clips that carry the essence of his Gurudeva's teachings.",
      coverUrl: "/branding/gurudeva-3.jpg",
    },
  ]

  await Promise.all(
    aboutArticles.map((article) =>
      prisma.article.upsert({
        where: { slug: article.slug },
        update: {
          title: article.title,
          excerpt: article.excerpt,
          body: article.body,
          coverUrl: article.coverUrl,
          publishedAt: new Date(),
        },
        create: {
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          body: article.body,
          coverUrl: article.coverUrl,
          publishedAt: new Date(),
        },
      })
    )
  )
  console.log("✅  About articles upserted")

  console.log("🌱  Seed complete")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
