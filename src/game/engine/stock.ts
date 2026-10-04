import {
  FRIES_STOCK_UNITS,
  INGREDIENT_STOCK,
  MAX_STOCK,
  STOCK_IDS,
  STOCK_ITEMS,
  type Recipe,
  type StockId,
} from '../config'
import type { PlayerState, Stock, StockAges } from './types'

export function startingStock(): Stock {
  return Object.fromEntries(STOCK_IDS.map((id) => [id, STOCK_ITEMS[id].startingStock])) as Stock
}

export function filledStock(amount: number): Stock {
  return Object.fromEntries(STOCK_IDS.map((id) => [id, amount])) as Stock
}

export const hasStock = (stock: Stock, id: StockId, qty = 1): boolean => stock[id] >= qty

/** Gasta `qty` do item (devolve um estoque novo). */
export const useStock = (stock: Stock, id: StockId, qty = 1): Stock => ({ ...stock, [id]: Math.max(0, stock[id] - qty) })
export const refundStock = (stock: Stock, id: StockId, qty = 1): Stock => ({ ...stock, [id]: stock[id] + qty })

/** Quanto custa de estoque fazer uma receita (R$). */
export function recipeCost(recipe: Recipe): number {
  return recipe.ingredients.reduce((sum, ing) => {
    const id = INGREDIENT_STOCK[ing]
    return sum + (id ? STOCK_ITEMS[id].unitCost : 0)
  }, 0)
}

export const friesCost = (): number => FRIES_STOCK_UNITS * STOCK_ITEMS.potato.unitCost

export type Cart = Partial<Record<StockId, number>>

export function cartCost(cart: Cart): number {
  return STOCK_IDS.reduce((sum, id) => sum + (cart[id] ?? 0) * STOCK_ITEMS[id].unitCost, 0)
}

/** Quanto ainda cabe no estoque do item. */
export const roomFor = (stock: Stock, id: StockId): number => Math.max(0, MAX_STOCK - stock[id])

/** Ajusta o carrinho: sem negativos, sem passar da capacidade do estoque. */
export function clampCart(stock: Stock, cart: Cart): Cart {
  const out: Cart = {}
  for (const id of STOCK_IDS) {
    const qty = Math.min(Math.max(0, Math.floor(cart[id] ?? 0)), roomFor(stock, id))
    if (qty > 0) out[id] = qty
  }
  return out
}

/**
 * Compra o carrinho: desconta do caixa e soma ao estoque. Sem dinheiro suficiente, não compra nada.
 * Itens frescos novos "rejuvenescem" a idade média do estoque.
 */
export function purchaseStock(player: PlayerState, rawCart: Cart): PlayerState {
  const cart = clampCart(player.stock, rawCart)
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

export interface SpoilReport {
  id: StockId
  qty: number
}

/** Passa um dia: o estoque fresco envelhece e, ao chegar no limite, estraga todo. */
export function ageStock(stock: Stock, ages: StockAges): { stock: Stock; stockAge: StockAges; spoiled: SpoilReport[] } {
  const nextStock = { ...stock }
  const nextAges: StockAges = { ...ages }
  const spoiled: SpoilReport[] = []
  for (const id of STOCK_IDS) {
    const limit = STOCK_ITEMS[id].spoilDays
    if (limit === undefined) continue
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
export function daysUntilSpoil(id: StockId, stock: Stock, ages: StockAges): number | null {
  const limit = STOCK_ITEMS[id].spoilDays
  if (limit === undefined || stock[id] <= 0) return null
  return Math.max(0, limit - Math.floor(ages[id] ?? 0) - 1)
}
