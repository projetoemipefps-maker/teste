import type { SVGProps } from 'react'
import { INK } from '../palette'

type P = SVGProps<SVGSVGElement>

export function Coin(props: P) {
  return (
    <svg viewBox="0 0 40 40" {...props}>
      <circle cx="20" cy="20" r="17" fill="#F5B82E" stroke={INK} strokeWidth="3.5" />
      <circle cx="20" cy="20" r="11" fill="#FFD866" stroke="#C98F10" strokeWidth="2.5" />
      <path d="M13 12 Q16 9 20 9" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
      <text x="20" y="26" textAnchor="middle" fontSize="15" fontFamily="Lilita One" fill="#B7791A">R$</text>
    </svg>
  )
}

const STAR_PATH = 'M20 3 L25.2 14 L37 15.4 L28.4 23.6 L30.6 35.4 L20 29.6 L9.4 35.4 L11.6 23.6 L3 15.4 L14.8 14Z'

/** Estrela com preenchimento parcial (0–1). */
export function Star({ amount, id, ...props }: { amount: number; id: string } & Omit<P, "fill">) {
  return (
    <svg viewBox="0 0 40 40" {...props}>
      <defs>
        <clipPath id={id}>
          <rect x="0" y="0" width={40 * amount} height="40" />
        </clipPath>
      </defs>
      <path d={STAR_PATH} fill="#7a4a2a" fillOpacity=".35" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d={STAR_PATH} fill="#FFC531" clipPath={`url(#${id})`} />
      <path d={STAR_PATH} fill="none" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
    </svg>
  )
}

export function PauseIcon(props: P) {
  return (
    <svg viewBox="0 0 32 32" {...props}>
      <rect x="6" y="5" width="7" height="22" rx="3" fill="#fff" stroke={INK} strokeWidth="3" />
      <rect x="19" y="5" width="7" height="22" rx="3" fill="#fff" stroke={INK} strokeWidth="3" />
    </svg>
  )
}

export function TrashIcon(props: P) {
  return (
    <svg viewBox="0 0 32 32" {...props}>
      <path d="M8 10 H24 L22.5 27 Q22.3 29 20.5 29 H11.5 Q9.7 29 9.5 27Z" fill="#fff" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M5.5 10 H26.5" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M12 6 H20" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M13.5 14 V24 M18.5 14 V24" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

export function BellIcon(props: P) {
  return (
    <svg viewBox="0 0 32 32" {...props}>
      <path d="M5 24 Q5 10 16 10 Q27 10 27 24Z" fill="#fff" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M3 25 H29" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="16" cy="8" r="2.6" fill="#fff" stroke={INK} strokeWidth="2.5" />
      <path d="M10 17 Q11 13 14 12" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" opacity=".5" />
    </svg>
  )
}

export function ClockIcon(props: P) {
  return (
    <svg viewBox="0 0 32 32" {...props}>
      <circle cx="16" cy="16" r="12" fill="#fff" stroke={INK} strokeWidth="3" />
      <path d="M16 9 V16 L21 19" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function SunIcon(props: P) {
  return (
    <svg viewBox="0 0 32 32" {...props}>
      <g stroke={INK} strokeWidth="3" strokeLinecap="round">
        <path d="M16 2.5 V6 M16 26 V29.5 M2.5 16 H6 M26 16 H29.5 M6.5 6.5 L9 9 M23 23 L25.5 25.5 M25.5 6.5 L23 9 M9 23 L6.5 25.5" />
      </g>
      <circle cx="16" cy="16" r="7.5" fill="#FFC531" stroke={INK} strokeWidth="3" />
    </svg>
  )
}

export function BackIcon(props: P) {
  return (
    <svg viewBox="0 0 32 32" {...props}>
      <path d="M19 7 L10 16 L19 25" fill="none" stroke={INK} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
