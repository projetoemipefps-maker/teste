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

export function CheckIcon(props: P) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path d="M5 12.5 L10 17.5 L19 7" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function FlipIcon(props: P) {
  return (
    <svg viewBox="0 0 32 32" {...props}>
      <path d="M7 14 A9 9 0 0 1 24 11" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
      <path d="M25 18 A9 9 0 0 1 8 21" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
      <path d="M24 5 V12 H17" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 27 V20 H15" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Ícones das abas da bancada. */
export function TabBurgerIcon(props: P) {
  return (
    <svg viewBox="0 0 32 32" {...props}>
      <path d="M4 14 Q4 4 16 4 Q28 4 28 14Z" fill="#E39A47" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="3" y="16" width="26" height="5" rx="2.5" fill="#7B3F1C" stroke={INK} strokeWidth="2.5" />
      <path d="M4 23 H28 V25 Q28 28 25 28 H7 Q4 28 4 25Z" fill="#E39A47" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  )
}

export function TabGrillIcon(props: P) {
  return (
    <svg viewBox="0 0 32 32" {...props}>
      <rect x="3" y="14" width="26" height="14" rx="4" fill="#5D5D66" stroke={INK} strokeWidth="2.5" />
      <path d="M8 17 V26 M13 17 V26 M18 17 V26 M23 17 V26" stroke="#2F2F36" strokeWidth="2.5" strokeLinecap="round" />
      <ellipse cx="16" cy="11" rx="9" ry="4.5" fill="#8D4B26" stroke={INK} strokeWidth="2.5" />
      <path d="M12 3 Q10 6 12 8 M17 2 Q15 5 17 7" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity=".8" />
    </svg>
  )
}

export function TabFriesIcon(props: P) {
  return (
    <svg viewBox="0 0 32 32" {...props}>
      <g fill="#FFD966" stroke={INK} strokeWidth="2">
        <rect x="8" y="3" width="4.5" height="14" rx="1.5" transform="rotate(-10 10 10)" />
        <rect x="13.5" y="2" width="4.5" height="15" rx="1.5" />
        <rect x="19" y="3" width="4.5" height="14" rx="1.5" transform="rotate(10 21 10)" />
      </g>
      <path d="M5 16 H27 L24.5 29 H7.5Z" fill="#E63B2E" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  )
}

export function TabCupIcon(props: P) {
  return (
    <svg viewBox="0 0 32 32" {...props}>
      <path d="M8 8 H24 L22 28 H10Z" fill="#fff" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M9.2 16 H22.8 L22 28 H10Z" fill="#5B2A16" />
      <path d="M8 8 H24 L22 28 H10Z" fill="none" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="7" y="5" width="18" height="4" rx="2" fill="#E63B2E" stroke={INK} strokeWidth="2" />
      <path d="M17 5 L20 1 H24" fill="none" stroke={INK} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
