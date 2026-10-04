export const ECONOMY = {
  /** Preço de venda = soma dos custos dos ingredientes × este fator (arredondado). */
  priceMarkup: 1.6,
  /** Fração do preço paga quando o lanche está errado. */
  wrongPayFraction: 0.3,
  /** Gorjeta máxima como fração do preço (proporcional à paciência restante). */
  tipMaxFraction: 0.5,
  startingMoney: 0,
} as const
