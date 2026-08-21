"use client"

import { useEffect } from "react"
import { SessionProvider } from "next-auth/react"
import { InstallPrompt } from "@/components/InstallPrompt"

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return

    if (process.env.NODE_ENV !== "production") {
      void navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => { void reg.unregister() })
      })
      if ("caches" in window) {
        void caches.keys().then((keys) => {
          keys
            .filter((key) => key.startsWith("vani-samputa-"))
            .forEach((key) => { void caches.delete(key) })
        })
      }
      return
    }

    void navigator.serviceWorker.register("/sw.js").catch(() => {})
  }, [])

  return <SessionProvider>{children}<InstallPrompt /></SessionProvider>
}
