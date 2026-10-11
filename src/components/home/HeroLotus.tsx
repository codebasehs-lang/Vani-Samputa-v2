import type { CSSProperties } from "react"

const PETAL = "M0 0 C -30 -42, -28 -104, 0 -146 C 28 -104, 30 -42, 0 0 Z"

const LAYERS = [
  { cls: "lotus-back", scale: 1, angles: [-78, -52, -26, 0, 26, 52, 78], delay: 0 },
  { cls: "lotus-mid", scale: 0.82, angles: [-60, -30, 30, 60], delay: 0.25 },
  { cls: "lotus-front", scale: 0.66, angles: [-24, 0, 24], delay: 0.5 },
]

// Fixed positions keep server and client markup identical.
const MOTES = [
  { x: 8, y: 72, s: 3, d: 0, t: 11 },
  { x: 16, y: 34, s: 2, d: 3.2, t: 13 },
  { x: 24, y: 86, s: 4, d: 6.1, t: 12 },
  { x: 33, y: 52, s: 2, d: 1.4, t: 14 },
  { x: 67, y: 60, s: 3, d: 2.3, t: 12 },
  { x: 74, y: 28, s: 2, d: 5.2, t: 15 },
  { x: 82, y: 80, s: 4, d: 0.8, t: 11 },
  { x: 91, y: 44, s: 2, d: 4.1, t: 13 },
  { x: 46, y: 90, s: 2, d: 7, t: 14 },
  { x: 57, y: 18, s: 3, d: 8.4, t: 12 },
]

function Lotus({ id, className, offset = 0 }: { id: string; className: string; offset?: number }) {
  return (
    <svg className={`hero-lotus ${className}`} viewBox="0 0 400 250">
      <defs>
        <linearGradient id={`${id}-petal`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#f2b8dc" stopOpacity="0.42" />
          <stop offset="55%" stopColor="#c97db0" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#f6d77a" stopOpacity="0.06" />
        </linearGradient>
        <radialGradient id={`${id}-halo`}>
          <stop offset="0%" stopColor="#f6d77a" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#f6d77a" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle
        className="lotus-halo"
        cx="200"
        cy="196"
        r="96"
        fill={`url(#${id}-halo)`}
        style={{ animationDelay: `${offset}s` }}
      />

      {LAYERS.map((layer) =>
        layer.angles.map((a) => (
          <g
            key={`${layer.cls}${a}`}
            className={`lotus-petal ${layer.cls}`}
            style={{ "--a": `${a}deg`, animationDelay: `${layer.delay + offset}s` } as CSSProperties}
          >
            <path
              className="lotus-petal-shape"
              d={PETAL}
              fill={`url(#${id}-petal)`}
              transform={`translate(200 214) scale(${layer.scale})`}
            />
            <path className="lotus-vein" d={`M0 -6 L0 ${-126 * layer.scale}`} transform="translate(200 214)" />
          </g>
        )),
      )}

      <circle className="lotus-seed" cx="200" cy="208" r="3.5" />

      <g className="lotus-ripples">
        <ellipse cx="200" cy="222" rx="70" ry="7" />
        <ellipse cx="200" cy="222" rx="120" ry="11" />
        <ellipse cx="200" cy="222" rx="170" ry="15" />
      </g>
    </svg>
  )
}

export function HeroLotus() {
  return (
    <div className="hero-lotus-wrap" aria-hidden="true">
      <svg className="hero-mandala" viewBox="-100 -100 200 200">
        <circle r="96" />
        <circle r="70" strokeDasharray="2 5" />
        {Array.from({ length: 16 }, (_, i) => (
          <ellipse key={i} rx="18" ry="58" transform={`rotate(${i * 22.5}) translate(0 -38)`} />
        ))}
      </svg>

      <Lotus id="lotusL" className="hero-lotus-left" />

      {MOTES.map((m, i) => (
        <span
          key={i}
          className="hero-mote"
          style={{
            left: `${m.x}%`,
            top: `${m.y}%`,
            width: m.s,
            height: m.s,
            animationDelay: `${m.d}s`,
            animationDuration: `${m.t}s`,
          }}
        />
      ))}
    </div>
  )
}
