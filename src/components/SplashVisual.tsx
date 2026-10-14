import Image from "next/image"
import { ParamparaRow } from "@/components/home/HeroParampara"

export function SplashVisual({
  className = "",
  subtitle = "Loading Vāṇī Saṃpuṭa",
  variant = "default",
  onEnter,
}: {
  className?: string
  subtitle?: string
  variant?: "default" | "pwa"
  onEnter?: () => void
}) {
  if (variant === "pwa") {
    return (
      <div className={`pwa-splash ${className}`} aria-label="Welcome to Vāṇī Saṃpuṭa">
        <div className="pwa-splash-frame" aria-hidden="true" />
        <div className="pwa-splash-content">
          <ParamparaRow variant="splash" />
          <p className="pwa-splash-eyebrow">A treasury of sacred sound</p>
          <div className="pwa-splash-emblem">
            <svg className="pwa-splash-lotus" viewBox="0 0 320 310" fill="none" aria-hidden="true">
              <circle className="pwa-splash-halo" cx="160" cy="106" r="91" />
              <circle className="pwa-splash-orbit" cx="160" cy="106" r="105" strokeDasharray="1 9" />
              <path className="pwa-splash-arch" d="M42 106a118 118 0 0 1 236 0" />
              <g className="pwa-splash-petals">
                {[-72, -48, -24, 0, 24, 48, 72].map((angle) => (
                  <path
                    key={angle}
                    d="M0 0 C-30-42-28-104 0-146 C28-104 30-42 0 0Z"
                    transform={`translate(160 256) rotate(${angle}) scale(.82)`}
                  />
                ))}
                <path d="M160 256C116 236 91 208 86 180c35 4 60 26 74 76Z" />
                <path d="M160 256c44-20 69-48 74-76-35 4-60 26-74 76Z" />
              </g>
              <g className="pwa-splash-water">
                <ellipse cx="160" cy="274" rx="54" ry="5" />
                <ellipse cx="160" cy="274" rx="91" ry="10" />
                <path d="M42 274c32 21 204 21 236 0" />
              </g>
              <g className="pwa-splash-stars">
                <path d="M160 2v12m-6-6h12M35 145v8m-4-4h8M285 145v8m-4-4h8" />
                <circle cx="55" cy="47" r="2" />
                <circle cx="265" cy="47" r="2" />
              </g>
            </svg>
            <Image
              src="/branding/logo-192.png"
              alt="Vāṇī Saṃpuṭa emblem"
              width={192}
              height={192}
              priority
              className="pwa-splash-logo"
            />
          </div>
          <div className="pwa-splash-wordmark">
            <h1>Vāṇī Saṃpuṭa</h1>
            <p>HH Haladhara Svāmī Mahārāja</p>
          </div>
          <div className="pwa-splash-divider" aria-hidden="true"><span /><i /><span /></div>
          <p className="pwa-splash-dedication">In service of Śrī Guru &amp; Gaurāṅga</p>
          <div className="pwa-splash-loading" role="status">
            <span className="pwa-splash-dots" aria-hidden="true"><i /><i /><i /></span>
            <span>Opening your sacred space</span>
          </div>
        </div>
        <footer className="pwa-splash-footer">
          <p>Listen. Reflect. Remember.</p>
          {onEnter && <button type="button" onClick={onEnter}>Enter Vāṇī Saṃpuṭa <span aria-hidden="true">→</span></button>}
        </footer>
      </div>
    )
  }

  return (
    <div className={`splash-stage flex h-full w-full items-center justify-center ${className}`}>
      <div className="flex flex-col items-center gap-5 md:gap-6">
        <div className="relative flex h-24 w-24 items-center justify-center md:h-32 md:w-32">
          <span className="splash-glow-ring" aria-hidden />
          <span className="splash-orbit-ring" aria-hidden />
          <Image
            src="/branding/logo-192.png"
            alt="Vāṇī Saṃpuṭa"
            width={128}
            height={128}
            priority
            className="splash-logo h-20 w-20 rounded-full object-cover md:h-24 md:w-24"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-[var(--muted)] md:text-base">
          <span className="splash-loading-dot" aria-hidden />
          <span>{subtitle}</span>
        </div>
      </div>
    </div>
  )
}
