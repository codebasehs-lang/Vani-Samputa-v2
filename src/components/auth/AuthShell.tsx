"use client"

import { useState, type InputHTMLAttributes, type ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { Eye, EyeOff, type LucideIcon } from "lucide-react"
import { GURUS, MADHAVA, Portrait } from "@/components/home/HeroParampara"

type AuthShellProps = {
  eyebrow: string
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}

export function AuthShell({ eyebrow, title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <aside className="auth-aside">
          <div className="auth-aside-inner">
            <Link href="/" className="auth-logo" aria-label="Vāṇī Saṃpuṭa home">
              <Image src="/branding/logo-192.png" alt="" width={56} height={56} priority />
              <span>
                <span className="auth-logo-name">Vāṇī Saṃpuṭa</span>
                <span className="auth-logo-sub">HH Haladhara Svāmī</span>
              </span>
            </Link>

            <div className="auth-parampara">
              <div className="auth-deity">
                <svg className="auth-mandala" viewBox="0 0 200 200" aria-hidden="true">
                  {Array.from({ length: 12 }, (_, i) => (
                    <ellipse key={i} cx="100" cy="100" rx="92" ry="34" transform={`rotate(${i * 15} 100 100)`} />
                  ))}
                  <circle cx="100" cy="100" r="96" />
                  <circle cx="100" cy="100" r="60" />
                </svg>
                <span className="auth-deity-halo" aria-hidden="true" />
                <span className="auth-deity-ring" aria-hidden="true" />
                <span className="auth-deity-frame">
                  <Portrait figure={MADHAVA} sizes="176px" priority />
                </span>
              </div>

              <ul className="auth-gurus" aria-label="Guru-paramparā">
                {[...GURUS].reverse().map((g) => (
                  <li key={g.src} className="auth-guru">
                    <Portrait figure={g} sizes="56px" priority />
                  </li>
                ))}
              </ul>

              <p className="auth-verse">guru-mukha-padma-vakya, cittete koriya aikya...</p>
              <span className="auth-ornament" aria-hidden="true"><i />✦<i /></span>
            </div>
          </div>
        </aside>

        <section className="auth-main">
          <header className="auth-head">
            <p className="auth-eyebrow">{eyebrow}</p>
            <h1 className="auth-title">{title}</h1>
            <p className="auth-subtitle">{subtitle}</p>
          </header>
          {children}
          <div className="auth-footer">{footer}</div>
        </section>
      </div>
    </div>
  )
}

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  icon: LucideIcon
}

export function AuthField({ label, icon: Icon, type = "text", id, ...rest }: AuthFieldProps) {
  const [reveal, setReveal] = useState(false)
  const isPassword = type === "password"
  const fieldId = id ?? `auth-${label.toLowerCase().replace(/\W+/g, "-")}`
  return (
    <div className="auth-field">
      <label className="auth-field-label" htmlFor={fieldId}>{label}</label>
      <span className="auth-field-box">
        <Icon size={17} className="auth-field-icon" aria-hidden="true" />
        <input id={fieldId} type={isPassword && reveal ? "text" : type} {...rest} />
        {isPassword && (
          <button
            type="button"
            className="auth-field-toggle"
            onClick={() => setReveal((v) => !v)}
            aria-label={reveal ? "Hide password" : "Show password"}
          >
            {reveal ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        )}
      </span>
    </div>
  )
}

export function AuthDivider({ children }: { children: ReactNode }) {
  return (
    <div className="auth-divider">
      <i />
      <span>{children}</span>
      <i />
    </div>
  )
}
