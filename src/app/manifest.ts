import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vāṇī Saṃpuṭa",
    short_name: "VāṇīSaṃ",
    description: "Spiritual lectures by HH Haladhara Svāmī Mahārāja — audio, video & articles",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0f1220",
    theme_color: "#0f1220",
    categories: ["education", "lifestyle", "music"],
    icons: [
      { src: "/branding/logo-192-clean.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/branding/logo-512-clean.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/branding/logo-192-clean.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/branding/logo-512-clean.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    screenshots: [],
  }
}
