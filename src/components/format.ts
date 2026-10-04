/** "R$ 80" ou "−R$ 80" (com o sinal de menos de verdade). */
export const formatMoney = (value: number): string => `${value < 0 ? '−' : ''}R$ ${Math.abs(Math.round(value))}`

const BONUS_WORD = { patience: 'de paciência', tip: 'de gorjeta', reputation: 'de reputação' } as const

/** "+4% de paciência", "+0,1 de reputação"… */
export function formatBonus(kind: keyof typeof BONUS_WORD, value: number): string {
  const amount = kind === 'reputation' ? value.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : `${Math.round(value * 100)}%`
  return `+${amount} ${BONUS_WORD[kind]}`
}
