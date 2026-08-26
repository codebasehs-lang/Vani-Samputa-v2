"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState(() =>
    typeof window === "undefined" ? "" : localStorage.getItem("vani-remembered-email") ?? ""
  )
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(() =>
    typeof window !== "undefined" && !!localStorage.getItem("vani-remembered-email")
  )
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    if (rememberMe) localStorage.setItem("vani-remembered-email", email)
    else localStorage.removeItem("vani-remembered-email")
    const callbackUrl = new URLSearchParams(window.location.search).get("callbackUrl")
    const destination = callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/"
    const result = await signIn("credentials", {
      email, password, redirect: false, callbackUrl: destination,
    })
    setLoading(false)
    if (result?.error) {
      setError("Invalid email or password.")
    } else {
      router.push(destination)
      router.refresh()
    }
  }

  async function handleGoogle() {
    await signIn("google", { callbackUrl: "/" })
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="surface-panel w-full max-w-sm p-8">
        {/* Logo */}
        <div className="mb-6 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/branding/logo-192.png" alt="Vāṇī Saṃpuṭa" className="mx-auto h-20 w-20 rounded-full object-cover" />
          <h1 className="font-serif mt-2 text-2xl font-bold text-[var(--foreground)]">
            Welcome back
          </h1>
          <p className="font-iast mt-1 text-sm text-[var(--muted)]">Sign in to Vāṇī Saṃpuṭa</p>
        </div>

        {/* Google OAuth */}
        <button
          onClick={handleGoogle}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--accent)]/5"
        >
          <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/><path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.347 2.825.957 4.039l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
          Continue with Google
        </button>

        <div className="mb-4 flex items-center gap-3">
          <div className="flex-1 border-t border-[var(--border)]" />
          <span className="text-xs text-[var(--muted)]">or</span>
          <div className="flex-1 border-t border-[var(--border)]" />
        </div>

        {/* Email/password form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="field-input w-full px-4 py-2.5 text-sm"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="field-input w-full px-4 py-2.5 text-sm"
          />
          <label className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 accent-[var(--accent)]"
            />
            Remember me on this device
          </label>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="btn-accent w-full py-2.5 text-sm disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-[var(--muted)]">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-[var(--accent)]">
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}
