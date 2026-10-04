import type { EquipmentId } from '@/game/config'
import { INK } from '../palette'
import { tierLook } from './looks'

interface Props {
  id: EquipmentId
  /** 0 = simples … 3 = premium. */
  tier: number
  className?: string
}

const SW = 4
const GOLD = '#F5B82E'

function Grill({ tier }: { tier: number }) {
  const L = tierLook(tier)
  const grooves = [24, 36, 48, 60, 72, 84, 96]
  return (
    <g>
      <ellipse cx="60" cy="91" rx="50" ry="4.5" fill={INK} opacity=".18" />
      <rect x="16" y="76" width="10" height="14" rx="3" fill={L.dark} stroke={INK} strokeWidth="3" />
      <rect x="94" y="76" width="10" height="14" rx="3" fill={L.dark} stroke={INK} strokeWidth="3" />
      <rect x="8" y="40" width="104" height="40" rx="10" fill={L.body} stroke={INK} strokeWidth={SW} />
      <rect x="15" y="46" width="90" height="7" rx="3.5" fill={L.light} opacity=".75" />
      {tier >= 1 && [32, 52, 72].map((x) => <circle key={x} cx={x} cy="68" r="5.2" fill={L.accent} stroke={INK} strokeWidth="3" />)}
      {tier >= 1 && <rect x="88" y="62" width="16" height="10" rx="3" fill={tier >= 2 ? '#2B3A55' : L.dark} stroke={INK} strokeWidth="2.5" />}
      {tier >= 3 && <path d="M10 76 H110" stroke={GOLD} strokeWidth="3.5" />}
      <rect x="12" y="25" width="96" height="22" rx="8" fill={L.plate} stroke={INK} strokeWidth={SW} />
      {grooves.map((x) => (
        <path key={x} d={`M${x} 29 V43`} stroke={tier >= 2 ? '#AEB8C6' : '#000'} strokeOpacity={tier >= 2 ? 0.7 : 0.35} strokeWidth="2.5" strokeLinecap="round" />
      ))}
      <ellipse cx="38" cy="33" rx="14" ry="6.5" fill="#7A3D1D" stroke={INK} strokeWidth="3" />
      <ellipse cx="80" cy="33" rx="14" ry="6.5" fill="#8C4A24" stroke={INK} strokeWidth="3" />
      <path d="M30 31 Q38 28 46 31" fill="none" stroke="#C7824F" strokeWidth="2.5" strokeLinecap="round" />
      {tier >= 3 && <path d="M106 6 L108 12 L114 14 L108 16 L106 22 L104 16 L98 14 L104 12Z" fill={GOLD} stroke={INK} strokeWidth="2" strokeLinejoin="round" />}
    </g>
  )
}

function FryerArt({ tier }: { tier: number }) {
  const L = tierLook(tier)
  return (
    <g>
      <ellipse cx="60" cy="91" rx="52" ry="4.5" fill={INK} opacity=".18" />
      <rect x="6" y="36" width="108" height="52" rx="10" fill={L.body} stroke={INK} strokeWidth={SW} />
      <rect x="12" y="40" width="96" height="9" rx="4.5" fill={L.light} opacity=".8" />
      {[14, 64].map((x) => (
        <g key={x}>
          <rect x={x} y="48" width="42" height="34" rx="9" fill={tier >= 3 ? '#FFD54F' : '#F2B72A'} stroke={INK} strokeWidth="3.5" />
          <path d={`M${x + 6} 56 Q${x + 20} 52 ${x + 34} 56`} fill="none" stroke="#FFE07F" strokeWidth="3.5" strokeLinecap="round" />
        </g>
      ))}
      {[18, 24, 30].map((x, i) => (
        <rect key={x} x={x} y={54 - i * 2} width="4.5" height="14" rx="2" fill="#F8D26A" stroke={INK} strokeWidth="2" transform={`rotate(${i * 8 - 8} ${x + 2} 62)`} />
      ))}
      {tier >= 1 && (
        <g fill="none" stroke={tier >= 3 ? GOLD : L.accent} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M70 52 V24 H86" />
          {tier >= 2 && <path d="M20 52 V22 H34" />}
        </g>
      )}
      {tier >= 1 && <path d="M70 52 V24 H86" fill="none" stroke={INK} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity=".5" />}
      {tier >= 2 && <rect x="46" y="82" width="28" height="5" rx="2.5" fill={tier >= 3 ? GOLD : L.trim} stroke={INK} strokeWidth="2" />}
    </g>
  )
}

function DrinksArt({ tier }: { tier: number }) {
  const L = tierLook(tier)
  const body = ['#E63B2E', '#D9342A', L.body, GOLD][tier] ?? '#E63B2E'
  return (
    <g>
      <ellipse cx="60" cy="91" rx="38" ry="4.5" fill={INK} opacity=".18" />
      <rect x="28" y="78" width="64" height="12" rx="4" fill="#8B8B93" stroke={INK} strokeWidth="3" />
      <rect x="30" y="6" width="60" height="76" rx="12" fill={body} stroke={INK} strokeWidth={SW} />
      <rect x="35" y="11" width="50" height="9" rx="4.5" fill="#fff" opacity=".35" />
      <rect x="36" y="24" width="48" height="17" rx="6" fill="#FFD866" stroke={INK} strokeWidth="3" />
      <text x="60" y="37" textAnchor="middle" fontFamily="Lilita One" fontSize="13" fill="#B72A20">{tier >= 2 ? 'AUTO' : 'REFRI'}</text>
      <rect x="36" y="46" width="48" height="32" rx="6" fill="#7E1F18" stroke={INK} strokeWidth="3" />
      <rect x="53" y="48" width="14" height="8" rx="3" fill="#6B6B73" stroke={INK} strokeWidth="2.5" />
      <path d="M56 56 H64 L62 62 H58Z" fill="#4A4A52" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M45 78 L47 66 H55 L57 78Z" fill="#FFF3DC" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M46 72 H56 L56.5 78 H45.5Z" fill="#5B2A16" />
      <circle cx="42" cy="52" r="3.4" fill="#3E86D6" stroke={INK} strokeWidth="2" />
      <circle cx="78" cy="52" r="3.4" fill="#5FB84A" stroke={INK} strokeWidth="2" />
      {tier >= 2 && <rect x="68" y="62" width="12" height="9" rx="2.5" fill="#1F2D44" stroke={INK} strokeWidth="2" />}
      {tier >= 2 && <path d="M70 66 H78" stroke="#5FE0A0" strokeWidth="2" strokeLinecap="round" />}
      {tier >= 3 && <path d="M32 22 H88" stroke={INK} strokeWidth="1.2" opacity=".5" />}
    </g>
  )
}

function BenchArt({ tier }: { tier: number }) {
  const L = tierLook(tier)
  const top = ['#C98A4B', '#B4743A', L.light, '#F4F1EC'][tier] ?? '#C98A4B'
  const leg = tier >= 2 ? L.dark : '#8A5A2B'
  return (
    <g>
      <ellipse cx="60" cy="91" rx="50" ry="4.5" fill={INK} opacity=".18" />
      <rect x="14" y="62" width="9" height="28" rx="3" fill={leg} stroke={INK} strokeWidth="3" />
      <rect x="97" y="62" width="9" height="28" rx="3" fill={leg} stroke={INK} strokeWidth="3" />
      <rect x="6" y="56" width="108" height="14" rx="5" fill={top} stroke={INK} strokeWidth={SW} />
      {tier <= 1 && [30, 52, 74, 96].map((x) => <path key={x} d={`M${x} 58 V68`} stroke="#000" strokeOpacity=".18" strokeWidth="2" />)}
      {tier === 3 && <path d="M18 62 Q32 58 44 64 M70 61 Q86 66 100 60" fill="none" stroke="#B9B4AA" strokeWidth="1.8" />}
      {tier >= 2 && <path d="M12 59 H108" stroke="#fff" strokeOpacity=".7" strokeWidth="2.5" strokeLinecap="round" />}
      {[tier >= 3 ? 36 : 60, 84].slice(0, tier >= 3 ? 2 : 1).map((cx) => (
        <g key={cx}>
          <ellipse cx={cx} cy="52" rx="20" ry="5" fill="#fff" stroke={INK} strokeWidth="3" />
          <path d={`M${cx - 12} 48 H${cx + 12} Q${cx + 12} 36 ${cx} 36 Q${cx - 12} 36 ${cx - 12} 48Z`} fill="#E6A04C" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <rect x={cx - 13} y="44.5" width="26" height="4" rx="2" fill="#7A3D1D" stroke={INK} strokeWidth="2" />
          <circle cx={cx - 4} cy="39.5" r="1" fill="#FFF3D6" />
          <circle cx={cx + 3} cy="41" r="1" fill="#FFF3D6" />
        </g>
      ))}
    </g>
  )
}

function CounterArt({ tier }: { tier: number }) {
  const L = tierLook(tier)
  const front = ['#9A5B2B', '#6FA8DC', '#EDE9E2', '#2B3A55'][tier] ?? '#9A5B2B'
  const top = ['#E3A86A', L.light, '#FFFFFF', GOLD][tier] ?? '#E3A86A'
  const stools = 3 + tier
  const width = 104
  return (
    <g>
      <ellipse cx="60" cy="92" rx="52" ry="4" fill={INK} opacity=".18" />
      {Array.from({ length: stools }, (_, i) => {
        const x = 8 + ((i + 0.5) * width) / stools
        return (
          <g key={i}>
            <path d={`M${x - 2} 84 V92 M${x + 2} 84 V92`} stroke={INK} strokeWidth="3" strokeLinecap="round" />
            <ellipse cx={x} cy="80" rx="8" ry="4.2" fill={tier >= 2 ? '#E63B2E' : '#C46A12'} stroke={INK} strokeWidth="2.5" />
          </g>
        )
      })}
      <rect x="6" y="34" width="108" height="40" rx="7" fill={front} stroke={INK} strokeWidth={SW} />
      {tier === 1 && [0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={10 + i * 17} y="46" width="14" height="10" rx="2" fill="#fff" opacity=".22" />)}
      {tier === 2 && <path d="M14 50 Q30 44 46 52 T82 50 T106 54" fill="none" stroke="#C9C4B8" strokeWidth="2" />}
      {tier === 3 && <rect x="12" y="52" width="96" height="6" rx="3" fill={GOLD} stroke={INK} strokeWidth="2" />}
      <rect x="2" y="26" width="116" height="14" rx="6" fill={top} stroke={INK} strokeWidth={SW} />
      <path d="M10 30 H44" stroke="#fff" strokeOpacity=".7" strokeWidth="3" strokeLinecap="round" />
      <rect x="82" y="14" width="22" height="14" rx="3" fill={L.dark} stroke={INK} strokeWidth="2.5" />
      <rect x="85" y="17" width="16" height="7" rx="1.5" fill="#5FE0A0" />
    </g>
  )
}

function FridgeArt({ tier }: { tier: number }) {
  const L = tierLook(tier)
  const body = ['#F2F2F2', '#FFFFFF', L.body, L.light][tier] ?? '#F2F2F2'
  const wide = tier >= 2
  return (
    <g>
      <ellipse cx="60" cy="92" rx="38" ry="4" fill={INK} opacity=".18" />
      <rect x={wide ? 22 : 30} y="4" width={wide ? 76 : 60} height="86" rx="10" fill={body} stroke={INK} strokeWidth={SW} />
      <rect x={wide ? 28 : 36} y="10" width={wide ? 64 : 48} height="7" rx="3.5" fill="#fff" opacity=".7" />
      <path d={`M${wide ? 24 : 32} 34 H${wide ? 96 : 88}`} stroke={INK} strokeWidth="3.5" />
      {wide && <path d="M60 36 V88" stroke={INK} strokeWidth="3.5" />}
      <rect x={wide ? 52 : 38} y="16" width="4.5" height="12" rx="2.2" fill={tier >= 3 ? GOLD : L.dark} stroke={INK} strokeWidth="2" />
      <rect x={wide ? 52 : 38} y="44" width="4.5" height="20" rx="2.2" fill={tier >= 3 ? GOLD : L.dark} stroke={INK} strokeWidth="2" />
      {wide && <rect x="64" y="44" width="4.5" height="20" rx="2.2" fill={tier >= 3 ? GOLD : L.dark} stroke={INK} strokeWidth="2" />}
      {tier >= 1 && <rect x={wide ? 70 : 62} y="16" width="16" height="10" rx="2.5" fill="#2B3A55" stroke={INK} strokeWidth="2" />}
      {tier >= 1 && <path d={`M${wide ? 73 : 65} 21 H${wide ? 83 : 75}`} stroke="#7FD6FF" strokeWidth="2" strokeLinecap="round" />}
      {tier === 0 && <circle cx="74" cy="52" r="5" fill="#E63B2E" stroke={INK} strokeWidth="2" />}
      {tier >= 3 && <path d="M24 86 H96" stroke={GOLD} strokeWidth="3.5" />}
      {tier >= 2 && [78, 84].map((x, i) => <path key={x} d={`M${x} ${58 + i * 6} l2 -3 l2 3`} fill="none" stroke="#7FD6FF" strokeWidth="1.8" strokeLinecap="round" />)}
    </g>
  )
}

function RegisterArt({ tier }: { tier: number }) {
  const L = tierLook(tier)
  const body = ['#8A8F99', '#6FA8DC', '#2F3340', '#B72A20'][tier] ?? '#8A8F99'
  return (
    <g>
      <ellipse cx="60" cy="90" rx="48" ry="4.5" fill={INK} opacity=".18" />
      <path d="M78 22 H100 V50 H78Z" fill="#fff" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M82 28 H96 M82 34 H96 M82 40 H92" stroke="#B9B4AA" strokeWidth="2" strokeLinecap="round" />
      <rect x="12" y="52" width="96" height="34" rx="8" fill={body} stroke={INK} strokeWidth={SW} />
      <rect x="18" y="57" width="84" height="6" rx="3" fill="#fff" opacity=".28" />
      <path d="M16 78 H104" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      <rect x="22" y="22" width="48" height="26" rx="6" fill="#1F2D44" stroke={INK} strokeWidth="3.5" transform="rotate(-6 46 35)" />
      <text x="46" y="42" textAnchor="middle" fontFamily="Lilita One" fontSize="15" fill={tier >= 3 ? GOLD : '#7FFFB2'} transform="rotate(-6 46 35)">R$</text>
      {[0, 1, 2, 3].map((i) => (
        <circle key={i} cx={28 + i * 12} cy="68" r="3.6" fill={tier >= 2 ? L.accent : '#E3E0D8'} stroke={INK} strokeWidth="2" />
      ))}
      <circle cx="92" cy="68" r="4.2" fill="#5FB84A" stroke={INK} strokeWidth="2" />
      {tier >= 3 && (
        <g>
          <path d="M12 74 H108" stroke={GOLD} strokeWidth="3" />
          <circle cx="104" cy="16" r="8" fill={GOLD} stroke={INK} strokeWidth="2.5" />
          <text x="104" y="20" textAnchor="middle" fontFamily="Lilita One" fontSize="9" fill="#B7791A">R$</text>
        </g>
      )}
    </g>
  )
}

const ART = { grill: Grill, fryer: FryerArt, drinks: DrinksArt, bench: BenchArt, counter: CounterArt, fridge: FridgeArt, register: RegisterArt } as const

/** Desenho de um equipamento da loja; a aparência muda conforme as melhorias compradas (`tier`). */
export function EquipmentArt({ id, tier, className }: Props) {
  const Art = ART[id]
  return (
    <svg viewBox="0 0 120 96" className={className} aria-hidden>
      <Art tier={tier} />
    </svg>
  )
}
