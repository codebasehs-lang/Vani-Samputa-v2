import Image from "next/image"
import type { CSSProperties } from "react"

type Figure = {
  src: string
  name: string
  position: string
  zoom?: { scale: number; origin: string }
}

export const MADHAVA: Figure = {
  src: "/images/hero/madhava.png",
  name: "Śrī Mādhava",
  position: "50% 50%",
  zoom: { scale: 1.18, origin: "54% 58%" },
}

// Paramparā order: Śrīla Prabhupāda → Śrīla Gurudeva → Gurudeva
export const GURUS: Figure[] = [
  { src: "/images/hero/srila-prabhupada.png", name: "Śrīla Prabhupāda", position: "50% 8%" },
  {
    src: "/images/hero/srila-gurudeva.png",
    name: "Śrīla Gurudeva",
    position: "100% 20%",
    zoom: { scale: 1.2, origin: "60% 30%" },
  },
  {
    src: "/images/hero/gurudeva.png",
    name: "Gurudeva",
    position: "50% 0%",
    zoom: { scale: 1.12, origin: "56% 32%" },
  },
]

export function Portrait({ figure, sizes, priority }: { figure: Figure; sizes: string; priority?: boolean }) {
  const style: CSSProperties = { objectPosition: figure.position }
  if (figure.zoom) {
    style.transform = `scale(${figure.zoom.scale})`
    style.transformOrigin = figure.zoom.origin
  }
  return <Image src={figure.src} alt={figure.name} fill sizes={sizes} priority={priority} loading={priority ? undefined : "eager"} style={style} />
}

export function HeroFigures() {
  return (
    <div className="hero-figures">
      <figure className="hero-deity">
        <span className="hero-deity-halo" aria-hidden="true" />
        <span className="hero-deity-ring" aria-hidden="true" />
        <span className="hero-deity-frame">
          <Portrait figure={MADHAVA} sizes="208px" priority />
        </span>
      </figure>

      <div className="hero-gurus">
        <svg className="hero-gurus-thread" viewBox="0 0 312 208" aria-hidden="true">
          <path d="M252 60 C 210 64, 185 104, 153 110 S 95 140, 67 150" />
        </svg>
        {GURUS.map((g, i) => (
          <figure key={g.src} className="hero-guru" data-i={i}>
            <span className="hero-guru-frame">
              <Portrait figure={g} sizes="144px" priority />
            </span>
          </figure>
        ))}
      </div>
    </div>
  )
}

export function ParamparaRow() {
  return (
    <div className="hero-parampara" aria-label="Śrī Mādhava, Śrīla Prabhupāda, Śrīla Gurudeva and Gurudeva">
      <span className="hero-parampara-avatar hero-parampara-deity">
        <Portrait figure={MADHAVA} sizes="56px" />
      </span>
      <span className="hero-parampara-sep" aria-hidden="true">✦</span>
      {GURUS.map((g) => (
        <span key={g.src} className="hero-parampara-avatar">
          <Portrait figure={g} sizes="48px" />
        </span>
      ))}
    </div>
  )
}
