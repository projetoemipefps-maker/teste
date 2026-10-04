import { INK } from '../palette'

/** Toldo listrado da hamburgueria (as cores mudam de fase para fase). */
export function Awning({ className, primary = '#E63B2E', secondary = '#FFF3DC' }: { className?: string; primary?: string; secondary?: string }) {
  const stripes = Array.from({ length: 10 })
  return (
    <svg viewBox="0 0 300 52" preserveAspectRatio="none" className={className} aria-hidden>
      {stripes.map((_, i) => (
        <g key={i}>
          <rect x={i * 30} y="0" width="30" height="34" fill={i % 2 ? secondary : primary} />
          <path
            d={`M${i * 30} 34 H${i * 30 + 30} V36 A15 15 0 0 1 ${i * 30} 36Z`}
            fill={i % 2 ? secondary : primary}
          />
        </g>
      ))}
      <path d="M0 34 H300" stroke={INK} strokeWidth="0" />
      <rect x="0" y="0" width="300" height="6" fill="#B72A20" opacity=".35" />
      {stripes.map((_, i) => (
        <path key={i} d={`M${i * 30} 36 A15 15 0 0 0 ${i * 30 + 30} 36`} fill="none" stroke={INK} strokeWidth="3" />
      ))}
      <path d="M0 1.5 H300" stroke={INK} strokeWidth="3" />
    </svg>
  )
}

/** Viga de madeira com lâmpadas penduradas (hamburgueria artesanal). */
export function BulbBeam({ className }: { className?: string }) {
  const bulbs = Array.from({ length: 12 }, (_, i) => 12 + i * 25)
  return (
    <svg viewBox="0 0 300 52" preserveAspectRatio="none" className={className} aria-hidden>
      <rect x="0" y="0" width="300" height="14" fill="#5B3A24" />
      <path d="M0 14 H300" stroke={INK} strokeWidth="3" />
      <path d="M0 1.5 H300" stroke={INK} strokeWidth="3" />
      <path d="M0 16 Q75 40 150 18 T300 16" fill="none" stroke={INK} strokeWidth="2" />
      {bulbs.map((x, i) => (
        <g key={x}>
          <circle cx={x} cy={[26, 30, 32, 30, 26, 26, 28, 30, 31, 30, 27, 25][i]} r="5" fill="#FFE98A" stroke={INK} strokeWidth="2" />
          <circle cx={x} cy={[26, 30, 32, 30, 26, 26, 28, 30, 31, 30, 27, 25][i]} r="9" fill="#FFE98A" opacity=".28" />
        </g>
      ))}
    </svg>
  )
}

/** Marquise reta e iluminada da rede famosa (vermelha com friso dourado). */
export function ChainCanopy({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 52" preserveAspectRatio="none" className={className} aria-hidden>
      <rect x="0" y="0" width="300" height="30" fill="#E63B2E" />
      <rect x="0" y="0" width="300" height="7" fill="#B72A20" opacity=".4" />
      <rect x="0" y="24" width="300" height="9" fill="#F5B82E" />
      <path d="M0 24 H300 M0 33 H300 M0 1.5 H300" stroke={INK} strokeWidth="3" />
      {Array.from({ length: 24 }, (_, i) => <circle key={i} cx={6 + i * 12.5} cy="28.5" r="2.4" fill="#FFF8D6" stroke={INK} strokeWidth="1" />)}
    </svg>
  )
}
