import { INK } from '../palette'
import type { Mood } from '@/game/engine'

type HairStyle = 'short' | 'long' | 'bun' | 'cap' | 'curly' | 'bald'
interface Look {
  skin: string
  skinShade: string
  hair: string
  hairStyle: HairStyle
  shirt: string
  glasses?: boolean
}

/** Uma entrada por variante; o tamanho deve bater com CUSTOMERS.variantCount. */
export const LOOKS: readonly Look[] = [
  { skin: '#F6C79A', skinShade: '#E8A874', hair: '#4A2A12', hairStyle: 'short', shirt: '#3E86D6' },
  { skin: '#C98B5B', skinShade: '#B3703F', hair: '#1E1410', hairStyle: 'curly', shirt: '#E6573F', glasses: true },
  { skin: '#F9D5B0', skinShade: '#EDB98A', hair: '#D9892B', hairStyle: 'long', shirt: '#7B5BC4' },
  { skin: '#8D5A3A', skinShade: '#744526', hair: '#1E1410', hairStyle: 'bun', shirt: '#F2A83B' },
  { skin: '#E9B58A', skinShade: '#D79A68', hair: '#7A7A7A', hairStyle: 'bald', shirt: '#3FAE6B', glasses: true },
  { skin: '#F6C79A', skinShade: '#E8A874', hair: '#E6573F', hairStyle: 'cap', shirt: '#2F9E9E' },
]

function Hair({ look }: { look: Look }) {
  const s = { stroke: INK, strokeWidth: 4, strokeLinejoin: 'round' as const, fill: look.hair }
  switch (look.hairStyle) {
    case 'bald':
      return <path d="M46 34 Q56 28 66 30" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="4" strokeLinecap="round" />
    case 'cap':
      return (
        <g {...s}>
          <path d="M24 50 Q26 14 60 14 Q94 14 96 50 Z" />
          <path d="M18 50 H102 Q108 56 98 58 H22 Q12 56 18 50Z" />
          <path d="M44 24 Q54 18 66 20" fill="none" stroke="#fff" strokeOpacity=".5" strokeLinecap="round" />
        </g>
      )
    case 'curly':
      return (
        <g {...s}>
          {[28, 40, 54, 68, 82, 92].map((x, i) => (
            <circle key={x} cx={x} cy={i % 2 ? 22 : 26} r="13" />
          ))}
          <path d="M28 46 Q30 32 60 32 Q90 32 92 46 Q80 38 60 38 Q40 38 28 46Z" />
        </g>
      )
    case 'bun':
      return (
        <g {...s}>
          <circle cx="60" cy="12" r="13" />
          <path d="M26 54 Q22 22 60 22 Q98 22 94 54 Q86 36 60 36 Q34 36 26 54Z" />
        </g>
      )
    case 'long':
    case 'short':
    default:
      return (
        <g {...s}>
          <path d="M26 54 Q22 18 60 18 Q98 18 94 54 Q86 36 60 36 Q34 36 26 54Z" />
        </g>
      )
  }
}

export function CustomerArt({ variant, mood, className }: { variant: number; mood: Mood; className?: string }) {
  const look = LOOKS[((variant % LOOKS.length) + LOOKS.length) % LOOKS.length]!
  return (
    <svg viewBox="0 0 120 150" className={className} aria-hidden>
      {look.hairStyle === 'long' && (
        <path d="M22 70 Q12 16 60 14 Q108 16 98 70 L100 104 Q60 114 20 104Z" fill={look.hair} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      )}
      {/* corpo */}
      <path d="M10 150 Q10 106 60 102 Q110 106 110 150Z" fill={look.shirt} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <path d="M46 103 Q60 118 74 103" fill="#fff" fillOpacity=".35" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <rect x="49" y="86" width="22" height="20" rx="6" fill={look.skinShade} stroke={INK} strokeWidth="4" />
      {/* cabeça */}
      <circle cx="25" cy="64" r="7" fill={look.skin} stroke={INK} strokeWidth="4" />
      <circle cx="95" cy="64" r="7" fill={look.skin} stroke={INK} strokeWidth="4" />
      <ellipse cx="60" cy="62" rx="34" ry="36" fill={look.skin} stroke={INK} strokeWidth="4" />
      <Hair look={look} />
      {/* rosto */}
      {mood === 'happy' ? (
        <g fill="none" stroke={INK} strokeWidth="4.5" strokeLinecap="round">
          <path d="M37 64 Q44 55 51 64" />
          <path d="M69 64 Q76 55 83 64" />
        </g>
      ) : (
        <g>
          <ellipse cx="45" cy="63" rx="5.5" ry="7.5" fill={INK} />
          <ellipse cx="75" cy="63" rx="5.5" ry="7.5" fill={INK} />
          <circle cx="47" cy="60" r="2" fill="#fff" />
          <circle cx="77" cy="60" r="2" fill="#fff" />
        </g>
      )}
      {mood === 'angry' && (
        <g stroke={INK} strokeWidth="5" strokeLinecap="round">
          <path d="M34 49 L54 56" />
          <path d="M86 49 L66 56" />
        </g>
      )}
      {mood === 'happy' && (
        <g fill="#FF8F8F" opacity=".6">
          <ellipse cx="36" cy="76" rx="7" ry="4.5" />
          <ellipse cx="84" cy="76" rx="7" ry="4.5" />
        </g>
      )}
      {mood === 'happy' && (
        <g>
          <path d="M44 76 Q60 100 76 76 Z" fill="#8A2420" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
          <path d="M52 88 Q60 82 68 88 Q60 94 52 88Z" fill="#FF7D7D" />
        </g>
      )}
      {mood === 'neutral' && (
        <path d="M51 82 Q60 87 69 82" fill="none" stroke={INK} strokeWidth="4.5" strokeLinecap="round" />
      )}
      {mood === 'angry' && (
        <path d="M48 87 Q60 76 72 87" fill="none" stroke={INK} strokeWidth="4.5" strokeLinecap="round" />
      )}
      {look.glasses && (
        <g fill="#fff" fillOpacity=".3" stroke={INK} strokeWidth="3.5">
          <circle cx="45" cy="63" r="12" />
          <circle cx="75" cy="63" r="12" />
          <path d="M57 63 H63" fill="none" />
        </g>
      )}
    </svg>
  )
}
