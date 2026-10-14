import type { Metadata, Viewport } from "next";
import { Crimson_Text, Inter, Noto_Serif_Devanagari } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Header } from "@/components/Header";
import { BottomTabBar } from "@/components/BottomTabBar";
import { UserShell } from "@/components/UserShell";
import { AudioEngine } from "@/components/player/AudioEngine";
import { MiniPlayer } from "@/components/player/MiniPlayer";
import { FullScreenPlayer } from "@/components/player/FullScreenPlayer";
import { VideoStage } from "@/components/player/VideoStage";
import { FirstVisitSplash } from "@/components/FirstVisitSplash";

// Run during HTML parsing, not hydration, to cover the first installed-app paint.
const pwaLaunchScript = `(function(){var installed=window.matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;if(installed&&window.matchMedia("(max-width: 767px)").matches){document.documentElement.setAttribute("data-pwa-launch","");}})();`;
const pwaLaunchStyles = `
html[data-pwa-launch], html[data-pwa-launch] body { background: #101327 !important; overflow: hidden; }
html[data-pwa-launch] body > :not(.pwa-splash) { visibility: hidden; }
html[data-pwa-launch] .pwa-splash-boot {
  display: flex; position: fixed; inset: 0; z-index: 110;
  width: 100%; height: 100%; background-color: #101327; visibility: visible;
}`;

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

export const viewport: Viewport = {
  themeColor: [
    { media: "(display-mode: standalone)", color: "#101327" },
    { color: "#FFF8F0" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: pwaLaunchStyles }} />
        <script dangerouslySetInnerHTML={{ __html: pwaLaunchScript }} />
      </head>
      <body className={`${inter.variable} ${crimson.variable} ${devanagari.variable} min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]`}>
        <FirstVisitSplash />
        <Providers>
          <Header />
          {/* pb-36 = tab bar (64px) + floating mini-player dock (~76px) on mobile; md:pb-24 = dock only */}
          <main className="app-main-bg flex-1 pb-36 md:pb-24">
            <UserShell>{children}</UserShell>
          </main>
          <BottomTabBar />
          <AudioEngine />
          <MiniPlayer />
          <FullScreenPlayer />
          <VideoStage />
        </Providers>
      </body>
    </html>
  );
}
