import {
  CUSTOMERS,
  CUSTOMER_RULES,
  CUSTOMER_TYPES,

  CUP_SIZES,
  ORDER_RULES,
  RECIPES,
  TRAY,
  type CustomerTypeConfig,
  type Recipe,
} from '../config'
import { orderPriceRatio, patienceFactorFromPrice } from './pricing'
import { patienceFactorForReputation } from './reputation'
import { nextRandom, randomInt, randomRange } from './rng'
import { lookSignature, rollLook, usedLookSignatures } from './looks'
import {
  unlockedCustomerTypes,
  unlockedDesserts,
  unlockedDrinkKinds,
  unlockedRecipes,
  unlockedSides,
} from './unlocks'
import type { Customer, Mood, OrderItems, Prices } from './types'

export { unlockedRecipes }

export function getRecipe(id: string): Recipe {
  const recipe = RECIPES.find((r) => r.id === id)
  if (!recipe) throw new Error(`Receita desconhecida: ${id}`)
  return recipe
}

/** Total de itens do pedido. */
export const orderSize = (o: OrderItems): number => o.burgers.length + o.sides.length + o.drinks.length + o.desserts.length

/** Paciência-base do pedido (antes dos fatores de tipo, reputação e preço). */
export function patienceFor(order: OrderItems): number {
  const burgerSteps = order.burgers.reduce((sum, id) => sum + getRecipe(id).ingredients.length, 0)
  return (
    CUSTOMERS.patienceBase +
    CUSTOMERS.patiencePerIngredient * burgerSteps +
    CUSTOMERS.patienceSideBonus * order.sides.length +
    CUSTOMERS.patienceDrinkBonus * order.drinks.length +
    CUSTOMERS.patienceDessertBonus * order.desserts.length
  )
}

export function patienceRatio(customer: Customer): number {
  return customer.patienceMax <= 0 ? 0 : Math.min(1, Math.max(0, customer.patience / customer.patienceMax))
}

/** Expressão mostrada: ao sair, a reação; esperando, neutro ou impaciente (paciência baixa). */
export function customerMood(customer: Customer): Mood {
  if (customer.status === 'leaving') return customer.mood
  return patienceRatio(customer) < CUSTOMERS.impatientRatio ? 'impatient' : 'neutral'
}

export function firstFreeSlot(slots: readonly (Customer | null)[]): number {
  return slots.findIndex((s) => s === null)
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
const chance = (rule: { base: number; perLevel: number; max: number }, level: number) =>
  clamp(rule.base + rule.perLevel * (level - 1), 0, rule.max)

/** Sorteia o tipo de cliente entre os já liberados (peso de cada um). */
export function rollCustomerType(rngState: number, level: number): [CustomerTypeConfig, number] {
  const types = unlockedCustomerTypes(level)
  const total = types.reduce((s, t) => s + t.weight, 0)
  const [v, next] = nextRandom(rngState)
  let roll = v * total
  for (const t of types) {
    if (roll < t.weight) return [t, next]
    roll -= t.weight
  }
  return [types[0]!, next]
}

/** Sorteia o pedido: o tamanho cresce com o nível, e o tipo de cliente ajusta (família pede vários lanches). */
export function rollOrder(rngState: number, level: number, type: CustomerTypeConfig = CUSTOMER_TYPES.normal): [OrderItems, number] {
  let s = rngState
  const rand = () => {
    const [v, next] = nextRandom(s)
    s = next
    return v
  }
  const int = (min: number, max: number) => {
    const [v, next] = randomInt(s, min, max)
    s = next
    return v
  }

  let pool = unlockedRecipes(level)
  if (type.simpleOnly) {
    const simple = pool.filter((r) => r.simple)
    if (simple.length > 0) pool = simple
  }
  const pickRecipe = () => pool[Math.floor(rand() * pool.length)] ?? pool[0]!

  let burgerCount = int(type.burgers.min, type.burgers.max)
  if (type.burgers.max === 1 && !type.simpleOnly && rand() < clamp((level - ORDER_RULES.extraBurger.startLevel) * ORDER_RULES.extraBurger.perLevel, 0, ORDER_RULES.extraBurger.max)) {
    burgerCount = 2
  }
  burgerCount = Math.min(burgerCount, TRAY.burgers)
  const burgers = Array.from({ length: burgerCount }, () => pickRecipe().id)

  const sidePool = unlockedSides(level)
  const drinkPool = unlockedDrinkKinds(level)
  const dessertPool = unlockedDesserts(level)
  const sides: OrderItems['sides'] = []
  const drinks: OrderItems['drinks'] = []
  const desserts: OrderItems['desserts'] = []
  for (let i = 0; i < burgerCount; i++) {
    if (rand() < chance(ORDER_RULES.sideChance, level) && sides.length < TRAY.sides) sides.push(sidePool[Math.floor(rand() * sidePool.length)]!)
    if (rand() < chance(ORDER_RULES.drinkChance, level) && drinks.length < TRAY.drinks) {
      drinks.push({ kind: drinkPool[Math.floor(rand() * drinkPool.length)]!, size: CUP_SIZES[int(0, CUP_SIZES.length - 1)]! })
    }
    if (dessertPool.length > 0 && rand() < chance(ORDER_RULES.dessertChance, level) && desserts.length < TRAY.desserts) {
      desserts.push(dessertPool[Math.floor(rand() * dessertPool.length)]!)
    }
  }
  return [{ burgers, sides, drinks, desserts }, s]
}

/**
 * Sorteia um novo cliente: tipo, pedido, aparência (diferente dos que já estão no balcão) e paciência
 * (que depende do tipo, da reputação e do preço do pedido).
 */
export function rollCustomer(
  rngState: number,
  level: number,
  id: number,
  slot: number,
  others: readonly Customer[],
  context: { prices: Prices; reputation: number; patienceBonus?: number },
): [Customer, number] {
  const [type, s1] = rollCustomerType(rngState, level)
  const [order, s2] = rollOrder(s1, level, type)
  const used = usedLookSignatures(others)
  const [look, s3] = rollLook(s2, type.id, used)
  let state = s3
  let companion: Customer['companion'] = null
  if (type.id === 'family') {
    ;[companion, state] = rollLook(state, 'kid', new Set([...used, lookSignature(look)]))
  }
  let mindChangeAt: number | null = null
  if (type.changesMind) {
    const { min, max } = CUSTOMER_RULES.changeMindRatio
    const [ratio, next] = randomRange(state, min, max)
    mindChangeAt = ratio
    state = next
  }
  const priceRatio = orderPriceRatio(order, context.prices)
  // Tipo, reputação alta e preço baixo deixam o cliente mais paciente.
  const patienceMax =
    patienceFor(order) *
    type.patienceFactor *
    patienceFactorForReputation(context.reputation) *
    patienceFactorFromPrice(priceRatio) *
    (1 + (context.patienceBonus ?? 0))
  return [
    {
      id,
      slot,
      type: type.id,
      order,
      priceRatio,
      look,
      companion,
      patienceMax,
      patience: patienceMax,
      status: 'waiting',
      mood: 'neutral',
      leaveTimer: 0,
      mindChangeAt,
      changedMind: false,
    },
    state,
  ]
}

/** O indeciso troca um dos lanches por outro (e ganha um pouco de paciência). */
export function changeMind(customer: Customer, level: number, rngState: number): [Customer, number] {
  const pool = unlockedRecipes(level)
  const [v1, s1] = nextRandom(rngState)
  const [v2, s2] = nextRandom(s1)
  const index = Math.min(customer.order.burgers.length - 1, Math.floor(v1 * customer.order.burgers.length))
  const current = customer.order.burgers[index]!
  const options = pool.filter((r) => r.id !== current)
  const replacement = (options[Math.floor(v2 * options.length)] ?? pool[0]!).id
  const order: OrderItems = { ...customer.order, burgers: customer.order.burgers.map((id, i) => (i === index ? replacement : id)) }
  const bonus = CUSTOMER_RULES.changeMindPatienceBonus
  return [
    { ...customer, order, changedMind: true, patience: customer.patience + bonus, patienceMax: customer.patienceMax + bonus },
    s2,
  ]
}
