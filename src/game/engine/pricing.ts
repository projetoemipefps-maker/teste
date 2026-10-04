import {
  COOKABLES,
  CUP_SIZES,
  DESSERTS,
  DESSERT_IDS,
  DRINK_CONFIG,
  DRINK_KINDS,
  DRINKS,
  PRICING,
  RECIPES,
  SIDE_IDS,
  type CupSize,
  type DessertId,
  type DrinkKind,
  type SideId,
} from '../config'
import { cookableCost, dessertCost, drinkCost, recipeCost } from './stock'
import type { DrinkOrder, OrderItems, PlayerState, Prices } from './types'

export const recipeKey = (id: string): string => `recipe:${id}`
export const sideKey = (id: SideId): string => `side:${id}`
export const drinkKey = (kind: DrinkKind, size: CupSize): string => `drink:${kind}:${size}`
export const dessertKey = (id: DessertId): string => `dessert:${id}`

export interface MenuItem {
  key: string
  name: string
  kind: 'burger' | 'side' | 'drink' | 'dessert'
  recipeId?: string
  sideId?: SideId
  drink?: DrinkOrder
  dessertId?: DessertId
  basePrice: number
  /** Custo de estoque para fazer uma unidade (R$). */
  cost: number
  /** Nível em que o item é liberado. */
  unlockLevel: number
}

/** Todos os itens vendidos, na ordem do cardápio. */
export function menuItems(): MenuItem[] {
  const items: MenuItem[] = RECIPES.map((r) => ({
    key: recipeKey(r.id),
    name: r.name,
    kind: 'burger',
    recipeId: r.id,
    basePrice: r.basePrice,
    cost: recipeCost(r),
    unlockLevel: r.unlockLevel,
  }))
  for (const id of SIDE_IDS) {
    const c = COOKABLES[id]
    items.push({ key: sideKey(id), name: c.name, kind: 'side', sideId: id, basePrice: c.basePrice, cost: cookableCost(id), unlockLevel: c.unlockLevel })
  }
  for (const kind of DRINK_KINDS) {
    for (const size of CUP_SIZES) {
      const cfg = DRINK_CONFIG[kind]
      items.push({
        key: drinkKey(kind, size),
        name: `${cfg.name} (${DRINKS.cups[size].name.toLowerCase()})`,
        kind: 'drink',
        drink: { kind, size },
        basePrice: cfg.basePrice[size],
        cost: drinkCost(kind, size),
        unlockLevel: cfg.unlockLevel,
      })
    }
  }
  for (const id of DESSERT_IDS) {
    const d = DESSERTS[id]
    items.push({ key: dessertKey(id), name: d.name, kind: 'dessert', dessertId: id, basePrice: d.basePrice, cost: dessertCost(id), unlockLevel: d.unlockLevel })
  }
  return items
}

const ITEMS = menuItems()
const BASE = new Map(ITEMS.map((i) => [i.key, i.basePrice]))

export const basePrice = (key: string): number => BASE.get(key) ?? 0

export function defaultPrices(): Prices {
  return Object.fromEntries(ITEMS.map((i) => [i.key, i.basePrice]))
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

const orderKeys = (order: OrderItems): string[] => [
  ...order.burgers.map(recipeKey),
  ...order.sides.map(sideKey),
  ...order.drinks.map((d) => drinkKey(d.kind, d.size)),
  ...order.desserts.map(dessertKey),
]

export const orderPrice = (order: OrderItems, prices: Prices): number =>
  orderKeys(order).reduce((sum, key) => sum + itemPrice(prices, key), 0)

/** Preço do pedido em relação ao padrão (1 = padrão). */
export function orderPriceRatio(order: OrderItems, prices: Prices): number {
  const base = orderKeys(order).reduce((sum, key) => sum + basePrice(key), 0)
  return base > 0 ? orderPrice(order, prices) / base : 1
}

/** Preço médio do cardápio liberado em relação ao padrão. */
export function menuPriceRatio(prices: Prices, level = Number.POSITIVE_INFINITY): number {
  const items = ITEMS.filter((i) => i.unlockLevel <= level)
  return items.reduce((sum, i) => sum + itemPrice(prices, i.key) / i.basePrice, 0) / items.length
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

/** Preço baixo atrai mais clientes; preço alto afasta. */
export const demandFactorFromPrices = (prices: Prices, level = Number.POSITIVE_INFINITY): number =>
  clamp(1 - (menuPriceRatio(prices, level) - 1) * PRICING.demandElasticity, PRICING.demandMin, PRICING.demandMax)

/** Preço alto deixa o cliente menos paciente. */
export const patienceFactorFromPrice = (ratio: number): number =>
  clamp(1 - (ratio - 1) * PRICING.patienceElasticity, PRICING.patienceMin, PRICING.patienceMax)

/** Preço alto reduz a gorjeta. */
export const tipFactorFromPrice = (ratio: number): number =>
  clamp(1 - (ratio - 1) * PRICING.tipElasticity, PRICING.tipMin, PRICING.tipMax)
