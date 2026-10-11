"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, Lock, Mail, User, UserPlus } from "lucide-react"
import { AuthField, AuthShell } from "@/components/auth/AuthShell"

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    })
    if (!res.ok) {
      const { error: msg } = await res.json()
      setError(msg ?? "Registration failed.")
      setLoading(false)
      return
    }
    // Auto sign in
    await signIn("credentials", { email, password, redirect: false })
    setLoading(false)
    router.push("/")
    router.refresh()
  }

  return (
    <AuthShell
      eyebrow="Hare Kṛṣṇa · Svāgatam"
      title="Create account"
      subtitle="Save your progress, playlists and favourite lectures."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="auth-link">Log in</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="auth-form">
        <AuthField
          label="Name"
          icon={User}
          autoComplete="name"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
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
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button type="submit" disabled={loading} className="auth-submit">
          {loading ? <Loader2 size={17} className="animate-spin" /> : <UserPlus size={17} />}
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthShell>
  )
}
