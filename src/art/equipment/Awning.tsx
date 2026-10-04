import { INK } from '../palette'

/** Toldo listrado da hamburgueria. */
export function Awning({ className }: { className?: string }) {
  const stripes = Array.from({ length: 10 })
  return (
    <svg viewBox="0 0 300 52" preserveAspectRatio="none" className={className} aria-hidden>
      {stripes.map((_, i) => (
        <g key={i}>
          <rect x={i * 30} y="0" width="30" height="34" fill={i % 2 ? '#FFF3DC' : '#E63B2E'} />
          <path
            d={`M${i * 30} 34 H${i * 30 + 30} V36 A15 15 0 0 1 ${i * 30} 36Z`}
            fill={i % 2 ? '#FFF3DC' : '#E63B2E'}
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
