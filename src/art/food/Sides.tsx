import type { CookableId, DessertId, SideId } from '@/game/config'
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

const STALE_FILTER = { filter: 'saturate(.45) brightness(.92)' } as const

/** Batata frita no cartonado. `stale` deixa as batatas murchas e pálidas. */
export function FriesCarton({ stale = false, className }: { stale?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 64 74" className={className} aria-hidden>
      <g style={stale ? STALE_FILTER : undefined}>
        {STICKS.map((s, i) => (
          <rect key={i} x={s.x} y={s.y} width="7.5" height={s.h} rx="2.5" fill={s.c} stroke={INK} strokeWidth="2.5" transform={`rotate(${stale ? s.r * 1.8 : s.r} ${s.x + 4} ${s.y + s.h})`} />
        ))}
      </g>
      <path d="M8 36 H56 L51 70 Q50.5 72 48.5 72 H15.5 Q13.5 72 13 70Z" fill="#E63B2E" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M11 40 H53" stroke="#B72A20" strokeWidth="3" />
      <circle cx="32" cy="54" r="8" fill="#FFD866" stroke={INK} strokeWidth="2.5" />
      <path d="M28.5 58 V50 L32 55 L35.5 50 V58" fill="none" stroke="#E63B2E" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Box({ fill, shade }: { fill: string; shade: string }) {
  return (
    <>
      <path d="M8 36 H56 L52 70 Q51.5 72 49.5 72 H14.5 Q12.5 72 12 70Z" fill={fill} stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M10.5 41 H53.5" stroke={shade} strokeWidth="3" />
    </>
  )
}

function Rustic() {
  const wedges = [[14, 30, -14], [24, 24, 6], [34, 28, -4], [44, 24, 14], [20, 36, 10], [38, 36, -10]] as const
  return (
    <>
      {wedges.map(([x, y, r], i) => (
        <path key={i} d={`M${x} ${y} q6 -22 12 0 q1 10 -6 14 q-7 -4 -6 -14Z`} fill="#D68E2A" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" transform={`rotate(${r} ${x + 6} ${y})`} />
      ))}
      <Box fill="#C9954A" shade="#A5772F" />
      <path d="M22 52 H42 M22 60 H42" stroke="#7A5420" strokeWidth="2.5" strokeLinecap="round" />
    </>
  )
}

function Nuggets() {
  const bits = [[18, 28, 11, 9], [34, 22, 12, 10], [46, 30, 10, 9], [26, 36, 11, 9], [40, 38, 10, 8]] as const
  return (
    <>
      {bits.map(([x, y, rx, ry], i) => (
        <g key={i}>
          <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#D9983F" stroke={INK} strokeWidth="2.5" />
          <ellipse cx={x - 2} cy={y - 2} rx={rx * 0.45} ry={ry * 0.35} fill="#EDB866" />
        </g>
      ))}
      <Box fill="#3E86D6" shade="#2C69AD" />
      <circle cx="32" cy="55" r="7" fill="#FFD866" stroke={INK} strokeWidth="2.5" />
    </>
  )
}

function Rings() {
  const rings = [[16, 28], [30, 22], [44, 28], [24, 36], [38, 36]] as const
  return (
    <>
      {rings.map(([x, y], i) => (
        <g key={i}>
          <ellipse cx={x} cy={y} rx="9" ry="9" fill="#E39A33" stroke={INK} strokeWidth="2.5" />
          <ellipse cx={x} cy={y} rx="4" ry="4" fill="#FFE9B0" stroke={INK} strokeWidth="2" />
        </g>
      ))}
      <Box fill="#F2A83B" shade="#D68A1F" />
      <path d="M22 54 Q32 62 42 54" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
    </>
  )
}

function Loaded() {
  return (
    <>
      {STICKS.slice(0, 5).map((s, i) => (
        <rect key={i} x={s.x} y={s.y + 6} width="7.5" height={s.h - 6} rx="2.5" fill={s.c} stroke={INK} strokeWidth="2.5" transform={`rotate(${s.r} ${s.x + 4} ${s.y + s.h})`} />
      ))}
      <path d="M10 26 Q18 20 26 28 Q34 20 42 28 Q50 22 56 30 Q54 38 46 34 Q38 40 30 34 Q22 40 14 34 Q8 34 10 26Z" fill="#F5A623" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <g fill="#C8412E" stroke={INK} strokeWidth="1.8">
        <rect x="16" y="26" width="8" height="4" rx="1.5" transform="rotate(-15 20 28)" />
        <rect x="32" y="24" width="8" height="4" rx="1.5" transform="rotate(12 36 26)" />
        <rect x="44" y="28" width="8" height="4" rx="1.5" transform="rotate(-8 48 30)" />
      </g>
      <Box fill="#E63B2E" shade="#B72A20" />
      <circle cx="32" cy="55" r="7" fill="#FFD866" stroke={INK} strokeWidth="2.5" />
    </>
  )
}

/** Acompanhamento pronto (bandeja, estufa, balão do pedido). `stale` = murcho. */
export function SidePortion({ id, stale = false, className }: { id: SideId; stale?: boolean; className?: string }) {
  if (id === 'fries') return <FriesCarton stale={stale} className={className} />
  const art = { rustic: <Rustic />, nuggets: <Nuggets />, rings: <Rings />, loaded: <Loaded /> }[id]
  return (
    <svg viewBox="0 0 64 74" className={className} aria-hidden>
      <g style={stale ? STALE_FILTER : undefined}>{art}</g>
    </svg>
  )
}

const BASKET_FRIES = [
  [30, 30, 14, 62], [44, 24, 40, -25], [52, 38, 36, 42], [34, 52, 38, -58], [50, 58, 34, 14],
  [64, 46, 36, -8], [72, 66, 32, 70], [26, 70, 30, 24], [60, 76, 32, -40], [78, 40, 30, 52],
] as const

const BLOBS = [[34, 32], [58, 28], [72, 48], [44, 54], [62, 68], [30, 66], [78, 72]] as const
const RINGS = [[32, 34], [58, 30], [72, 52], [42, 56], [62, 70], [28, 70]] as const

/** O que está no cesto da fritadeira ou na forma do forno, visto de cima. `color` acompanha o ponto. */
export function CookablePile({ kind, color, className }: { kind: CookableId; color: string; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <ellipse cx="50" cy="56" rx="44" ry="38" fill="#000" opacity=".18" />
      {(kind === 'fries' || kind === 'loaded' || kind === 'rustic') &&
        BASKET_FRIES.map(([x, y, len, rot], i) => (
          <rect key={i} x={x - (kind === 'rustic' ? 6 : 4.5)} y={y - len / 2} width={kind === 'rustic' ? 12 : 9} height={len} rx={kind === 'rustic' ? 5 : 3.5} fill={color} stroke={INK} strokeWidth="3" transform={`rotate(${rot} ${x} ${y})`} />
        ))}
      {kind === 'loaded' && <path d="M26 40 Q40 30 54 42 Q68 34 76 50 Q64 60 50 52 Q36 62 24 52Z" fill="#F5A623" stroke={INK} strokeWidth="2.5" opacity=".95" />}
      {kind === 'nuggets' &&
        BLOBS.map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="13" ry="11" fill={color} stroke={INK} strokeWidth="3" transform={`rotate(${i * 25} ${x} ${y})`} />)}
      {kind === 'rings' &&
        RINGS.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="13" fill={color} stroke={INK} strokeWidth="3" />
            <circle cx={x} cy={y} r="5.5" fill="#3B1F0E" opacity=".35" stroke={INK} strokeWidth="2" />
          </g>
        ))}
      {kind === 'brownie' && (
        <>
          <rect x="10" y="14" width="80" height="72" rx="10" fill="#8A8F99" stroke={INK} strokeWidth="4" />
          {[[16, 20], [52, 20], [16, 54], [52, 54]].map(([x, y], i) => (
            <rect key={i} x={x} y={y} width="32" height="28" rx="4" fill={color} stroke={INK} strokeWidth="3" />
          ))}
        </>
      )}
    </svg>
  )
}

/** Sobremesa pronta (bandeja, vitrine, balão do pedido). */
export function DessertArt({ id, className }: { id: DessertId; className?: string }) {
  if (id === 'brownie') {
    return (
      <svg viewBox="0 0 64 74" className={className} aria-hidden>
        <ellipse cx="32" cy="62" rx="28" ry="8" fill="#fff" stroke={INK} strokeWidth="3" />
        <path d="M10 36 H54 L52 58 Q51 62 47 62 H17 Q13 62 12 58Z" fill="#4B2A18" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
        <path d="M8 34 Q8 28 14 28 H50 Q56 28 56 34 V38 H8Z" fill="#6B3A22" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
        <path d="M14 33 H36" stroke="#A66B43" strokeWidth="3" strokeLinecap="round" />
        <g fill="#F2D9A8"><circle cx="24" cy="48" r="2" /><circle cx="36" cy="52" r="2" /><circle cx="44" cy="46" r="2" /></g>
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 64 74" className={className} aria-hidden>
      <path d="M18 34 L32 70 L46 34Z" fill="#E8B76A" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M24 40 L38 56 M30 36 L42 50 M24 52 L32 44" stroke="#C4893A" strokeWidth="2" strokeLinecap="round" />
      <circle cx="32" cy="28" r="15" fill="#FFB6C8" stroke={INK} strokeWidth="3.5" />
      <circle cx="30" cy="16" r="12" fill="#FFF3D6" stroke={INK} strokeWidth="3.5" />
      <path d="M22 24 Q24 16 31 14" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".8" />
      <circle cx="36" cy="6" r="4.5" fill="#E63B2E" stroke={INK} strokeWidth="2.5" />
    </svg>
  )
}
