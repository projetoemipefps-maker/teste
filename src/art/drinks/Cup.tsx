import { DRINKS, type CupSize, type DrinkKind } from '@/game/config'
import { INK } from '../palette'

const TOP = 16
const BOTTOM = 104
const HEIGHT = BOTTOM - TOP
const CUP_PATH = 'M10 16 H70 L62 100 Q61.5 104 57.5 104 H22.5 Q18.5 104 18 100Z'

/** Escala de cada tamanho de copo dentro do mesmo desenho. */
export const CUP_SCALE: Record<CupSize, number> = { small: 0.7, medium: 0.85, large: 1 }

/** Cor do líquido e do brilho de cada bebida. */
export const DRINK_COLORS: Record<DrinkKind, { liquid: string; foam: string }> = {
  soda: { liquid: '#5B2A16', foam: '#8C5233' },
  juice: { liquid: '#F5A623', foam: '#FFD27A' },
  shakeChocolate: { liquid: '#6B3A22', foam: '#A66B43' },
  shakeStrawberry: { liquid: '#F28BA8', foam: '#FFC2D1' },
  shakeVanilla: { liquid: '#F3DDA6', foam: '#FFF3D2' },
}

interface Props {
  kind?: DrinkKind
  size: CupSize
  /** Nível do líquido em relação à capacidade (0 a 1; acima de 1 só aparece transbordando). */
  level?: number
  /** Mostra a marca do mínimo aceitável (usada na máquina). */
  showMin?: boolean
  id: string
  className?: string
}

/** Copo de bebida com tampa, canudo e líquido (milkshake ganha chantilly). */
export function Cup({ kind = 'soda', size, level = 1, showMin = false, id, className }: Props) {
  const clamped = Math.min(1, Math.max(0, level))
  const liquidTop = BOTTOM - HEIGHT * clamped
  const minY = BOTTOM - HEIGHT * DRINKS.minFillRatio
  const colors = DRINK_COLORS[kind]
  const shake = kind.startsWith('shake')
  return (
    <svg viewBox="0 0 80 112" className={className} aria-hidden>
      <g transform={`translate(40 108) scale(${CUP_SCALE[size]}) translate(-40 -108)`}>
        <defs>
          <clipPath id={`cup-${id}`}>
            <path d={CUP_PATH} />
          </clipPath>
        </defs>
        <path d={CUP_PATH} fill="#fff" fillOpacity=".55" />
        <g clipPath={`url(#cup-${id})`}>
          {clamped > 0 && (
            <>
              <rect x="0" y={liquidTop} width="80" height={BOTTOM - liquidTop + 2} fill={colors.liquid} />
              <rect x="0" y={liquidTop} width="80" height="5" fill={colors.foam} />
              <path d={`M16 ${liquidTop + 9} L18 ${liquidTop + 40}`} stroke="#fff" strokeOpacity=".25" strokeWidth="4" strokeLinecap="round" />
            </>
          )}
          <path d="M17 24 L22 92" stroke="#fff" strokeOpacity=".5" strokeWidth="4" strokeLinecap="round" />
        </g>
        <path d={CUP_PATH} fill="none" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        {showMin && (
          <g>
            <path d={`M14 ${minY} H66`} stroke="#fff" strokeWidth="2.5" strokeDasharray="5 4" />
            <path d={`M14 ${minY} H66`} stroke={INK} strokeWidth="1" strokeDasharray="5 4" opacity=".6" />
          </g>
        )}
        {shake && (
          <g stroke={INK} strokeWidth="3" strokeLinejoin="round">
            <path d="M12 12 Q10 0 26 2 Q30 -6 42 0 Q56 -4 60 4 Q72 4 68 12Z" fill="#FFFDF5" />
            <circle cx="40" cy="-2" r="4.5" fill="#E63B2E" />
          </g>
        )}
        <rect x="6" y="9" width="68" height="9" rx="4.5" fill="#E63B2E" stroke={INK} strokeWidth="3.5" />
        <path d="M44 9 L54 -1 L60 -1" fill="none" stroke={INK} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M44 9 L54 -1 L60 -1" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  )
}
