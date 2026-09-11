import type { Metadata } from "next";
import { Crimson_Text, Inter, Noto_Serif_Devanagari } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Header } from "@/components/Header";
import { BottomTabBar } from "@/components/BottomTabBar";
import { UserShell } from "@/components/UserShell";
import { AudioEngine } from "@/components/player/AudioEngine";
import { MiniPlayer } from "@/components/player/MiniPlayer";
import { FullScreenPlayer } from "@/components/player/FullScreenPlayer";
import { FloatingVideoPlayer } from "@/components/player/FloatingVideoPlayer";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const crimson = Crimson_Text({
  variable: "--font-crimson",
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
});
const devanagari = Noto_Serif_Devanagari({
  variable: "--font-noto-devanagari",
  subsets: ["devanagari"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Vāṇī Saṃpuṭa",
    template: "%s — Vāṇī Saṃpuṭa",
  },
  description:
    "Spiritual lectures by HH Haladhara Svāmī Mahārāja — audio, video & transcriptions in Odia, Hindi, English and Sanskrit.",
  metadataBase: new URL(process.env.AUTH_URL ?? "http://localhost:3000"),
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VāṇīSaṃ",
  },
  icons: {
    icon: [
      { url: "/branding/logo-192.png", type: "image/png", sizes: "192x192" },
      { url: "/branding/logo-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/branding/logo-192.png",
  },
  formatDetection: { telephone: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.variable} ${crimson.variable} ${devanagari.variable} min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]`}>
        <Providers>
          <Header />
          {/* pb-32 = tab bar (64px) + mini-player (72px) on mobile; md:pb-20 = mini-player only */}
          <main className="app-main-bg flex-1 pb-32 md:pb-20">
            <UserShell>{children}</UserShell>
          </main>
          <BottomTabBar />
          <AudioEngine />
          <MiniPlayer />
          <FullScreenPlayer />
          <FloatingVideoPlayer />
        </Providers>
      </body>
    </html>
  );
}
