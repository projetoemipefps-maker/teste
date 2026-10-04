/** Aparências dos equipamentos conforme as melhorias: 0 = simples … 3 = premium. */
export const TIER_NAMES = ['Básico', 'Reforçado', 'Profissional', 'Premium'] as const

export interface TierLook {
  body: string
  light: string
  dark: string
  /** Acabamento: aço nos degraus do meio e dourado no premium. */
  trim: string
  accent: string
  /** Superfície de trabalho (chapa, tampo). */
  plate: string
}

export const TIER_LOOK: readonly TierLook[] = [
  { body: '#8A8F99', light: '#B9BEC8', dark: '#5D6169', trim: '#6B6F78', accent: '#E63B2E', plate: '#3E3E46' },
  { body: '#A9AEB8', light: '#D6DAE2', dark: '#7C818C', trim: '#8D929C', accent: '#F28C28', plate: '#5A5A64' },
  { body: '#C9D1DC', light: '#F1F5FA', dark: '#8E98A8', trim: '#AEB8C6', accent: '#3E86D6', plate: '#D6DCE6' },
  { body: '#D9DEE8', light: '#FFFFFF', dark: '#9AA3B5', trim: '#F5B82E', accent: '#F5B82E', plate: '#EEF1F6' },
]

export const tierLook = (tier: number): TierLook => TIER_LOOK[Math.min(TIER_LOOK.length - 1, Math.max(0, Math.floor(tier)))]!
