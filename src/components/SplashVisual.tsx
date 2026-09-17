import Image from "next/image"

export function SplashVisual({
  className = "",
  subtitle = "Loading Vāṇī Saṃpuṭa",
}: {
  className?: string
  subtitle?: string
}) {
  return (
    <div className={`splash-stage flex h-full w-full items-center justify-center ${className}`}>
      <div className="flex flex-col items-center gap-5 md:gap-6">
        <div className="relative flex h-24 w-24 items-center justify-center md:h-32 md:w-32">
          <span className="splash-glow-ring" aria-hidden />
          <span className="splash-orbit-ring" aria-hidden />
          <Image
            src="/branding/logo-192-clean.png"
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
