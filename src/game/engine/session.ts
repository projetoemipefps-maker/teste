import { CUSTOMERS, INGREDIENTS, TRAY, type IngredientId } from '../config'
import { addIngredient, canAddIngredient, closingFor, isClosed } from './burger'
import { hasStock, startingStock, useStock } from './stock'
import { isIngredientUnlocked, ovenSlotCount } from './unlocks'
import { basePerks, type Perks } from './upgrades'
import type { ActionResult, SessionState, Stock, TrayCategory } from './types'

export interface SessionOptions {
  /** Estoque com que o dia começa (padrão: o estoque inicial do nível). */
  stock?: Stock
  /** Movimento do dia (padrão: 1). */
  dayMultiplier?: number
  /** Nível do jogador (padrão: 1). */
  level?: number
  /** Efeitos das melhorias, da decoração e da fase (padrão: nada comprado). */
  perks?: Perks
}

export function createSession(seed: number, options: SessionOptions = {}): SessionState {
  const level = options.level ?? 1
  const perks = options.perks ?? basePerks()
  return {
    level,
    perks,
    stock: options.stock ?? startingStock(level),
    dayMultiplier: options.dayMultiplier ?? 1,
    slots: Array.from({ length: perks.seats }, () => null),
    burger: [],
    burgerPatties: [],
    spareBurger: null,
    tray: { burgers: [], sides: [], drinks: [], desserts: [] },
    grill: Array.from({ length: perks.grillSlots }, () => null),
    held: [],
    fryer: Array.from({ length: perks.fryerBaskets }, () => null),
    warmer: [],
    oven: Array.from({ length: ovenSlotCount(level) }, () => null),
    shelf: [],
    cup: null,
    pouring: false,
    selectedSlot: null,
    elapsed: 0,
    spawnTimer: CUSTOMERS.firstSpawnDelay,
    nextCustomerId: 1,
    rngState: seed >>> 0,
    ended: false,
    stats: { served: 0, lost: 0, revenue: 0, tips: 0, starsTotal: 0, xpGained: 0, soldByRecipe: {}, influencerHappy: 0 },
  }
}

/** Clicar no cliente seleciona o pedido; clicar de novo desmarca. Só clientes esperando podem ser selecionados. */
export function selectSlot(session: SessionState, slot: number): SessionState {
  const customer = session.slots[slot]
  if (!customer || customer.status !== 'waiting') return session
  return { ...session, selectedSlot: session.selectedSlot === slot ? null : slot }
}

/** O pão de cima só fecha o lanche se a bandeja tiver lugar; os demais precisam de estoque e de nível. */
export function canAddToBurger(session: SessionState, ingredient: IngredientId): boolean {
  const cfg = INGREDIENTS[ingredient]
  if (session.ended || cfg.role === 'protein' || !isIngredientUnlocked(ingredient, session.level)) return false
  if (cfg.role === 'closing' && session.tray.burgers.length >= TRAY.burgers) return false
  if (cfg.stock && !hasStock(session.stock, cfg.stock)) return false
  return canAddIngredient(session.burger, ingredient)
}

/** O botão do pão de cima usa o pão que combina com o de baixo. */
export const closingIngredient = (session: SessionState): IngredientId | null => closingFor(session.burger)

/** Adiciona um ingrediente da bancada. As proteínas entram por `addPattyToBurger`. */
export function addToBurger(session: SessionState, ingredient: IngredientId): ActionResult {
  if (!canAddToBurger(session, ingredient)) return { session, events: [] }
  const { stock } = INGREDIENTS[ingredient]
  return {
    session: {
      ...session,
      stock: stock ? useStock(session.stock, stock) : session.stock,
      burger: [...addIngredient(session.burger, ingredient)],
    },
    events: [{ type: 'ingredientAdded', ingredient }],
  }
}

/** Põe no lanche uma das proteínas prontas do prato (`heldIndex`). */
export function addPattyToBurger(session: SessionState, heldIndex: number): ActionResult {
  const held = session.held[heldIndex]
  if (session.ended || !held || !canAddIngredient(session.burger, held.id)) return { session, events: [] }
  return {
    session: {
      ...session,
      burger: [...addIngredient(session.burger, held.id)],
      burgerPatties: [...session.burgerPatties, held.quality],
      held: session.held.filter((_, i) => i !== heldIndex),
    },
    events: [{ type: 'ingredientAdded', ingredient: held.id }],
  }
}

/** Passa o lanche fechado para a bandeja: o do prato da frente ou, se ele não estiver fechado, o do segundo prato. */
export function sendBurgerToTray(session: SessionState): ActionResult {
  if (session.ended || session.tray.burgers.length >= TRAY.burgers) return { session, events: [] }
  const placed = { events: [{ type: 'trayPlaced', category: 'burgers' }] as ActionResult['events'] }
  if (isClosed(session.burger)) {
    return {
      session: {
        ...session,
        burger: [],
        burgerPatties: [],
        tray: { ...session.tray, burgers: [...session.tray.burgers, { ingredients: session.burger, patties: session.burgerPatties }] },
      },
      ...placed,
    }
  }
  const spare = session.spareBurger
  if (spare && isClosed(spare.ingredients)) {
    return {
      session: {
        ...session,
        spareBurger: null,
        tray: { ...session.tray, burgers: [...session.tray.burgers, { ingredients: spare.ingredients, patties: spare.patties }] },
      },
      ...placed,
    }
  }
  return { session, events: [] }
}

/** Joga fora o lanche que está sendo montado (as proteínas usadas se perdem). */
export function discardBurger(session: SessionState): ActionResult {
  if (session.burger.length === 0) return { session, events: [] }
  return { session: { ...session, burger: [], burgerPatties: [] }, events: [{ type: 'burgerDiscarded' }] }
}

/** Com o segundo prato, troca o lanche da frente pelo guardado (o prato vazio também vale: serve para guardar o lanche). */
export function swapBench(session: SessionState): ActionResult {
  if (session.ended || session.perks.benches < 2) return { session, events: [] }
  const spare = session.spareBurger
  if (session.burger.length === 0 && !spare) return { session, events: [] }
  return {
    session: {
      ...session,
      burger: spare ? spare.ingredients : [],
      burgerPatties: spare ? spare.patties : [],
      spareBurger: session.burger.length > 0 ? { ingredients: session.burger, patties: session.burgerPatties } : null,
    },
    events: [{ type: 'benchSwapped' }],
  }
}

/** Tira o último item colocado de uma categoria da bandeja. */
export function discardTrayItem(session: SessionState, category: TrayCategory): ActionResult {
  const items = session.tray[category]
  if (session.ended || items.length === 0) return { session, events: [] }
  return {
    session: { ...session, tray: { ...session.tray, [category]: items.slice(0, -1) } },
    events: [{ type: 'trayDiscarded', category }],
  }
}

export function trayIsEmpty(session: SessionState): boolean {
  const { burgers, sides, drinks, desserts } = session.tray
  return burgers.length + sides.length + drinks.length + desserts.length === 0
}
