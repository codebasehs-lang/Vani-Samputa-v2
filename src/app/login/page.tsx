"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, Lock, LogIn, Mail } from "lucide-react"
import { signInWithGoogle } from "@/app/login/actions"
import { AuthDivider, AuthField, AuthShell } from "@/components/auth/AuthShell"

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

  return (
    <AuthShell
      eyebrow="Hare Kṛṣṇa · Daṇḍavat praṇām"
      title="Welcome back"
      subtitle="Log in to continue hearing from Guru and Gaurāṅga."
      footer={
        <>
          New to Vāṇī Saṃpuṭa?{" "}
          <Link href="/register" className="auth-link">Create an account</Link>
        </>
      }
    >
      <form action={signInWithGoogle}>
        <button type="submit" className="auth-google">
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/><path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.347 2.825.957 4.039l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
          Continue with Google
        </button>
      </form>

      <AuthDivider>or with email</AuthDivider>

      <form onSubmit={handleSubmit} className="auth-form">
        <AuthField
          label="Email"
          icon={Mail}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <AuthField
          label="Password"
          icon={Lock}
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <label className="auth-check">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <span>Remember me on this device</span>
        </label>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button type="submit" disabled={loading} className="auth-submit">
          {loading ? <Loader2 size={17} className="animate-spin" /> : <LogIn size={17} />}
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>
    </AuthShell>
  )
}
