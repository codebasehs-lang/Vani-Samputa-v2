"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

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
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="surface-panel w-full max-w-sm p-8">
        <div className="mb-6 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/branding/logo-192.png" alt="Vāṇī Saṃpuṭa" className="mx-auto h-20 w-20 rounded-full object-cover" />
          <h1 className="font-serif mt-2 text-2xl font-bold text-[var(--foreground)]">
            Create account
          </h1>
          <p className="font-iast mt-1 text-sm text-[var(--muted)]">Join Vāṇī Saṃpuṭa</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="field-input w-full px-4 py-2.5 text-sm"
          />
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
            placeholder="Password (min 8 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
            className="field-input w-full px-4 py-2.5 text-sm"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="btn-accent w-full py-2.5 text-sm disabled:opacity-60"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-[var(--muted)]">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[var(--accent)]">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
