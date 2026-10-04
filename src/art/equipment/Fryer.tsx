import { INK } from '../palette'
import { tierLook } from '../shop/looks'

/** Fritadeira com duas cubas de óleo (os cestos ficam por cima, em HTML); o metal muda com as melhorias. */
export function Fryer({ className, tier = 0 }: { className?: string; tier?: number }) {
  const L = tierLook(tier)
  return (
    <svg viewBox="0 0 280 150" preserveAspectRatio="none" className={className} aria-hidden>
      <rect x="4" y="24" width="272" height="122" rx="18" fill={L.body} stroke={INK} strokeWidth="4" />
      <rect x="12" y="32" width="256" height="14" rx="7" fill={L.light} />
      <rect x="12" y="52" width="256" height="88" rx="14" fill={L.dark} />
      <rect x="22" y="58" width="112" height="76" rx="16" fill={tier >= 3 ? '#FFD54F' : '#F2B72A'} stroke={INK} strokeWidth="4" />
      <rect x="146" y="58" width="112" height="76" rx="16" fill={tier >= 3 ? '#FFD54F' : '#F2B72A'} stroke={INK} strokeWidth="4" />
      <path d="M32 68 Q60 62 90 68" fill="none" stroke="#FFE07F" strokeWidth="5" strokeLinecap="round" />
      <path d="M156 68 Q184 62 214 68" fill="none" stroke="#FFE07F" strokeWidth="5" strokeLinecap="round" />
      {tier >= 2 && <path d="M12 38 H268" stroke={tier >= 3 ? '#F5B82E' : L.accent} strokeWidth="4" strokeLinecap="round" />}
    </svg>
  )
}
