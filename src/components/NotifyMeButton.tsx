"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { BellRinging, BellSlash } from "phosphor-react"

export function NotifyMeButton() {
  const { data: session } = useSession()
  const [subscribed, setSubscribed] = useState(false)
  const [busy, setBusy] = useState(false)
  const router = useRouter()
  const supported = typeof window !== "undefined" && "PushManager" in window && "serviceWorker" in navigator

  useEffect(() => {
    // Check if already subscribed
    navigator.serviceWorker?.ready.then((reg) =>
      reg.pushManager?.getSubscription().then((sub) => setSubscribed(!!sub))
    ).catch(() => {})
  }, [])

  async function toggle() {
    if (!session) { router.push("/login"); return }
    if (!supported) return
    setBusy(true)

    try {
      const reg = await navigator.serviceWorker.ready

      if (subscribed) {
        const sub = await reg.pushManager.getSubscription()
        if (sub) {
          await sub.unsubscribe()
          const response = await fetch("/api/push/subscribe", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          })
          if (!response.ok) throw new Error("Could not remove subscription")
        }
        setSubscribed(false)
      } else {
        const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!publicKey) throw new Error("Push notifications are not configured")

        const perm = await Notification.requestPermission()
        if (perm !== "granted") return

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        })
        const response = await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sub.toJSON()),
        })
        if (!response.ok) throw new Error("Could not save subscription")
        setSubscribed(true)
      }
    } catch (error) {
      console.error("Push subscription failed", error)
    }
    finally { setBusy(false) }
  }

  if (!supported) return null

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className="flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium transition-colors hover:border-[var(--saffron)] disabled:opacity-50"
      style={{ color: subscribed ? "var(--saffron)" : "var(--muted)" }}
    >
      {subscribed ? <BellSlash size={16} /> : <BellRinging size={16} />}
      {subscribed ? "Notifications on" : "Notify when live"}
    </button>
  )
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = window.atob(base64)
  return new Uint8Array([...raw].map((c) => c.charCodeAt(0)))
}
