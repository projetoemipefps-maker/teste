import type { VenueId } from '@/game/config'
import { INK } from '../palette'

const GOLD = '#F5B82E'

function Person({ x, y, color, hair = '#3B1F0E' }: { x: number; y: number; color: string; hair?: string }) {
  return (
    <g>
      <path d={`M${x - 7} ${y + 22} Q${x - 7} ${y + 9} ${x} ${y + 9} Q${x + 7} ${y + 9} ${x + 7} ${y + 22}Z`} fill={color} stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
      <circle cx={x} cy={y + 4} r="5.5" fill="#F0C7A0" stroke={INK} strokeWidth="2.2" />
      <path d={`M${x - 5.5} ${y + 3} Q${x} ${y - 4} ${x + 5.5} ${y + 3}`} fill={hair} stroke={INK} strokeWidth="1.6" />
    </g>
  )
}

function Stall() {
  return (
    <g>
      <rect x="0" y="86" width="160" height="24" fill="#B8B3AA" />
      <path d="M0 86 H160" stroke={INK} strokeWidth="3" />
      <path d="M0 98 H160" stroke="#9E998F" strokeWidth="2" strokeDasharray="14 10" />
      {/* carrinho */}
      <circle cx="46" cy="88" r="10" fill="#4A4A52" stroke={INK} strokeWidth="3.5" />
      <circle cx="46" cy="88" r="3" fill="#B9BEC8" />
      <circle cx="112" cy="88" r="10" fill="#4A4A52" stroke={INK} strokeWidth="3.5" />
      <circle cx="112" cy="88" r="3" fill="#B9BEC8" />
      <rect x="32" y="52" width="94" height="32" rx="6" fill="#C98A4B" stroke={INK} strokeWidth="4" />
      <rect x="28" y="46" width="102" height="10" rx="4" fill="#E3A86A" stroke={INK} strokeWidth="4" />
      <rect x="40" y="60" width="40" height="18" rx="3" fill="#8A5A2B" stroke={INK} strokeWidth="2.5" />
      <rect x="86" y="62" width="30" height="16" rx="3" fill="#FFF3DC" stroke={INK} strokeWidth="2.5" />
      <text x="101" y="74" textAnchor="middle" fontFamily="Lilita One" fontSize="10" fill="#E63B2E">BRASA</text>
      {/* guarda-sol listrado */}
      <path d="M80 12 V48" stroke={INK} strokeWidth="4" strokeLinecap="round" />
      <path d="M18 40 Q80 -14 142 40Z" fill="#FFF3DC" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <path d="M18 40 Q36 8 80 8 Q60 12 50 40Z M80 8 Q104 12 110 40 H80Z" fill="#E63B2E" />
      <path d="M18 40 Q80 -14 142 40" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
      <path d="M18 40 Q34 48 50 40 Q66 48 80 40 Q96 48 110 40 Q126 48 142 40" fill="#FFF3DC" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <circle cx="80" cy="9" r="4" fill={GOLD} stroke={INK} strokeWidth="2.5" />
      <Person x={20} y={66} color="#3E86D6" />
    </g>
  )
}

function Snackbar() {
  return (
    <g>
      <rect x="0" y="92" width="160" height="18" fill="#B8B3AA" />
      <path d="M0 92 H160" stroke={INK} strokeWidth="3" />
      <rect x="22" y="38" width="116" height="56" fill="#FFE2A8" stroke={INK} strokeWidth="4" />
      <path d="M14 40 L80 8 L146 40Z" fill="#B5472E" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <rect x="40" y="16" width="80" height="18" rx="4" fill="#FFF3DC" stroke={INK} strokeWidth="3" transform="translate(0 6)" />
      <text x="80" y="35" textAnchor="middle" fontFamily="Lilita One" fontSize="11" fill="#E63B2E">LANCHONETE</text>
      {/* janela com toldo */}
      <rect x="32" y="56" width="62" height="30" rx="3" fill="#BEE3F8" stroke={INK} strokeWidth="3.5" />
      <path d="M32 56 H94" stroke={INK} strokeWidth="3" />
      <path d="M62 56 V86" stroke={INK} strokeWidth="2.5" />
      <path d="M36 62 l10 -3 M66 74 l12 -4" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity=".8" />
      {Array.from({ length: 6 }, (_, i) => (
        <path key={i} d={`M${28 + i * 11.5} 46 h11.5 v8 a5.75 5.75 0 0 1 -11.5 0Z`} fill={i % 2 ? '#FFF3DC' : '#E63B2E'} stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
      ))}
      {/* porta */}
      <rect x="104" y="52" width="26" height="42" rx="3" fill="#9A5B2B" stroke={INK} strokeWidth="3.5" />
      <rect x="108" y="58" width="18" height="14" rx="2" fill="#BEE3F8" stroke={INK} strokeWidth="2" />
      <circle cx="124" cy="78" r="2" fill={GOLD} stroke={INK} strokeWidth="1.2" />
      <Person x={148} y={72} color="#5FB84A" />
    </g>
  )
}

function Craft() {
  return (
    <g>
      <rect x="0" y="92" width="160" height="18" fill="#9A958C" />
      <path d="M0 92 H160" stroke={INK} strokeWidth="3" />
      <rect x="14" y="20" width="132" height="74" fill="#B5472E" stroke={INK} strokeWidth="4" />
      {Array.from({ length: 6 }, (_, r) => (
        <g key={r}>
          <path d={`M14 ${28 + r * 12} H146`} stroke="#E3C3A8" strokeWidth="1.8" opacity=".75" />
          {Array.from({ length: 8 }, (_, c) => <path key={c} d={`M${22 + c * 18 + (r % 2) * 9} ${28 + r * 12} v12`} stroke="#E3C3A8" strokeWidth="1.8" opacity=".75" />)}
        </g>
      ))}
      <rect x="10" y="12" width="140" height="12" rx="3" fill="#2B2F3A" stroke={INK} strokeWidth="3.5" />
      <text x="80" y="22" textAnchor="middle" fontFamily="Lilita One" fontSize="9.5" fill={GOLD} letterSpacing="1.5">HAMBURGUERIA</text>
      {/* janelão */}
      <rect x="24" y="44" width="70" height="40" rx="3" fill="#FFE9A8" stroke={INK} strokeWidth="4" />
      <path d="M59 44 V84 M24 64 H94" stroke={INK} strokeWidth="3" />
      <path d="M30 52 l12 -3 M66 70 l14 -4" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity=".85" />
      <circle cx="42" cy="74" r="4" fill="#E63B2E" stroke={INK} strokeWidth="1.8" />
      <circle cx="76" cy="56" r="4" fill="#5FB84A" stroke={INK} strokeWidth="1.8" />
      {/* porta e lousa */}
      <rect x="106" y="48" width="28" height="46" rx="3" fill="#2B2B2B" stroke={INK} strokeWidth="4" />
      <rect x="110" y="54" width="20" height="16" rx="2" fill="#FFE9A8" />
      <rect x="98" y="72" width="8" height="22" fill="#2F3340" stroke={INK} strokeWidth="2" />
      {/* luzes */}
      <path d="M12 28 Q46 40 80 28 T148 28" fill="none" stroke={INK} strokeWidth="2" />
      {[24, 46, 68, 92, 114, 136].map((x, i) => <circle key={x} cx={x} cy={[34, 37, 31, 31, 37, 34][i]} r="3.2" fill="#FFE98A" stroke={INK} strokeWidth="1.6" />)}
      <Person x={146} y={72} color="#E86FA0" />
    </g>
  )
}

function Chain() {
  return (
    <g>
      <rect x="0" y="94" width="160" height="16" fill="#8E8A82" />
      <path d="M0 94 H160" stroke={INK} strokeWidth="3" />
      <rect x="10" y="36" width="140" height="60" fill="#FFFFFF" stroke={INK} strokeWidth="4" />
      <rect x="10" y="36" width="140" height="14" fill="#E63B2E" stroke={INK} strokeWidth="4" />
      <rect x="10" y="50" width="140" height="6" fill={GOLD} stroke={INK} strokeWidth="3" />
      {/* letreiro gigante */}
      <rect x="34" y="4" width="92" height="34" rx="9" fill="#B72A20" stroke={INK} strokeWidth="4" />
      <rect x="40" y="9" width="80" height="24" rx="6" fill="#E63B2E" />
      <path d="M52 30 q-9 -5 -5 -13 q3 4 4 -3 q8 5 5 12 q-1 3 -4 4z" fill={GOLD} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <text x="88" y="27" textAnchor="middle" fontFamily="Lilita One" fontSize="15" fill="#FFF3DC" stroke={INK} strokeWidth="1">BRASA</text>
      <path d="M44 12 H118" stroke="#fff" strokeOpacity=".5" strokeWidth="3" strokeLinecap="round" />
      {/* vidros e portas */}
      <rect x="18" y="62" width="44" height="30" rx="3" fill="#BEE3F8" stroke={INK} strokeWidth="3.5" />
      <rect x="98" y="62" width="44" height="30" rx="3" fill="#BEE3F8" stroke={INK} strokeWidth="3.5" />
      <path d="M26 68 l14 -3 M106 68 l14 -3" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="68" y="60" width="24" height="34" rx="3" fill="#8FC8EE" stroke={INK} strokeWidth="3.5" />
      <path d="M80 60 V94" stroke={INK} strokeWidth="2.5" />
      <circle cx="77" cy="78" r="1.8" fill={INK} />
      <circle cx="83" cy="78" r="1.8" fill={INK} />
      {/* fila */}
      <Person x={40} y={70} color="#3E86D6" />
      <Person x={106} y={70} color="#F28C28" hair="#7A4A2A" />
      <Person x={122} y={70} color="#5FB84A" />
      <Person x={138} y={70} color="#8E6BC9" />
      {[16, 144].map((x) => <path key={x} d={`M${x} 6 L${x + 2} 12 L${x + 8} 14 L${x + 2} 16 L${x} 22 L${x - 2} 16 L${x - 8} 14 L${x - 2} 12Z`} fill={GOLD} stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />)}
    </g>
  )
}

const ART = { stall: Stall, snackbar: Snackbar, craft: Craft, chain: Chain } as const

/** Desenho da fachada de cada fase da hamburgueria (para o card da expansão e a tela de reforma). */
export function VenueArt({ id, className }: { id: VenueId; className?: string }) {
  const Art = ART[id]
  return (
    <svg viewBox="0 0 160 110" className={className} aria-hidden>
      <Art />
    </svg>
  )
}
