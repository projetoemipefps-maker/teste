/** "R$ 80" ou "−R$ 80" (com o sinal de menos de verdade). */
export const formatMoney = (value: number): string => `${value < 0 ? '−' : ''}R$ ${Math.abs(Math.round(value))}`
