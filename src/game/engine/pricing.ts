import { DRINKS, ECONOMY, PRICING, RECIPES, CUP_SIZES, FRIES_STOCK_UNITS, STOCK_ITEMS, type CupSize } from '../config'
import { friesCost, recipeCost } from './stock'
import type { OrderItems, PlayerState, Prices } from './types'

export const FRIES_KEY = 'fries'
export const recipeKey = (id: string): string => `recipe:${id}`
export const drinkKey = (size: CupSize): string => `drink:${size}`

export interface MenuItem {
  key: string
  name: string
  kind: 'burger' | 'fries' | 'drink'
  recipeId?: string
  size?: CupSize
  basePrice: number
  /** Custo de estoque para fazer uma unidade (R$). */
  cost: number
}

/** Todos os itens vendidos, na ordem do cardápio. */
export function menuItems(): MenuItem[] {
  return [
    ...RECIPES.map(
      (r): MenuItem => ({ key: recipeKey(r.id), name: r.name, kind: 'burger', recipeId: r.id, basePrice: r.basePrice, cost: recipeCost(r) }),
    ),
    { key: FRIES_KEY, name: 'Batata frita', kind: 'fries', basePrice: ECONOMY.friesBasePrice, cost: friesCost() },
    ...CUP_SIZES.map(
      (size): MenuItem => ({
        key: drinkKey(size),
        name: `Refri ${DRINKS.cups[size].name.toLowerCase()}`,
        kind: 'drink',
        size,
        basePrice: DRINKS.cups[size].basePrice,
        cost: DRINKS.cups[size].sodaUnits * STOCK_ITEMS.soda.unitCost,
      }),
    ),
  ]
}

export function basePrice(key: string): number {
  if (key === FRIES_KEY) return ECONOMY.friesBasePrice
  if (key.startsWith('recipe:')) return RECIPES.find((r) => r.id === key.slice(7))?.basePrice ?? 0
  if (key.startsWith('drink:')) return DRINKS.cups[key.slice(6) as CupSize]?.basePrice ?? 0
  return 0
}

export function defaultPrices(): Prices {
  return Object.fromEntries(menuItems().map((i) => [i.key, i.basePrice]))
}

export function priceLimits(key: string): { min: number; max: number } {
  const base = basePrice(key)
  return { min: Math.max(1, Math.round(base * PRICING.minFactor)), max: Math.round(base * PRICING.maxFactor) }
}

export function clampPrice(key: string, value: number): number {
  const { min, max } = priceLimits(key)
  return Math.min(max, Math.max(min, Math.round(value)))
}

export function setPrice(player: PlayerState, key: string, value: number): PlayerState {
  if (basePrice(key) <= 0) return player
  const price = clampPrice(key, value)
  return price === player.prices[key] ? player : { ...player, prices: { ...player.prices, [key]: price } }
}

export function itemPrice(prices: Prices, key: string): number {
  return prices[key] ?? basePrice(key)
}

export function orderPrice(order: OrderItems, prices: Prices): number {
  return (
    itemPrice(prices, recipeKey(order.recipeId)) +
    (order.fries ? itemPrice(prices, FRIES_KEY) : 0) +
    (order.drink ? itemPrice(prices, drinkKey(order.drink)) : 0)
  )
}

const baseOrderPrice = (order: OrderItems): number =>
  basePrice(recipeKey(order.recipeId)) + (order.fries ? basePrice(FRIES_KEY) : 0) + (order.drink ? basePrice(drinkKey(order.drink)) : 0)

/** Preço do pedido em relação ao padrão (1 = padrão). */
export function orderPriceRatio(order: OrderItems, prices: Prices): number {
  const base = baseOrderPrice(order)
  return base > 0 ? orderPrice(order, prices) / base : 1
}

/** Preço médio do cardápio em relação ao padrão. */
export function menuPriceRatio(prices: Prices): number {
  const items = menuItems()
  return items.reduce((sum, i) => sum + itemPrice(prices, i.key) / i.basePrice, 0) / items.length
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

/** Preço baixo atrai mais clientes; preço alto afasta. */
export const demandFactorFromPrices = (prices: Prices): number =>
  clamp(1 - (menuPriceRatio(prices) - 1) * PRICING.demandElasticity, PRICING.demandMin, PRICING.demandMax)

/** Preço alto deixa o cliente menos paciente. */
export const patienceFactorFromPrice = (ratio: number): number =>
  clamp(1 - (ratio - 1) * PRICING.patienceElasticity, PRICING.patienceMin, PRICING.patienceMax)

/** Preço alto reduz a gorjeta. */
export const tipFactorFromPrice = (ratio: number): number =>
  clamp(1 - (ratio - 1) * PRICING.tipElasticity, PRICING.tipMin, PRICING.tipMax)

export const FRIES_UNITS = FRIES_STOCK_UNITS
