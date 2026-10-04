import { INK } from '../palette'

export function Plate({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 44" className={className} aria-hidden>
      <ellipse cx="110" cy="28" rx="104" ry="14" fill="#3B1F0E" opacity=".25" />
      <ellipse cx="110" cy="22" rx="104" ry="16" fill="#FFFFFF" stroke={INK} strokeWidth="4" />
      <ellipse cx="110" cy="21" rx="80" ry="9" fill="#F3E7D3" stroke="#D8C6A6" strokeWidth="2" />
      <path d="M30 14 Q60 7 90 8" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
