import { DRINKS, type CupSize } from '@/game/config'
import { INK } from '../palette'

const TOP = 16
const BOTTOM = 104
const HEIGHT = BOTTOM - TOP
const CUP_PATH = 'M10 16 H70 L62 100 Q61.5 104 57.5 104 H22.5 Q18.5 104 18 100Z'

/** Escala de cada tamanho de copo dentro do mesmo desenho. */
export const CUP_SCALE: Record<CupSize, number> = { small: 0.7, medium: 0.85, large: 1 }

interface Props {
  size: CupSize
  /** Nível do líquido em relação à capacidade (0 a 1; acima de 1 só aparece transbordando). */
  level?: number
  /** Mostra a marca do mínimo aceitável (usada na máquina). */
  showMin?: boolean
  id: string
  className?: string
}

/** Copo de refrigerante com tampa, canudo e líquido. */
export function Cup({ size, level = 1, showMin = false, id, className }: Props) {
  const clamped = Math.min(1, Math.max(0, level))
  const liquidTop = BOTTOM - HEIGHT * clamped
  const minY = BOTTOM - HEIGHT * DRINKS.minFillRatio
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
            <rect x="0" y={liquidTop} width="80" height={BOTTOM - liquidTop + 2} fill="#5B2A16" />
            <rect x="0" y={liquidTop} width="80" height="5" fill="#8C5233" />
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
      <rect x="6" y="9" width="68" height="9" rx="4.5" fill="#E63B2E" stroke={INK} strokeWidth="3.5" />
      <path d="M44 9 L54 -1 L60 -1" fill="none" stroke={INK} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M44 9 L54 -1 L60 -1" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  )
}
