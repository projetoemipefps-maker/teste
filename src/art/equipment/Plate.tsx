import { INK } from '../palette'

const RIM = ['#FFFFFF', '#FFFFFF', '#E9EEF5', '#FFF1B8']
const INNER = ['#F3E7D3', '#DDEBFA', '#C9D1DC', '#F5B82E']
const EDGE = ['#D8C6A6', '#9CC3E8', '#9AA3B5', '#C98F10']

/** Prato de montagem; o acabamento muda com as melhorias da bancada (0 = louça branca … 3 = bandeja dourada). */
export function Plate({ className, tier = 0 }: { className?: string; tier?: number }) {
  const t = Math.min(3, Math.max(0, tier))
  return (
    <svg viewBox="0 0 220 44" className={className} aria-hidden>
      <ellipse cx="110" cy="28" rx="104" ry="14" fill="#3B1F0E" opacity=".25" />
      <ellipse cx="110" cy="22" rx="104" ry="16" fill={RIM[t]} stroke={INK} strokeWidth="4" />
      <ellipse cx="110" cy="21" rx="80" ry="9" fill={INNER[t]} stroke={EDGE[t]} strokeWidth="2" />
      <path d="M30 14 Q60 7 90 8" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      {t >= 3 && <ellipse cx="110" cy="22" rx="94" ry="12" fill="none" stroke="#F5B82E" strokeWidth="2.5" />}
    </svg>
  )
}
