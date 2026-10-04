import { DRINKS, ECONOMY, INGREDIENTS, type CupSize, type Recipe } from '../config'
import type { OrderItems } from './types'
import { getRecipe } from './customers'

/** Preço de venda do lanche (R$, inteiro). */
export function recipePrice(recipe: Recipe): number {
  const cost = recipe.ingredients.reduce((sum, id) => sum + INGREDIENTS[id].cost, 0)
  return Math.round(cost * ECONOMY.priceMarkup)
}

export function drinkPrice(size: CupSize): number {
  return DRINKS.cups[size].price
}

/** Quanto o pedido custa quando tudo é entregue certo. */
export function orderPrice(order: OrderItems): number {
  return (
    recipePrice(getRecipe(order.recipeId)) +
    (order.fries ? ECONOMY.friesPrice : 0) +
    (order.drink ? drinkPrice(order.drink) : 0)
  )
}

export const wrongItemPay = (price: number): number => Math.round(price * ECONOMY.wrongPayFraction)

/** Gorjeta: depende da nota e da rapidez (paciência que sobrou). */
export function computeTip(price: number, stars: number, patienceRatio: number): number {
  const fraction = ECONOMY.tipFractionByStars[Math.min(5, Math.max(1, stars)) - 1] ?? 0
  const ratio = Math.min(1, Math.max(0, patienceRatio))
  const speed = ECONOMY.tipSpeedFloor + (1 - ECONOMY.tipSpeedFloor) * ratio
  return Math.round(price * fraction * speed)
}

/** Bônus por carnes no ponto: proporcional à fração de carnes perfeitas do lanche. */
export function perfectPattyBonus(burgerPrice: number, perfectShare: number): number {
  return Math.round(burgerPrice * ECONOMY.perfectPattyBonusFraction * perfectShare)
}
