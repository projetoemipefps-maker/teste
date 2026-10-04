import {
  COOKABLES,
  DESSERTS,
  DRINKS,
  DRINK_CONFIG,
  INGREDIENTS,
  MAX_STOCK,
  STOCK_IDS,
  STOCK_ITEMS,
  UNLOCK_GIFT_UNITS,
  type CookableId,
  type CupSize,
  type DessertId,
  type DrinkKind,
  type Recipe,
  type StockId,
} from '../config'
import { isStockUnlocked } from './unlocks'
import { computePerks } from './upgrades'
import type { PlayerState, Stock, StockAges } from './types'

/** Estoque de quem começa no `level`: o inicial dos itens do nível 1 e um presente dos demais já liberados. */
export function startingStock(level = 1): Stock {
  return Object.fromEntries(
    STOCK_IDS.map((id) => {
      const item = STOCK_ITEMS[id]
      if (!isStockUnlocked(id, level)) return [id, 0]
      return [id, item.startingStock > 0 ? item.startingStock : item.unlockLevel > 1 ? UNLOCK_GIFT_UNITS : 0]
    }),
  ) as Stock
}

export function filledStock(amount: number): Stock {
  return Object.fromEntries(STOCK_IDS.map((id) => [id, amount])) as Stock
}

export type StockUse = Partial<Record<StockId, number>>

export const hasStock = (stock: Stock, id: StockId, qty = 1): boolean => stock[id] >= qty
export const hasStockFor = (stock: Stock, use: StockUse): boolean =>
  (Object.entries(use) as [StockId, number][]).every(([id, qty]) => stock[id] >= qty)

/** Gasta `qty` do item (devolve um estoque novo). */
export const useStock = (stock: Stock, id: StockId, qty = 1): Stock => ({ ...stock, [id]: Math.max(0, stock[id] - qty) })
export const useStockFor = (stock: Stock, use: StockUse): Stock => {
  const next = { ...stock }
  for (const [id, qty] of Object.entries(use) as [StockId, number][]) next[id] = Math.max(0, next[id] - qty)
  return next
}
export const refundStock = (stock: Stock, id: StockId, qty = 1): Stock => ({ ...stock, [id]: stock[id] + qty })

const unitCost = (use: StockUse): number =>
  (Object.entries(use) as [StockId, number][]).reduce((sum, [id, qty]) => sum + qty * STOCK_ITEMS[id].unitCost, 0)

/** Quanto custa de estoque fazer uma receita (R$). */
export function recipeCost(recipe: Recipe): number {
  return recipe.ingredients.reduce((sum, ing) => {
    const id = INGREDIENTS[ing].stock
    return sum + (id ? STOCK_ITEMS[id].unitCost : 0)
  }, 0)
}
export const cookableCost = (id: CookableId): number => unitCost(COOKABLES[id].stock)
export const dessertCost = (id: DessertId): number => unitCost(DESSERTS[id].stock) || (id === 'brownie' ? cookableCost('brownie') : 0)
export const drinkCost = (kind: DrinkKind, size: CupSize): number =>
  DRINKS.cups[size].units * STOCK_ITEMS[DRINK_CONFIG[kind].stock].unitCost

export type Cart = Partial<Record<StockId, number>>

export function cartCost(cart: Cart): number {
  return STOCK_IDS.reduce((sum, id) => sum + (cart[id] ?? 0) * STOCK_ITEMS[id].unitCost, 0)
}

/** Quanto cabe no estoque de cada item (a geladeira melhorada aumenta). */
export const stockCapOf = (player: Pick<PlayerState, 'upgrades' | 'decor' | 'venue'>): number => computePerks(player).stockCap

/** Quanto ainda cabe no estoque do item. */
export const roomFor = (stock: Stock, id: StockId, cap: number = MAX_STOCK): number => Math.max(0, cap - stock[id])

/** Ajusta o carrinho: sem negativos, sem passar da capacidade do estoque. */
export function clampCart(stock: Stock, cart: Cart, cap: number = MAX_STOCK): Cart {
  const out: Cart = {}
  for (const id of STOCK_IDS) {
    const qty = Math.min(Math.max(0, Math.floor(cart[id] ?? 0)), roomFor(stock, id, cap))
    if (qty > 0) out[id] = qty
  }
  return out
}

/**
 * Compra o carrinho: desconta do caixa e soma ao estoque. Sem dinheiro suficiente, não compra nada.
 * Itens frescos novos "rejuvenescem" a idade média do estoque.
 */
export function purchaseStock(player: PlayerState, rawCart: Cart): PlayerState {
  const cart = clampCart(player.stock, rawCart, stockCapOf(player))
  const cost = cartCost(cart)
  if (cost <= 0 || cost > player.money) return player
  const stock = { ...player.stock }
  const stockAge: StockAges = { ...player.stockAge }
  for (const id of STOCK_IDS) {
    const qty = cart[id] ?? 0
    if (qty === 0) continue
    const total = stock[id] + qty
    if (STOCK_ITEMS[id].spoilDays !== undefined) {
      stockAge[id] = ((stockAge[id] ?? 0) * stock[id]) / total
    }
    stock[id] = total
  }
  return { ...player, money: player.money - cost, todayPurchases: player.todayPurchases + cost, stock, stockAge }
}

/** Presente de estoque ao liberar itens novos (de `from` exclusive até `to` inclusive). */
export function unlockGifts(stock: Stock, from: number, to: number): Stock {
  const next = { ...stock }
  for (const id of STOCK_IDS) {
    const { unlockLevel } = STOCK_ITEMS[id]
    if (unlockLevel > from && unlockLevel <= to) next[id] += UNLOCK_GIFT_UNITS
  }
  return next
}

export interface SpoilReport {
  id: StockId
  qty: number
}

/** Passa um dia: o estoque fresco envelhece e, ao chegar no limite, estraga todo. */
export function ageStock(
  stock: Stock,
  ages: StockAges,
  spoilBonus = 0,
): { stock: Stock; stockAge: StockAges; spoiled: SpoilReport[] } {
  const nextStock = { ...stock }
  const nextAges: StockAges = { ...ages }
  const spoiled: SpoilReport[] = []
  for (const id of STOCK_IDS) {
    const base = STOCK_ITEMS[id].spoilDays
    if (base === undefined) continue
    const limit = base + spoilBonus
    if (nextStock[id] <= 0) {
      nextAges[id] = 0
      continue
    }
    const age = (nextAges[id] ?? 0) + 1
    if (age >= limit) {
      spoiled.push({ id, qty: nextStock[id] })
      nextStock[id] = 0
      nextAges[id] = 0
    } else {
      nextAges[id] = age
    }
  }
  return { stock: nextStock, stockAge: nextAges, spoiled }
}

/** Dias até estragar (0 = estraga no fim de hoje); `null` se não estraga ou não há estoque. */
export function daysUntilSpoil(id: StockId, stock: Stock, ages: StockAges, spoilBonus = 0): number | null {
  const base = STOCK_ITEMS[id].spoilDays
  if (base === undefined || stock[id] <= 0) return null
  return Math.max(0, base + spoilBonus - Math.floor(ages[id] ?? 0) - 1)
}
