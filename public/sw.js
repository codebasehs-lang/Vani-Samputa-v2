const VERSION = "vani-samputa-v11"
const PRECACHE = `${VERSION}-precache`
const RUNTIME = `${VERSION}-runtime`
const AUDIO_CACHE = "vani-samputa-audio-v1"
const APP_SHELL = ["/", "/audio", "/video", "/events", "/live", "/manifest.webmanifest"]
const SPLASH_ASSETS = [
  "/branding/logo-192.png",
  "/branding/splash/madhava.webp",
  "/branding/splash/srila-prabhupada.webp",
  "/branding/splash/srila-gurudeva.webp",
  "/branding/splash/gurudeva.webp",
]

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(PRECACHE).then((cache) => cache.addAll([...APP_SHELL, ...SPLASH_ASSETS])))
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key.startsWith("vani-samputa-") && ![PRECACHE, RUNTIME, AUDIO_CACHE].includes(key))
        .map((key) => caches.delete(key))
    ))
  )
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== "GET" || url.origin !== self.location.origin) return
  // Session, application data, and RSC payloads must always reflect the current user.
  if (url.pathname.startsWith("/api/") || request.headers.get("RSC") === "1" || url.searchParams.has("_rsc")) return
  const isPublicPage = APP_SHELL.includes(url.pathname)

  if (request.mode === "navigate") {
    if (!isPublicPage) return
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && !/no-store|private/i.test(response.headers.get("Cache-Control") || "")) {
            const copy = response.clone()
            event.waitUntil(caches.open(RUNTIME).then((cache) => cache.put(request, copy)))
          }
          return response
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
    )
    return
  }

  const isStaticAsset = url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/_next/image") ||
    url.pathname.startsWith("/branding/") ||
    url.pathname.startsWith("/images/") ||
    url.pathname === "/manifest.webmanifest"
  if (!isStaticAsset) return
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (response.ok && !/no-store|private/i.test(response.headers.get("Cache-Control") || "")) {
        const copy = response.clone()
        event.waitUntil(caches.open(RUNTIME).then((cache) => cache.put(request, copy)))
      }
      return response
    }))
  )
})

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {}
  event.waitUntil(
    self.registration.showNotification(data.title || "Vani Samputa", {
      body: data.body || "A new live stream is available.",
      data: { url: data.url || "/live" },
    })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = new URL(event.notification.data?.url || "/live", self.location.origin).href
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const client = clients.find((item) => "focus" in item)
      if (client) {
        client.navigate(url)
        return client.focus()
      }
      return self.clients.openWindow(url)
    })
  )
})