import { ECONOMY } from '../config'
import { tipFactorFromPrice } from './pricing'

export const wrongItemPay = (price: number): number => Math.round(price * ECONOMY.wrongPayFraction)

/** Gorjeta: depende da nota, da rapidez (paciência que sobrou) e do preço cobrado (mais caro, menos gorjeta). */
export function computeTip(price: number, stars: number, patienceRatio: number, priceRatio = 1): number {
  const fraction = ECONOMY.tipFractionByStars[Math.min(5, Math.max(1, stars)) - 1] ?? 0
  const ratio = Math.min(1, Math.max(0, patienceRatio))
  const speed = ECONOMY.tipSpeedFloor + (1 - ECONOMY.tipSpeedFloor) * ratio
  return Math.round(price * fraction * speed * tipFactorFromPrice(priceRatio))
}

/** Bônus por carnes no ponto: proporcional à fração de carnes perfeitas do lanche. */
export function perfectPattyBonus(burgerPrice: number, perfectShare: number): number {
  return Math.round(burgerPrice * ECONOMY.perfectPattyBonusFraction * perfectShare)
}
