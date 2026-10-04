import { INK } from '../palette'

const STICKS = [
  { x: 14, y: 4, h: 34, r: -12, c: '#F6C94A' },
  { x: 22, y: 0, h: 38, r: 4, c: '#FFD966' },
  { x: 30, y: 6, h: 32, r: -4, c: '#F0B62E' },
  { x: 38, y: 1, h: 38, r: 9, c: '#FFD966' },
  { x: 45, y: 5, h: 34, r: 16, c: '#F6C94A' },
  { x: 26, y: 8, h: 28, r: 10, c: '#F0B62E' },
  { x: 34, y: 9, h: 30, r: -9, c: '#FFE07F' },
]

/** Porção de batata no cartonado. `stale` deixa as batatas murchas e pálidas. */
export function FriesCarton({ stale = false, className }: { stale?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 64 74" className={className} aria-hidden>
      <g style={stale ? { filter: 'saturate(.45) brightness(.92)' } : undefined}>
        {STICKS.map((s, i) => (
          <rect
            key={i}
            x={s.x}
            y={s.y}
            width="7.5"
            height={s.h}
            rx="2.5"
            fill={s.c}
            stroke={INK}
            strokeWidth="2.5"
            transform={`rotate(${stale ? s.r * 1.8 : s.r} ${s.x + 4} ${s.y + s.h})`}
          />
        ))}
      </g>
      <path d="M8 36 H56 L51 70 Q50.5 72 48.5 72 H15.5 Q13.5 72 13 70Z" fill="#E63B2E" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M11 40 H53" stroke="#B72A20" strokeWidth="3" />
      <circle cx="32" cy="54" r="8" fill="#FFD866" stroke={INK} strokeWidth="2.5" />
      <path d="M28.5 58 V50 L32 55 L35.5 50 V58" fill="none" stroke="#E63B2E" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const BASKET_FRIES = [
  [30, 30, 14, 62], [44, 24, 40, -25], [52, 38, 36, 42], [34, 52, 38, -58], [50, 58, 34, 14],
  [64, 46, 36, -8], [72, 66, 32, 70], [26, 70, 30, 24], [60, 76, 32, -40], [78, 40, 30, 52],
] as const

/** Batatas vistas de cima, no cesto da fritadeira. `color` acompanha o ponto da fritura. */
export function FriesPile({ color, className }: { color: string; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <ellipse cx="50" cy="56" rx="44" ry="38" fill="#000" opacity=".18" />
      {BASKET_FRIES.map(([x, y, len, rot], i) => (
        <rect
          key={i}
          x={x - 4.5}
          y={y - len / 2}
          width="9"
          height={len}
          rx="3.5"
          fill={color}
          stroke={INK}
          strokeWidth="3"
          transform={`rotate(${rot} ${x} ${y})`}
        />
      ))}
    </svg>
  )
}
