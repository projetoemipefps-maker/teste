import { INK } from '../palette'

/** Fritadeira com duas cubas de óleo (os cestos ficam por cima, em HTML). */
export function Fryer({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 280 150" preserveAspectRatio="none" className={className} aria-hidden>
      <rect x="4" y="24" width="272" height="122" rx="18" fill="#A9AEB8" stroke={INK} strokeWidth="4" />
      <rect x="12" y="32" width="256" height="14" rx="7" fill="#D6DAE2" />
      <rect x="12" y="52" width="256" height="88" rx="14" fill="#7C818C" />
      <rect x="22" y="58" width="112" height="76" rx="16" fill="#F2B72A" stroke={INK} strokeWidth="4" />
      <rect x="146" y="58" width="112" height="76" rx="16" fill="#F2B72A" stroke={INK} strokeWidth="4" />
      <path d="M32 68 Q60 62 90 68" fill="none" stroke="#FFE07F" strokeWidth="5" strokeLinecap="round" />
      <path d="M156 68 Q184 62 214 68" fill="none" stroke="#FFE07F" strokeWidth="5" strokeLinecap="round" />
    </svg>
  )
}
