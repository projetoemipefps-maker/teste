import { useId } from 'react'
import type { VenueId } from '@/game/config'
import { INK } from '../palette'

interface LayerProps {
  venue: VenueId
  /** Visual comprado da decoração (0 = o padrão da fase). */
  tier: number
  className?: string
}

const GOLD = '#F5B82E'

/** Parede do fundo: o padrão de cada fase, ou a decoração comprada (tinta, tijolinho aparente, painel de grafite). */
export function SceneWall({ venue, tier, className }: LayerProps) {
  const uid = useId().replace(/:/g, '')
  const brick = `brick${uid}`
  const dark = `dark${uid}`
  const tile = `tile${uid}`
  return (
    <svg className={className} width="100%" height="100%" aria-hidden>
      <defs>
        <pattern id={brick} width="30" height="20" patternUnits="userSpaceOnUse">
          <rect width="30" height="20" fill="#B5472E" />
          <path d="M0 0.5 H30 M0 10.5 H30 M0 0 V10 M15 10 V20" stroke="#E3C3A8" strokeWidth="2" />
        </pattern>
        <pattern id={dark} width="24" height="24" patternUnits="userSpaceOnUse">
          <rect width="24" height="24" fill="#3B3A44" />
          <path d="M0 23 H24" stroke="#4B4A56" strokeWidth="2" />
        </pattern>
        <pattern id={tile} width="26" height="26" patternUnits="userSpaceOnUse">
          <rect width="26" height="26" fill="#F7F8FB" />
          <path d="M0 0.5 H26 M0.5 0 V26" stroke="#DDE2EA" strokeWidth="1.5" />
        </pattern>
        <linearGradient id={`sky${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#BEE3F8" />
          <stop offset="1" stopColor="#EAF6FD" />
        </linearGradient>
      </defs>
      {tier === 1 && (
        <>
          <rect width="100%" height="100%" fill="#F5C86A" />
          <rect width="100%" height="14%" fill="#FFE08F" />
        </>
      )}
      {tier === 2 && <rect width="100%" height="100%" fill={`url(#${brick})`} />}
      {tier >= 3 && (
        <>
          <rect width="100%" height="100%" fill="#2B2F3A" />
          <svg width="100%" height="100%" viewBox="0 0 120 60" preserveAspectRatio="xMidYMid slice">
            <path d="M4 50 Q14 12 28 32 T56 18" fill="none" stroke={GOLD} strokeWidth="6" strokeLinecap="round" />
            <path d="M52 52 Q70 34 86 48 T116 28" fill="none" stroke="#E86FA0" strokeWidth="5" strokeLinecap="round" />
            <circle cx="100" cy="16" r="8" fill="#3E86D6" />
            <path d="M95 16 H105 M100 11 V21" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            <path d="M34 12 l5 8 l5 -8 l5 8" fill="none" stroke="#5FB84A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </>
      )}
      {tier === 0 && venue === 'stall' && (
        <>
          <rect width="100%" height="100%" fill={`url(#sky${uid})`} />
          {[
            [4, 38, 11, 62, '#A9CFE8'],
            [17, 22, 13, 78, '#B7D8EE'],
            [33, 46, 9, 54, '#A9CFE8'],
            [60, 30, 12, 70, '#B7D8EE'],
            [75, 44, 10, 56, '#A9CFE8'],
            [88, 24, 10, 76, '#B7D8EE'],
          ].map(([x, y, w, h, c]) => (
            <rect key={String(x)} x={`${x}%`} y={`${y}%`} width={`${w}%`} height={`${h}%`} fill={c as string} />
          ))}
          {[8, 21, 64, 92].map((x) => (
            <g key={x} fill="#FFE98A">
              <rect x={`${x}%`} y="48%" width="3.5%" height="9%" />
              <rect x={`${x}%`} y="66%" width="3.5%" height="9%" />
            </g>
          ))}
        </>
      )}
      {tier === 0 && venue === 'snackbar' && (
        <>
          <rect width="100%" height="100%" fill="#FFE9C8" />
          <rect y="58%" width="100%" height="42%" fill="#E9C58F" />
          <line x1="0" y1="58%" x2="100%" y2="58%" stroke={INK} strokeWidth="3" />
          {Array.from({ length: 14 }, (_, i) => <line key={i} x1={`${i * 8}%`} y1="58%" x2={`${i * 8}%`} y2="100%" stroke="#D2A96D" strokeWidth="2" />)}
        </>
      )}
      {tier === 0 && venue === 'craft' && <rect width="100%" height="100%" fill={`url(#${dark})`} />}
      {tier === 0 && venue === 'chain' && (
        <>
          <rect width="100%" height="100%" fill={`url(#${tile})`} />
          <rect y="62%" width="100%" height="9%" fill="#E63B2E" />
          <rect y="71%" width="100%" height="4%" fill={GOLD} />
        </>
      )}
    </svg>
  )
}

/** Piso do salão: o da fase ou o comprado (xadrez, porcelanato, madeira nobre). */
export function SceneFloor({ venue, tier, className }: LayerProps) {
  const uid = useId().replace(/:/g, '')
  const id = (n: string) => `${n}${uid}`
  const kind = tier >= 1 ? (['checker', 'porcelain', 'wood'] as const)[Math.min(3, tier) - 1]! : venue === 'stall' ? 'paver' : venue === 'snackbar' ? 'vinyl' : venue === 'craft' ? 'darkwood' : 'whitetile'
  return (
    <svg className={className} width="100%" height="100%" aria-hidden>
      <defs>
        <pattern id={id('paver')} width="36" height="18" patternUnits="userSpaceOnUse">
          <rect width="36" height="18" fill="#B8B3AA" />
          <path d="M0 0.5 H36 M0 9.5 H36 M0.5 0 V9 M18.5 9 V18" stroke="#8E8A82" strokeWidth="2" />
        </pattern>
        <pattern id={id('vinyl')} width="32" height="32" patternUnits="userSpaceOnUse">
          <rect width="32" height="32" fill="#F0E0C0" />
          <rect width="16" height="16" fill="#D7C39B" />
          <rect x="16" y="16" width="16" height="16" fill="#D7C39B" />
        </pattern>
        <pattern id={id('darkwood')} width="40" height="14" patternUnits="userSpaceOnUse">
          <rect width="40" height="14" fill="#5B3A24" />
          <path d="M0 13 H40 M18 0 V13" stroke="#3E2616" strokeWidth="2" />
        </pattern>
        <pattern id={id('whitetile')} width="28" height="28" patternUnits="userSpaceOnUse">
          <rect width="28" height="28" fill="#EEF0F5" />
          <path d="M0 0.5 H28 M0.5 0 V28" stroke="#C9CFDA" strokeWidth="2" />
        </pattern>
        <pattern id={id('checker')} width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill="#FFF3DC" />
          <rect width="20" height="20" fill="#E63B2E" />
          <rect x="20" y="20" width="20" height="20" fill="#E63B2E" />
        </pattern>
        <pattern id={id('porcelain')} width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill="#F4F2EC" />
          <path d="M20 2 L38 20 L20 38 L2 20Z" fill="#C9D1DC" stroke="#B0B8C4" strokeWidth="1.5" />
        </pattern>
        <pattern id={id('wood')} width="48" height="16" patternUnits="userSpaceOnUse">
          <rect width="48" height="16" fill="#B4743A" />
          <rect y="0" width="24" height="16" fill="#C28148" />
          <path d="M0 15 H48 M24 0 V15" stroke="#6B3A17" strokeWidth="2" />
          <path d="M4 5 H18" stroke="#fff" strokeOpacity=".25" strokeWidth="2" strokeLinecap="round" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id(kind)})`} />
      <rect width="100%" height="22%" fill="#000" opacity=".12" />
    </svg>
  )
}

/** Placa da fachada: a madeira pintada de cada fase ou o letreiro neon comprado. */
export function FacadeSign({ venue, neonTier }: { venue: VenueId; neonTier: number }) {
  if (neonTier > 0) {
    const color = ['#FF7A6B', '#FF4FA0', '#6FE3FF'][Math.min(2, neonTier - 1)]!
    const second = ['#FFD3CC', '#FFE066', '#FFE066'][Math.min(2, neonTier - 1)]!
    return (
      <div
        className={`relative flex h-[34px] w-[136px] items-center justify-center rounded-lg border-4 border-ink bg-[#1A1620] ${neonTier >= 3 ? 'fx-pulse' : ''}`}
        style={{ boxShadow: `0 0 12px 2px ${color}88, inset 0 0 8px ${color}55` }}
      >
        <span
          className="whitespace-nowrap font-display text-[15px] leading-none"
          style={{ color: second, textShadow: `0 0 4px ${color}, 0 0 9px ${color}` }}
        >
          {neonTier === 1 ? 'BRASA BURGER' : 'BRASA BURGER'}
        </span>
        <span className="pointer-events-none absolute inset-[3px] rounded-md border-2" style={{ borderColor: color, opacity: 0.8 }} />
      </div>
    )
  }
  const look = {
    stall: { bg: '#FFF3DC', fg: '#E63B2E', border: INK },
    snackbar: { bg: '#B5472E', fg: '#FFF3DC', border: INK },
    craft: { bg: '#2B2B2B', fg: GOLD, border: INK },
    chain: { bg: '#E63B2E', fg: '#FFF3DC', border: INK },
  }[venue]
  return (
    <div
      className="flex h-[32px] w-[132px] items-center justify-center rounded-lg border-4 shadow-[0_3px_0_rgba(59,31,14,.35)]"
      style={{ background: look.bg, borderColor: look.border }}
    >
      <span className="whitespace-nowrap font-display text-[14px] leading-none" style={{ color: look.fg }}>
        BRASA BURGER
      </span>
    </div>
  )
}
