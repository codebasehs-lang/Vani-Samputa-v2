import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vāṇī Saṃpuṭa",
    short_name: "VāṇīSaṃ",
    description: "Spiritual lectures by HH Haladhara Svāmī Mahārāja — audio, video & articles",
    start_url: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#FFF8F0",
    theme_color: "#FFF8F0",
    categories: ["education", "lifestyle", "music"],
    icons: [
      { src: "/branding/logo-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/branding/logo-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/branding/logo-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/branding/logo-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    screenshots: [],
  }
}
