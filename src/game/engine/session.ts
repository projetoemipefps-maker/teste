import { CLOSING_INGREDIENT, CUSTOMERS, FRYER, GRILL, INGREDIENT_STOCK, type IngredientId } from '../config'
import { addIngredient, canAddIngredient, isClosed } from './burger'
import { hasStock, startingStock, useStock } from './stock'
import type { ActionResult, SessionState, Stock, TrayItem } from './types'

export interface SessionOptions {
  /** Estoque com que o dia começa (padrão: o estoque inicial do jogo). */
  stock?: Stock
  /** Movimento do dia (padrão: 1). */
  dayMultiplier?: number
}

export function createSession(seed: number, options: SessionOptions = {}): SessionState {
  return {
    stock: options.stock ?? startingStock(),
    dayMultiplier: options.dayMultiplier ?? 1,
    slots: Array.from({ length: CUSTOMERS.maxSlots }, () => null),
    burger: [],
    burgerPatties: [],
    tray: { burger: null, fries: null, drink: null },
    grill: Array.from({ length: GRILL.slots }, () => null),
    held: [],
    fryer: Array.from({ length: FRYER.baskets }, () => null),
    warmer: [],
    cup: null,
    pouring: false,
    selectedSlot: null,
    elapsed: 0,
    spawnTimer: CUSTOMERS.firstSpawnDelay,
    nextCustomerId: 1,
    rngState: seed >>> 0,
    ended: false,
    stats: { served: 0, lost: 0, revenue: 0, tips: 0, starsTotal: 0, xpGained: 0, soldByRecipe: {} },
  }
}

/** Clicar no cliente seleciona o pedido; clicar de novo desmarca. Só clientes esperando podem ser selecionados. */
export function selectSlot(session: SessionState, slot: number): SessionState {
  const customer = session.slots[slot]
  if (!customer || customer.status !== 'waiting') return session
  return { ...session, selectedSlot: session.selectedSlot === slot ? null : slot }
}

/** O pão de cima só fecha o lanche se a bandeja estiver livre; os demais precisam de estoque. */
export function canAddToBurger(session: SessionState, ingredient: IngredientId): boolean {
  if (session.ended || ingredient === 'patty') return false
  if (ingredient === CLOSING_INGREDIENT && session.tray.burger) return false
  const stockId = INGREDIENT_STOCK[ingredient]
  if (stockId && !hasStock(session.stock, stockId)) return false
  return canAddIngredient(session.burger, ingredient)
}

/** Adiciona um ingrediente que não precisa de cozimento. A carne entra por `addPattyToBurger`. */
export function addToBurger(session: SessionState, ingredient: IngredientId): ActionResult {
  if (!canAddToBurger(session, ingredient)) return { session, events: [] }
  const stockId = INGREDIENT_STOCK[ingredient]
  return {
    session: {
      ...session,
      stock: stockId ? useStock(session.stock, stockId) : session.stock,
      burger: [...addIngredient(session.burger, ingredient)],
    },
    events: [{ type: 'ingredientAdded', ingredient }],
  }
}

/** Põe no lanche uma das carnes prontas do prato (`heldIndex`). */
export function addPattyToBurger(session: SessionState, heldIndex: number): ActionResult {
  const quality = session.held[heldIndex]
  if (session.ended || !quality || !canAddIngredient(session.burger, 'patty')) return { session, events: [] }
  return {
    session: {
      ...session,
      burger: [...addIngredient(session.burger, 'patty')],
      burgerPatties: [...session.burgerPatties, quality],
      held: session.held.filter((_, i) => i !== heldIndex),
    },
    events: [{ type: 'ingredientAdded', ingredient: 'patty' }],
  }
}

/** Passa o lanche fechado do prato para a bandeja. */
export function sendBurgerToTray(session: SessionState): ActionResult {
  if (session.ended || !isClosed(session.burger) || session.tray.burger) return { session, events: [] }
  return {
    session: {
      ...session,
      burger: [],
      burgerPatties: [],
      tray: { ...session.tray, burger: { ingredients: session.burger, patties: session.burgerPatties } },
    },
    events: [{ type: 'trayPlaced', item: 'burger' }],
  }
}

/** Joga fora o lanche que está sendo montado (as carnes usadas se perdem). */
export function discardBurger(session: SessionState): ActionResult {
  if (session.burger.length === 0) return { session, events: [] }
  return { session: { ...session, burger: [], burgerPatties: [] }, events: [{ type: 'burgerDiscarded' }] }
}

export function discardTrayItem(session: SessionState, item: TrayItem): ActionResult {
  if (session.ended || !session.tray[item]) return { session, events: [] }
  return {
    session: { ...session, tray: { ...session.tray, [item]: null } },
    events: [{ type: 'trayDiscarded', item }],
  }
}

export function trayIsEmpty(session: SessionState): boolean {
  const { burger, fries, drink } = session.tray
  return !burger && !fries && !drink
}
