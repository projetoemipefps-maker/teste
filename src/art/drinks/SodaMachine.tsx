import { INK } from '../palette'

/** Máquina de refrigerante: o copo fica no vão escuro, sob o bico (posicionado por cima, em HTML). */
export function SodaMachine({ className, label = 'REFRI', body = '#E63B2E', shade = '#7E1F18' }: { className?: string; label?: string; body?: string; shade?: string }) {
  return (
    <svg viewBox="0 0 200 300" className={className} aria-hidden>
      <rect x="6" y="246" width="188" height="48" rx="10" fill="#8B8B93" stroke={INK} strokeWidth="4" />
      <g stroke="#5D5D66" strokeWidth="3">
        {[26, 46, 66, 86, 106, 126, 146, 166].map((x) => (
          <path key={x} d={`M${x} 256 V284`} />
        ))}
      </g>
      <rect x="14" y="8" width="172" height="238" rx="22" fill={body} stroke={INK} strokeWidth="4" />
      <rect x="22" y="16" width="156" height="30" rx="12" fill="#FF6B57" />
      <rect x="28" y="54" width="144" height="46" rx="12" fill="#FFD866" stroke={INK} strokeWidth="4" />
      <text x="100" y="86" textAnchor="middle" fontFamily="Lilita One" fontSize={label.length > 5 ? 26 : 30} fill="#B72A20" stroke={INK} strokeWidth="1.2">
        {label}
      </text>
      <rect x="28" y="112" width="144" height="126" rx="12" fill={shade} stroke={INK} strokeWidth="4" />
      <rect x="84" y="116" width="32" height="20" rx="6" fill="#6B6B73" stroke={INK} strokeWidth="3.5" />
      <path d="M92 136 H108 L105 146 H95Z" fill="#4A4A52" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <circle cx="46" cy="126" r="9" fill="#3E86D6" stroke={INK} strokeWidth="3" />
      <circle cx="154" cy="126" r="9" fill="#5FB84A" stroke={INK} strokeWidth="3" />
      <rect x="34" y="226" width="132" height="6" rx="3" fill="#fff" opacity=".15" />
      <path d="M26 22 Q26 18 34 18" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".55" fill="none" />
    </svg>
  )
}
