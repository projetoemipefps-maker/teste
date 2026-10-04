import type { ComponentType, SVGProps } from 'react'
import type { IngredientId } from '@/game/config'
import type { PattyQuality } from '@/game/engine'
import { INK, STROKE } from '../palette'
import { PATTY_QUALITY_COLORS } from '../cooking'

/** Todas as peças têm 160 de largura; a altura varia. */
export const ART_WIDTH = 160
export const ART_HEIGHT: Record<IngredientId, number> = {
  bunBottom: 40, bunTop: 72, briocheBottom: 40, briocheTop: 72, australianBottom: 40, australianTop: 72,
  patty: 38, chicken: 40, veggie: 38,
  cheese: 30, cheddar: 30, creamyCheddar: 32,
  lettuce: 34, tomato: 26, onion: 26, pickles: 24, caramelizedOnion: 28,
  bacon: 26, egg: 34,
  greenMayo: 20, barbecue: 20,
}
/** Quanto cada peça se sobrepõe à de baixo ao empilhar (unidades do viewBox). */
export const ART_OVERLAP: Record<IngredientId, number> = {
  bunBottom: 0, bunTop: 12, briocheBottom: 0, briocheTop: 12, australianBottom: 0, australianTop: 12,
  patty: 8, chicken: 8, veggie: 8,
  cheese: 8, cheddar: 8, creamyCheddar: 10,
  lettuce: 10, tomato: 8, onion: 8, pickles: 8, caramelizedOnion: 8,
  bacon: 8, egg: 8,
  greenMayo: 6, barbecue: 6,
}

type P = SVGProps<SVGSVGElement>
const common = { strokeLinejoin: 'round', strokeLinecap: 'round', strokeWidth: STROKE, stroke: INK } as const

interface BunTone {
  base: string
  shade: string
  hi: string
}
const BUN_TONES = {
  classic: { base: '#E39A47', shade: '#C27526', hi: '#F7C07E' },
  brioche: { base: '#F0B65A', shade: '#D8923A', hi: '#FFE3A8' },
  australian: { base: '#A5612E', shade: '#7E4520', hi: '#C98A52' },
} satisfies Record<string, BunTone>
type BunKind = keyof typeof BUN_TONES

function BunBottomArt({ tone, ...props }: P & { tone: BunKind }) {
  const t = BUN_TONES[tone]
  return (
    <svg viewBox="0 0 160 40" {...props}>
      <path d="M6 5 H154 Q158 5 158 9 V22 Q158 36 142 36 H18 Q2 36 2 22 V9 Q2 5 6 5Z" fill={t.base} {...common} />
      <path d="M4.5 22 H155.5 Q153 33.5 142 33.5 H18 Q7 33.5 4.5 22Z" fill={t.shade} />
      <rect x="16" y="10" width="46" height="5" rx="2.5" fill={t.hi} />
    </svg>
  )
}

function BunTopArt({ tone, ...props }: P & { tone: BunKind }) {
  const t = BUN_TONES[tone]
  return (
    <svg viewBox="0 0 160 72" {...props}>
      <path d="M4 66 C2 26 38 5 80 5 C122 5 158 26 156 66 Q156 70 150 70 H10 Q4 70 4 66Z" fill={t.base} {...common} />
      <path d="M5 54 H155 Q156 62 155 66 Q155 68 150 68 H10 Q5 68 5 66 Q4 62 5 54Z" fill={t.shade} />
      <path d="M22 40 Q34 18 62 13" fill="none" stroke={t.hi} strokeWidth={tone === 'brioche' ? 7 : 5} strokeLinecap="round" />
      {tone === 'classic' && (
        <g fill="#FFF3DC" stroke="#C27526" strokeWidth="1.5">
          {[[60, 26, -20], [88, 22, 15], [112, 34, 35], [76, 42, -8], [46, 44, 25], [102, 50, -25], [128, 50, 10]].map(([x, y, r], i) => (
            <ellipse key={i} cx={x} cy={y} rx="6" ry="3.4" transform={`rotate(${r} ${x} ${y})`} />
          ))}
        </g>
      )}
      {tone === 'brioche' && (
        <g fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="3" strokeLinecap="round">
          <path d="M90 22 Q104 24 114 34" />
          <path d="M70 18 Q76 16 82 17" />
        </g>
      )}
      {tone === 'australian' && (
        <g fill="#E8D8B8" stroke="#7E4520" strokeWidth="1.2">
          {[[56, 28, -30], [84, 20, 20], [110, 32, 40], [72, 40, -10], [96, 46, 30], [48, 46, 15], [126, 48, -20], [62, 54, 5]].map(([x, y, r], i) => (
            <ellipse key={i} cx={x} cy={y} rx="5.5" ry="2.6" transform={`rotate(${r} ${x} ${y})`} />
          ))}
        </g>
      )}
    </svg>
  )
}

export const BunBottom = (p: P) => <BunBottomArt tone="classic" {...p} />
export const BunTop = (p: P) => <BunTopArt tone="classic" {...p} />
export const BriocheBottom = (p: P) => <BunBottomArt tone="brioche" {...p} />
export const BriocheTop = (p: P) => <BunTopArt tone="brioche" {...p} />
export const AustralianBottom = (p: P) => <BunBottomArt tone="australian" {...p} />
export const AustralianTop = (p: P) => <BunTopArt tone="australian" {...p} />

export function Patty({ quality = 'perfect', ...props }: P & { quality?: PattyQuality }) {
  const c = PATTY_QUALITY_COLORS.patty[quality]
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

export function Chicken({ quality = 'perfect', ...props }: P & { quality?: PattyQuality }) {
  const c = PATTY_QUALITY_COLORS.chicken[quality]
  return (
    <svg viewBox="0 0 160 40" {...props}>
      <path
        d="M10 14 Q8 6 18 5 Q28 2 40 5 Q56 2 72 5 Q90 2 106 5 Q122 2 136 6 Q152 4 151 16 Q154 24 148 30 Q146 36 134 35 Q118 38 100 35 Q84 38 66 35 Q48 38 32 35 Q14 36 12 28 Q6 22 10 14Z"
        fill={c.base}
        {...common}
      />
      <path d="M16 12 Q30 8 52 10 T96 9 T140 12" fill="none" stroke={c.top} strokeWidth="5" strokeLinecap="round" />
      <g fill={c.marks}>
        {[[28, 20], [48, 26], [70, 18], [92, 25], [114, 19], [132, 26], [58, 14], [104, 14]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i % 2 ? 2.2 : 3} />
        ))}
      </g>
    </svg>
  )
}

export function Veggie({ quality = 'perfect', ...props }: P & { quality?: PattyQuality }) {
  const c = PATTY_QUALITY_COLORS.veggie[quality]
  return (
    <svg viewBox="0 0 160 38" {...props}>
      <path d="M8 10 Q8 4 16 4 H144 Q152 4 152 10 V26 Q152 34 144 34 H16 Q8 34 8 26Z" fill={c.base} {...common} />
      <path d="M12 12 Q12 8 18 8 H142 Q148 8 148 12 Z" fill={c.top} />
      <g>
        {[[30, 18, '#E8A33D'], [52, 24, '#6F9B3F'], [76, 16, '#D9573B'], [98, 24, '#6F9B3F'], [120, 18, '#E8A33D'], [140, 24, '#D9573B'], [64, 12, '#F2E2B2'], [108, 12, '#F2E2B2']].map(([x, y, col], i) => (
          <ellipse key={i} cx={x as number} cy={y as number} rx="4.5" ry="3" fill={col as string} opacity=".9" />
        ))}
      </g>
    </svg>
  )
}

function CheeseSlice({ fill, hi, ...props }: P & { fill: string; hi: string }) {
  return (
    <svg viewBox="0 0 160 30" {...props}>
      <path d="M6 5 H154 L148 12 H134 L129 24 Q125.5 28 122 24 L116 12 H44 L39 19 Q36 22.5 33 19 L28 12 H12 Z" fill={fill} {...common} />
      <path d="M16 8.5 H60" stroke={hi} strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
export const Cheese = (p: P) => <CheeseSlice fill="#FFC93C" hi="#FFE58A" {...p} />
export const Cheddar = (p: P) => <CheeseSlice fill="#F29A2E" hi="#FFC373" {...p} />

export function CreamyCheddar(props: P) {
  return (
    <svg viewBox="0 0 160 32" {...props}>
      <path
        d="M8 8 Q20 2 40 6 Q60 2 80 6 Q100 2 120 6 Q140 2 152 8 Q158 14 150 17 L146 17 Q143 28 138 28 Q133 28 132 17 L104 17 Q102 24 98 24 Q94 24 93 17 L60 17 Q58 29 52 29 Q47 29 46 17 L16 17 Q4 16 8 8Z"
        fill="#F5A623"
        {...common}
      />
      <path d="M22 9 Q40 6 60 9" fill="none" stroke="#FFD27A" strokeWidth="3.5" strokeLinecap="round" />
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

export function Onion(props: P) {
  return (
    <svg viewBox="0 0 160 26" {...props}>
      <rect x="10" y="4" width="140" height="18" rx="9" fill="#F4E6F0" {...common} />
      <g fill="none" stroke="#C68AC4" strokeWidth="2.5" strokeLinecap="round">
        <path d="M24 10 Q32 17 40 10" />
        <path d="M52 10 Q60 17 68 10" />
        <path d="M80 10 Q88 17 96 10" />
        <path d="M108 10 Q116 17 124 10" />
      </g>
    </svg>
  )
}

export function Pickles(props: P) {
  return (
    <svg viewBox="0 0 160 24" {...props}>
      {[22, 62, 102].map((x) => (
        <g key={x}>
          <rect x={x} y="4" width="38" height="16" rx="8" fill="#7FB04A" {...common} />
          <rect x={x + 6} y="8" width="22" height="4" rx="2" fill="#A9D26F" />
          <g fill="#4F7A2A">
            <circle cx={x + 10} cy="15" r="1.6" />
            <circle cx={x + 20} cy="16" r="1.6" />
            <circle cx={x + 30} cy="15" r="1.6" />
          </g>
        </g>
      ))}
    </svg>
  )
}

export function CaramelizedOnion(props: P) {
  return (
    <svg viewBox="0 0 160 28" {...props}>
      <path
        d="M8 14 Q16 4 28 10 Q38 3 50 10 Q64 4 76 11 Q90 4 102 11 Q116 4 128 10 Q142 5 152 14 Q146 24 134 20 Q122 26 108 21 Q94 26 80 21 Q66 26 52 21 Q38 26 24 21 Q12 24 8 14Z"
        fill="#9A5A22"
        {...common}
      />
      <g fill="none" stroke="#D49A58" strokeWidth="3" strokeLinecap="round">
        <path d="M20 13 Q34 8 48 14" />
        <path d="M62 14 Q78 8 94 15" />
        <path d="M104 14 Q120 9 136 14" />
      </g>
    </svg>
  )
}

export function Bacon(props: P) {
  return (
    <svg viewBox="0 0 160 26" {...props}>
      <path d="M6 12 Q18 2 32 11 Q46 20 60 10 Q74 2 88 11 Q102 20 116 10 Q130 2 146 10 L154 14 Q146 22 134 18 Q120 26 106 18 Q92 10 78 19 Q64 26 50 18 Q36 10 22 19 Q12 22 6 12Z" fill="#D9534F" {...common} />
      <g fill="none" stroke="#F5C1B8" strokeWidth="3" strokeLinecap="round">
        <path d="M18 11 Q32 15 46 12" />
        <path d="M70 12 Q84 16 98 12" />
        <path d="M112 11 Q126 14 140 11" />
      </g>
    </svg>
  )
}

export function Egg(props: P) {
  return (
    <svg viewBox="0 0 160 34" {...props}>
      <path d="M6 20 Q4 10 18 12 Q30 4 50 9 Q70 4 90 9 Q112 4 132 10 Q154 8 154 20 Q156 30 140 29 Q120 32 100 29 Q80 32 60 29 Q38 32 20 29 Q6 30 6 20Z" fill="#FFFDF5" {...common} />
      <path d="M52 20 Q52 6 80 6 Q108 6 108 20 Q108 26 80 26 Q52 26 52 20Z" fill="#FFC21A" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M62 14 Q68 9 78 9" fill="none" stroke="#FFE98A" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  )
}

function Sauce({ fill, hi, ...props }: P & { fill: string; hi: string }) {
  return (
    <svg viewBox="0 0 160 20" {...props}>
      <path d="M6 10 Q12 3 22 8 Q34 14 46 8 Q58 2 70 8 Q82 14 94 8 Q106 2 118 8 Q130 14 142 8 Q150 4 154 10 Q150 16 142 14 Q130 19 118 14 Q106 19 94 14 Q82 19 70 14 Q58 19 46 14 Q34 19 22 14 Q12 16 6 10Z" fill={fill} {...common} strokeWidth="3.5" />
      <path d="M20 8 Q32 11 44 8" fill="none" stroke={hi} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}
export const GreenMayo = (p: P) => <Sauce fill="#8FD14F" hi="#C9F09A" {...p} />
export const Barbecue = (p: P) => <Sauce fill="#7A2E14" hi="#B0583A" {...p} />

type ProteinProps = P & { quality?: PattyQuality }
const ART: Record<IngredientId, ComponentType<ProteinProps>> = {
  bunBottom: BunBottom, bunTop: BunTop, briocheBottom: BriocheBottom, briocheTop: BriocheTop,
  australianBottom: AustralianBottom, australianTop: AustralianTop,
  patty: Patty, chicken: Chicken, veggie: Veggie,
  cheese: Cheese, cheddar: Cheddar, creamyCheddar: CreamyCheddar,
  lettuce: Lettuce, tomato: Tomato, onion: Onion, pickles: Pickles, caramelizedOnion: CaramelizedOnion,
  bacon: Bacon, egg: Egg, greenMayo: GreenMayo, barbecue: Barbecue,
}

/** `quality` só vale para as proteínas (carne, frango, vegetal). */
export function IngredientArt({ id, quality, ...props }: { id: IngredientId; quality?: PattyQuality } & P) {
  const Art = ART[id]
  return <Art quality={quality} {...props} />
}

/** Proteína vista de cima (chapa e prato). `color` é a cor do lado visível. */
export function PattyDisc({ color, kind = 'patty', className }: { color: string; kind?: 'patty' | 'chicken' | 'veggie'; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <ellipse cx="50" cy="56" rx="44" ry="40" fill="#000" opacity=".22" />
      <path
        d={kind === 'chicken'
          ? 'M50 8 C70 4 92 20 93 44 C96 60 88 82 66 90 C54 96 36 94 24 86 C8 76 4 56 10 40 C14 20 30 10 50 8Z'
          : 'M50 8 C74 6 94 24 93 50 C92 76 72 94 48 92 C24 91 7 74 8 49 C9 25 27 9 50 8Z'}
        fill={color}
        stroke={INK}
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
      <path d="M24 34 Q34 18 52 16" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="5" strokeLinecap="round" />
      {kind === 'chicken' ? (
        <g fill="#000" opacity=".14">
          {[[30, 30], [50, 24], [68, 34], [26, 52], [48, 48], [72, 56], [38, 70], [60, 74]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i % 2 ? 3.5 : 5} />
          ))}
        </g>
      ) : kind === 'veggie' ? (
        <g opacity=".7">
          {[[32, 36, '#E8A33D'], [58, 30, '#6F9B3F'], [70, 54, '#D9573B'], [40, 62, '#6F9B3F'], [56, 72, '#E8A33D'], [26, 52, '#D9573B']].map(([x, y, c], i) => (
            <ellipse key={i} cx={x as number} cy={y as number} rx="5" ry="3.5" fill={c as string} />
          ))}
        </g>
      ) : (
        <g fill="#000" opacity=".16">
          <circle cx="34" cy="58" r="4.5" />
          <circle cx="62" cy="44" r="4" />
          <circle cx="58" cy="70" r="5" />
          <circle cx="72" cy="62" r="3" />
          <circle cx="40" cy="40" r="3" />
        </g>
      )}
    </svg>
  )
}
