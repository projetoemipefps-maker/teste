import { ECONOMY, INGREDIENTS, type Recipe } from '../config'

export interface Payment {
  base: number
  tip: number
  total: number
}

/** Preço de venda do lanche (R$, inteiro). */
export function recipePrice(recipe: Recipe): number {
  const cost = recipe.ingredients.reduce((sum, id) => sum + INGREDIENTS[id].cost, 0)
  return Math.round(cost * ECONOMY.priceMarkup)
}

/**
 * Pagamento por um atendimento. Certo: preço cheio + gorjeta proporcional à paciência restante.
 * Errado: fração do preço, sem gorjeta.
 */
export function computePayment(recipe: Recipe, patienceRatio: number, correct: boolean): Payment {
  const price = recipePrice(recipe)
  if (!correct) {
    const base = Math.round(price * ECONOMY.wrongPayFraction)
    return { base, tip: 0, total: base }
  }
  const ratio = Math.min(1, Math.max(0, patienceRatio))
  const tip = Math.round(price * ECONOMY.tipMaxFraction * ratio)
  return { base: price, tip, total: price + tip }
}
