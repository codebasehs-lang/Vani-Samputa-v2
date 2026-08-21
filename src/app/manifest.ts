import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vāṇī Saṃpuṭa",
    short_name: "VāṇīSaṃ",
    description: "Spiritual lectures by HH Haladhara Swami Maharaja — audio, video & articles",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#1a1a3e",
    theme_color: "#4A5D8F",
    categories: ["education", "lifestyle", "music"],
    icons: [
      { src: "/branding/logo-192.png", sizes: "192x192", type: "image/png" },
      { src: "/branding/logo-512.png", sizes: "512x512", type: "image/png" },
      { src: "/branding/logo-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    screenshots: [],
  }
}
