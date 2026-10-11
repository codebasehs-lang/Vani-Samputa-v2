type Props = {
  className?: string
  animated?: boolean
}

// The source PNG has ~9% transparent padding around the emblem, so the image is
// scaled up inside a clipped circle to let the gold ring sit flush against it.
export function BrandLogo({ className = "", animated = true }: Props) {
  return (
    <span
      className={`brand-logo relative inline-block shrink-0 overflow-hidden rounded-full bg-black ${animated ? "" : "brand-logo-static"} ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/branding/logo-192.png"
        srcSet="/branding/logo-192.png 1x, /branding/logo-512.png 3x"
        alt="Vani Samputa"
        className="h-full w-full scale-[1.2] object-cover"
      />
    </span>
  )
}
