import { prisma } from "@/lib/prisma"
import { HeroSection } from "@/components/home/HeroSection"
import { SearchBar } from "@/components/home/SearchBar"
import { StatsStrip } from "@/components/home/StatsStrip"
import { DailyVerseWidget } from "@/components/home/DailyVerseWidget"
import { ContinueListening } from "@/components/home/ContinueListening"
import { RecentlyPlayed } from "@/components/home/RecentlyPlayed"
import { FeaturedPlaylists } from "@/components/home/FeaturedPlaylists"

async function getHomeData() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [audioCount, videoCount, playlistCount, todayVerse, featuredPlaylists] = await Promise.all([
    prisma.lecture.count({ where: { mediaType: "AUDIO" } }),
    prisma.lecture.count({ where: { mediaType: "VIDEO" } }),
    prisma.playlist.count(),
    prisma.dailyVerse.findFirst({ where: { date: { gte: today, lt: tomorrow } } }),
    prisma.playlist.findMany({ where: { lectures: { some: {} } }, orderBy: { sortOrder: "asc" }, take: 12 }),
  ])

  return { audioCount, videoCount, playlistCount, todayVerse, featuredPlaylists }
}

export default async function HomePage() {
  const { audioCount, videoCount, playlistCount, todayVerse, featuredPlaylists } =
    await getHomeData()

  return (
    <div>
      <HeroSection />
      <SearchBar />
      <StatsStrip audioCount={audioCount} videoCount={videoCount} playlistCount={playlistCount} />
      <DailyVerseWidget verse={todayVerse} />
      <ContinueListening />
      <RecentlyPlayed />
      <FeaturedPlaylists playlists={featuredPlaylists} />
    </div>
  )
}
