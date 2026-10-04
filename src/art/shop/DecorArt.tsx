import type { CSSProperties } from 'react'
import type { DecorId } from '@/game/config'
import { INK } from '../palette'

interface Props {
  id: DecorId
  /** Visual comprado: 1 = o primeiro, 2 = o segundo… */
  tier: number
  className?: string
  style?: CSSProperties
}

const GOLD = '#F5B82E'

function Floor({ tier }: { tier: number }) {
  if (tier <= 1) {
    return (
      <g>
        {Array.from({ length: 4 * 3 }, (_, i) => {
          const x = (i % 4) * 22
          const y = Math.floor(i / 4) * 22 + 8
          return <rect key={i} x={4 + x} y={y} width="22" height="22" fill={(i % 4 + Math.floor(i / 4)) % 2 ? '#FFF3DC' : '#E63B2E'} />
        })}
      </g>
    )
  }
  if (tier === 2) {
    return (
      <g>
        <rect x="4" y="8" width="88" height="66" fill="#E9E6E0" />
        {[0, 1, 2].flatMap((r) =>
          [0, 1, 2, 3].map((c) => (
            <path key={`${r}${c}`} d={`M${15 + c * 22} ${19 + r * 22 - 9} l11 11 l-11 11 l-11 -11Z`} fill={(r + c) % 2 ? '#C9D1DC' : '#F8F6F2'} stroke="#B9B4AA" strokeWidth="1.2" />
          )),
        )}
      </g>
    )
  }
  const tones = ['#B4743A', '#A5672F', '#C28148', '#9A5B2B']
  return (
    <g>
      {Array.from({ length: 5 }, (_, r) =>
        [0, 1].map((c) => (
          <rect key={`${r}${c}`} x={4 + c * 44 + (r % 2) * -16} y={8 + r * 13.2} width="44" height="13.2" fill={tones[(r * 2 + c) % 4]} stroke="#6B3A17" strokeWidth="1.4" />
        )),
      )}
      <path d="M10 14 H60 M30 40 H80" stroke="#fff" strokeOpacity=".25" strokeWidth="2" strokeLinecap="round" />
    </g>
  )
}

function Wall({ tier }: { tier: number }) {
  if (tier <= 1) {
    return (
      <g>
        <rect x="4" y="8" width="88" height="62" fill="#F5C86A" />
        <rect x="4" y="8" width="88" height="8" fill="#FFE08F" />
        <rect x="4" y="58" width="88" height="12" fill="#B4743A" />
        <path d="M4 58 H92" stroke={INK} strokeWidth="2.5" />
        <path d="M14 24 H40" stroke="#fff" strokeOpacity=".6" strokeWidth="4" strokeLinecap="round" />
      </g>
    )
  }
  if (tier === 2) {
    return (
      <g>
        <rect x="4" y="8" width="88" height="66" fill="#B5472E" />
        {Array.from({ length: 6 }, (_, r) => (
          <g key={r}>
            <path d={`M4 ${8 + r * 11} H92`} stroke="#E3C3A8" strokeWidth="2" />
            {Array.from({ length: 5 }, (_, c) => <path key={c} d={`M${4 + c * 20 + (r % 2) * 10} ${8 + r * 11} v11`} stroke="#E3C3A8" strokeWidth="2" />)}
          </g>
        ))}
        <rect x="14" y="26" width="36" height="22" rx="3" fill="#2B2B2B" stroke="#E3C3A8" strokeWidth="3" />
        <path d="M20 34 H44 M20 40 H36" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity=".85" />
      </g>
    )
  }
  return (
    <g>
      <rect x="4" y="8" width="88" height="66" fill="#2B2F3A" />
      <path d="M14 56 Q24 20 40 40 T74 24" fill="none" stroke="#F5B82E" strokeWidth="7" strokeLinecap="round" />
      <path d="M12 62 Q40 48 60 66 T88 50" fill="none" stroke="#E86FA0" strokeWidth="6" strokeLinecap="round" />
      <circle cx="68" cy="22" r="9" fill="#3E86D6" />
      <path d="M58 22 H78 M68 12 V32" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M20 22 l5 8 l5 -8 l5 8" fill="none" stroke="#5FB84A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  )
}

function Neon({ tier }: { tier: number }) {
  const colors = ['#FF7A6B', '#FF4FA0', '#6FE3FF'][Math.min(2, Math.max(0, tier - 1))]!
  const second = ['#FFD3CC', '#FFE066', '#FFE066'][Math.min(2, Math.max(0, tier - 1))]!
  return (
    <g>
      <rect x="6" y="14" width="84" height="48" rx="8" fill="#1A1620" stroke={INK} strokeWidth="4" />
      <g filter="url(#neonGlow)">
        <rect x="12" y="20" width="72" height="36" rx="6" fill="none" stroke={colors} strokeWidth="3" />
        <text x="48" y="43" textAnchor="middle" fontFamily="Lilita One" fontSize={tier === 1 ? 17 : 15} fill="none" stroke={second} strokeWidth="2">
          {tier === 1 ? 'BURGER' : 'BRASA'}
        </text>
        {tier >= 2 && <path d="M48 48 q-4 -3 -2 -6 q2 3 2 -2 q4 3 2 8 q-1 3 -2 0z" fill="none" stroke={colors} strokeWidth="2" />}
        {tier >= 3 && [14, 82].map((x) => <circle key={x} cx={x - 2} cy="38" r="2.4" fill={second} />)}
      </g>
      <defs>
        <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </g>
  )
}

function Lighting({ tier }: { tier: number }) {
  if (tier <= 1) {
    return (
      <g>
        <path d="M4 10 H92" stroke={INK} strokeWidth="3" />
        {[22, 70].map((x) => (
          <g key={x}>
            <path d={`M${x} 10 V34`} stroke={INK} strokeWidth="2.5" />
            <circle cx={x} cy="42" r="9" fill="#FFE98A" stroke={INK} strokeWidth="3" />
            <circle cx={x} cy="42" r="15" fill="#FFE98A" opacity=".25" />
            <path d={`M${x - 3} 39 q2 -3 5 -2`} stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
          </g>
        ))}
      </g>
    )
  }
  if (tier === 2) {
    return (
      <g>
        <path d="M4 10 H92" stroke={INK} strokeWidth="3" />
        {[24, 72].map((x) => (
          <g key={x}>
            <path d={`M${x} 10 V28`} stroke={INK} strokeWidth="2.5" />
            <path d={`M${x - 14} 44 Q${x - 14} 28 ${x} 28 Q${x + 14} 28 ${x + 14} 44Z`} fill="#2F3340" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
            <path d={`M${x - 8} 33 q4 -3 9 -3`} stroke="#fff" strokeOpacity=".5" strokeWidth="2" fill="none" strokeLinecap="round" />
            <ellipse cx={x} cy="46" rx="9" ry="3.5" fill="#FFE98A" />
            <path d={`M${x - 10} 50 L${x - 18} 70 H${x + 18} L${x + 10} 50Z`} fill="#FFE98A" opacity=".22" />
          </g>
        ))}
      </g>
    )
  }
  return (
    <g>
      <path d="M48 6 V22" stroke={INK} strokeWidth="3" />
      <path d="M20 40 Q48 18 76 40" fill="none" stroke={GOLD} strokeWidth="5" strokeLinecap="round" />
      <path d="M20 40 Q48 18 76 40" fill="none" stroke={INK} strokeWidth="1.2" />
      <path d="M28 54 Q48 38 68 54" fill="none" stroke={GOLD} strokeWidth="4" strokeLinecap="round" />
      <circle cx="48" cy="24" r="6" fill={GOLD} stroke={INK} strokeWidth="2.5" />
      {[20, 34, 48, 62, 76].map((x, i) => (
        <g key={x}>
          <path d={`M${x} ${[40, 30, 26, 30, 40][i]} V${[48, 40, 36, 40, 48][i]}`} stroke={INK} strokeWidth="2" />
          <ellipse cx={x} cy={[53, 45, 41, 45, 53][i]} rx="4.5" ry="6" fill="#FFF0A8" stroke={INK} strokeWidth="2.2" />
        </g>
      ))}
      <circle cx="48" cy="52" r="26" fill="#FFE98A" opacity=".18" />
    </g>
  )
}

function Tables({ tier }: { tier: number }) {
  const top = tier <= 1 ? '#E63B2E' : '#C98A4B'
  return (
    <g>
      <ellipse cx="48" cy="72" rx="36" ry="4" fill={INK} opacity=".15" />
      {[14, 82].map((x) => (
        <g key={x}>
          <path d={`M${x - 5} 56 V70 M${x + 5} 56 V70`} stroke={INK} strokeWidth="3" strokeLinecap="round" />
          <ellipse cx={x} cy="54" rx="9" ry="4.5" fill={tier <= 1 ? '#3E86D6' : '#8A5A2B'} stroke={INK} strokeWidth="2.5" />
        </g>
      ))}
      <path d="M48 36 V70" stroke={INK} strokeWidth="5" strokeLinecap="round" />
      <path d="M36 70 H60" stroke={INK} strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="48" cy="36" rx="28" ry="9" fill={top} stroke={INK} strokeWidth="4" />
      {tier >= 2 && [0, 1, 2, 3, 4].map((i) => <path key={i} d={`M${28 + i * 10} 29 q3 6 0 13`} stroke="#fff" strokeOpacity=".7" strokeWidth="3" fill="none" />)}
      <path d="M32 33 q8 -3 16 -3" stroke="#fff" strokeOpacity=".5" strokeWidth="2" fill="none" strokeLinecap="round" />
      <ellipse cx="48" cy="30" rx="6" ry="2" fill="#FFF3DC" stroke={INK} strokeWidth="1.8" />
    </g>
  )
}

function Plants({ tier }: { tier: number }) {
  if (tier <= 1) {
    return (
      <g>
        {[24, 68].map((x, i) => (
          <g key={x}>
            <path d={`M${x - 11} ${52 + i * 4} H${x + 11} L${x + 8} ${72} H${x - 8}Z`} fill="#C46A12" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
            <path d={`M${x} ${52 + i * 4} q-14 -6 -12 -22 q14 4 12 22 M${x} ${52 + i * 4} q14 -8 12 -26 q-14 6 -12 26 M${x} ${52 + i * 4} V24`} fill="#5FB84A" stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
          </g>
        ))}
      </g>
    )
  }
  return (
    <g>
      <rect x="8" y="10" width="80" height="62" rx="7" fill="#8A5A2B" stroke={INK} strokeWidth="4" />
      {Array.from({ length: 4 * 3 }, (_, i) => {
        const x = 18 + (i % 4) * 20
        const y = 22 + Math.floor(i / 4) * 17
        const c = ['#5FB84A', '#3E8A30', '#7ACB5B'][i % 3]!
        return <path key={i} d={`M${x} ${y + 6} q-9 -4 -7 -13 q9 2 7 13 M${x} ${y + 6} q9 -5 7 -13 q-9 3 -7 13`} fill={c} stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
      })}
      <circle cx="30" cy="40" r="3" fill="#E63B2E" stroke={INK} strokeWidth="1.5" />
      <circle cx="66" cy="55" r="3" fill="#F5B82E" stroke={INK} strokeWidth="1.5" />
    </g>
  )
}

function Jukebox({ tier }: { tier: number }) {
  const body = tier <= 1 ? '#E63B2E' : '#2B2F6A'
  const glow = tier <= 1 ? '#FFD866' : '#6FE3FF'
  return (
    <g>
      <ellipse cx="48" cy="74" rx="28" ry="4" fill={INK} opacity=".18" />
      <path d="M24 74 V30 Q24 8 48 8 Q72 8 72 30 V74Z" fill={body} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <path d="M30 28 Q30 16 48 16 Q66 16 66 28 V46 H30Z" fill="#1A1620" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M34 28 Q34 20 48 20 Q62 20 62 28" fill="none" stroke={glow} strokeWidth="3" strokeLinecap="round" />
      <circle cx="48" cy="36" r="7" fill={tier <= 1 ? '#F5B82E' : '#E86FA0'} stroke={INK} strokeWidth="2.5" />
      <circle cx="48" cy="36" r="2" fill={INK} />
      <rect x="32" y="52" width="32" height="10" rx="3" fill={glow} stroke={INK} strokeWidth="2.5" />
      <path d="M36 57 H60" stroke={INK} strokeWidth="2" strokeLinecap="round" strokeDasharray="3 3" />
      <path d="M30 70 H66" stroke={tier <= 1 ? GOLD : '#E86FA0'} strokeWidth="3.5" strokeLinecap="round" />
      {tier >= 2 && <path d="M20 40 V64 M76 40 V64" stroke={glow} strokeWidth="2.5" strokeLinecap="round" opacity=".9" />}
    </g>
  )
}

function Tv({ tier }: { tier: number }) {
  const big = tier >= 2
  const w = big ? 80 : 62
  const x = 48 - w / 2
  return (
    <g>
      <path d="M48 14 V22" stroke={INK} strokeWidth="4" strokeLinecap="round" />
      <rect x={x} y={big ? 16 : 22} width={w} height={big ? 46 : 38} rx="6" fill="#1F2D44" stroke={INK} strokeWidth="4" />
      <rect x={x + 5} y={big ? 21 : 27} width={w - 10} height={big ? 36 : 28} rx="3" fill={big ? '#3E8A30' : '#FFD866'} />
      {big ? (
        <g>
          <path d={`M${x + 5} 39 H${x + w - 5}`} stroke="#fff" strokeWidth="1.8" opacity=".7" />
          <circle cx="48" cy="39" r="6" fill="none" stroke="#fff" strokeWidth="1.8" opacity=".7" />
          <circle cx="60" cy="31" r="3.2" fill="#fff" stroke={INK} strokeWidth="1.4" />
        </g>
      ) : (
        <g>
          <path d="M36 52 Q36 44 48 44 Q60 44 60 52Z" fill="#E6A04C" stroke={INK} strokeWidth="2" />
          <rect x="35" y="49" width="26" height="4" rx="2" fill="#7A3D1D" stroke={INK} strokeWidth="1.6" />
        </g>
      )}
      <path d={`M${x + 8} ${big ? 24 : 30} l9 -0.5`} stroke="#fff" strokeOpacity=".6" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M40 66 H56" stroke={INK} strokeWidth="4" strokeLinecap="round" />
    </g>
  )
}

const ART = { floor: Floor, wall: Wall, neon: Neon, lighting: Lighting, tables: Tables, plants: Plants, jukebox: Jukebox, tv: Tv } as const

/** Desenho de uma decoração da loja; `tier` escolhe o visual (1 = primeiro). */
export function DecorArt({ id, tier, className, style }: Props) {
  const Art = ART[id]
  const swatch = id === 'floor' || id === 'wall'
  return (
    <svg viewBox="0 0 96 80" className={className} style={style} aria-hidden>
      {swatch && <clipPath id={`clip-${id}`}><rect x="4" y="8" width="88" height="66" rx="10" /></clipPath>}
      <g clipPath={swatch ? `url(#clip-${id})` : undefined}>
        <Art tier={Math.max(1, tier)} />
      </g>
      {swatch && <rect x="4" y="8" width="88" height="66" rx="10" fill="none" stroke={INK} strokeWidth="4" />}
    </svg>
  )
}
