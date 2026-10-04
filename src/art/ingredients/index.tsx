import type { SVGProps } from 'react'
import type { IngredientId } from '@/game/config'
import type { PattyQuality } from '@/game/engine'
import { INK, STROKE } from '../palette'
import { PATTY_QUALITY_COLORS } from '../cooking'

/** Todas as peças têm 160 de largura; a altura varia. */
export const ART_WIDTH = 160
export const ART_HEIGHT: Record<IngredientId, number> = {
  bunBottom: 40,
  patty: 38,
  cheese: 30,
  lettuce: 34,
  tomato: 26,
  bunTop: 72,
}
/** Quanto cada peça se sobrepõe à de baixo ao empilhar (unidades do viewBox). */
export const ART_OVERLAP: Record<IngredientId, number> = {
  bunBottom: 0,
  patty: 8,
  cheese: 8,
  lettuce: 10,
  tomato: 8,
  bunTop: 12,
}

type P = SVGProps<SVGSVGElement>
const common = { strokeLinejoin: 'round', strokeLinecap: 'round', strokeWidth: STROKE, stroke: INK } as const

export function BunBottom(props: P) {
  return (
    <svg viewBox="0 0 160 40" {...props}>
      <path d="M6 5 H154 Q158 5 158 9 V22 Q158 36 142 36 H18 Q2 36 2 22 V9 Q2 5 6 5Z" fill="#E39A47" {...common} />
      <path d="M4.5 22 H155.5 Q153 33.5 142 33.5 H18 Q7 33.5 4.5 22Z" fill="#C27526" />
      <rect x="16" y="10" width="46" height="5" rx="2.5" fill="#F7C07E" />
    </svg>
  )
}

export function Patty({ quality = 'perfect', ...props }: P & { quality?: PattyQuality }) {
  const c = PATTY_QUALITY_COLORS[quality]
  return (
    <svg viewBox="0 0 160 38" {...props}>
      <path d="M8 10 Q8 4 16 4 H144 Q152 4 152 10 V26 Q152 34 144 34 H16 Q8 34 8 26Z" fill={c.base} {...common} />
      <path d="M12 12 Q12 8 18 8 H142 Q148 8 148 12 Z" fill={c.top} />
      <g stroke={c.marks} strokeWidth="3" strokeLinecap="round">
        <path d="M34 15 L42 25" />
        <path d="M62 15 L70 25" />
        <path d="M90 15 L98 25" />
        <path d="M118 15 L126 25" />
      </g>
      <circle cx="22" cy="24" r="2.5" fill={c.marks} />
      <circle cx="140" cy="22" r="2.5" fill={c.marks} />
    </svg>
  )
}

export function Cheese(props: P) {
  return (
    <svg viewBox="0 0 160 30" {...props}>
      <path
        d="M6 5 H154 L148 12 H134 L129 24 Q125.5 28 122 24 L116 12 H44 L39 19 Q36 22.5 33 19 L28 12 H12 Z"
        fill="#FFC93C"
        {...common}
      />
      <path d="M16 8.5 H60" stroke="#FFE58A" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function Lettuce(props: P) {
  return (
    <svg viewBox="0 0 160 34" {...props}>
      <path
        d="M4 14 Q14 2 26 11 Q38 2 50 11 Q62 2 74 11 Q86 2 98 11 Q110 2 122 11 Q134 2 146 11 Q154 4 158 14 Q150 20 156 26 Q146 34 134 26 Q122 34 110 26 Q98 34 86 26 Q74 34 62 26 Q50 34 38 26 Q26 34 14 26 Q8 24 4 14Z"
        fill="#7BCB5A"
        {...common}
      />
      <path d="M16 17 Q40 11 70 17 T134 17" fill="none" stroke="#B2EC95" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function Tomato(props: P) {
  return (
    <svg viewBox="0 0 160 26" {...props}>
      <rect x="6" y="4" width="148" height="18" rx="9" fill="#E8412F" {...common} />
      <rect x="20" y="9" width="120" height="6" rx="3" fill="#FF7A66" />
      <g fill="#FFE2A8">
        <ellipse cx="46" cy="12" rx="3" ry="1.6" />
        <ellipse cx="80" cy="12" rx="3" ry="1.6" />
        <ellipse cx="114" cy="12" rx="3" ry="1.6" />
      </g>
    </svg>
  )
}

export function BunTop(props: P) {
  return (
    <svg viewBox="0 0 160 72" {...props}>
      <path
        d="M4 66 C2 26 38 5 80 5 C122 5 158 26 156 66 Q156 70 150 70 H10 Q4 70 4 66Z"
        fill="#E39A47"
        {...common}
      />
      <path d="M5 54 H155 Q156 62 155 66 Q155 68 150 68 H10 Q5 68 5 66 Q4 62 5 54Z" fill="#C27526" />
      <path d="M22 40 Q34 18 62 13" fill="none" stroke="#F7C07E" strokeWidth="5" strokeLinecap="round" />
      <g fill="#FFF3DC" stroke="#C27526" strokeWidth="1.5">
        <ellipse cx="60" cy="26" rx="6" ry="3.4" transform="rotate(-20 60 26)" />
        <ellipse cx="88" cy="22" rx="6" ry="3.4" transform="rotate(15 88 22)" />
        <ellipse cx="112" cy="34" rx="6" ry="3.4" transform="rotate(35 112 34)" />
        <ellipse cx="76" cy="42" rx="6" ry="3.4" transform="rotate(-8 76 42)" />
        <ellipse cx="46" cy="44" rx="6" ry="3.4" transform="rotate(25 46 44)" />
        <ellipse cx="102" cy="50" rx="6" ry="3.4" transform="rotate(-25 102 50)" />
        <ellipse cx="128" cy="50" rx="5" ry="3" transform="rotate(10 128 50)" />
      </g>
    </svg>
  )
}

const ART: Record<IngredientId, (p: P) => React.JSX.Element> = {
  bunBottom: BunBottom,
  patty: Patty,
  cheese: Cheese,
  lettuce: Lettuce,
  tomato: Tomato,
  bunTop: BunTop,
}

/** `quality` só vale para a carne. */
export function IngredientArt({ id, quality, ...props }: { id: IngredientId; quality?: PattyQuality } & P) {
  if (id === 'patty') return <Patty quality={quality} {...props} />
  const Art = ART[id]
  return <Art {...props} />
}

/** Carne vista de cima (chapa e prato). `color` é a cor do lado visível. */
export function PattyDisc({ color, className }: { color: string; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <ellipse cx="50" cy="56" rx="44" ry="40" fill="#000" opacity=".22" />
      <path
        d="M50 8 C74 6 94 24 93 50 C92 76 72 94 48 92 C24 91 7 74 8 49 C9 25 27 9 50 8Z"
        fill={color}
        stroke={INK}
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
      <path d="M24 34 Q34 18 52 16" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="5" strokeLinecap="round" />
      <g fill="#000" opacity=".16">
        <circle cx="34" cy="58" r="4.5" />
        <circle cx="62" cy="44" r="4" />
        <circle cx="58" cy="70" r="5" />
        <circle cx="72" cy="62" r="3" />
        <circle cx="40" cy="40" r="3" />
      </g>
    </svg>
  )
}
