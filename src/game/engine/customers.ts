import { COMBOS, CUP_SIZES, CUSTOMERS, RECIPES, type Recipe } from '../config'
import { nextRandom, randomInt } from './rng'
import type { Customer, OrderItems } from './types'

export function getRecipe(id: string): Recipe {
  const recipe = RECIPES.find((r) => r.id === id)
  if (!recipe) throw new Error(`Receita desconhecida: ${id}`)
  return recipe
}

export function patienceFor(order: OrderItems): number {
  const recipe = getRecipe(order.recipeId)
  return (
    CUSTOMERS.patienceBase +
    CUSTOMERS.patiencePerIngredient * recipe.ingredients.length +
    (order.fries ? CUSTOMERS.patienceFriesBonus : 0) +
    (order.drink ? CUSTOMERS.patienceDrinkBonus : 0)
  )
}

export function patienceRatio(customer: Customer): number {
  return customer.patienceMax <= 0 ? 0 : Math.min(1, Math.max(0, customer.patience / customer.patienceMax))
}

export function unlockedRecipes(level: number): Recipe[] {
  return RECIPES.filter((r) => r.unlockLevel <= level)
}

export function firstFreeSlot(slots: readonly (Customer | null)[]): number {
  return slots.findIndex((s) => s === null)
}

/** Sorteia o pedido (lanche + combo + tamanho do copo). */
export function rollOrder(rngState: number, level: number): [OrderItems, number] {
  const recipes = unlockedRecipes(level)
  const [pickRecipe, s1] = nextRandom(rngState)
  const recipe = recipes[Math.floor(pickRecipe * recipes.length)] ?? recipes[0]!

  const combos = COMBOS.filter((c) => c.unlockLevel <= level)
  const totalWeight = combos.reduce((sum, c) => sum + c.weight, 0)
  const [pickCombo, s2] = nextRandom(s1)
  let roll = pickCombo * totalWeight
  let combo = combos[0]!
  for (const c of combos) {
    if (roll < c.weight) {
      combo = c
      break
    }
    roll -= c.weight
  }

  const [sizeIdx, s3] = randomInt(s2, 0, CUP_SIZES.length - 1)
  return [{ recipeId: recipe.id, fries: combo.fries, drink: combo.drink ? CUP_SIZES[sizeIdx]! : null }, s3]
}

/** Sorteia um novo cliente: pedido e aparência (evitando as que já estão no balcão). */
export function rollCustomer(
  rngState: number,
  level: number,
  id: number,
  slot: number,
  usedVariants: readonly number[] = [],
): [Customer, number] {
  const [order, s1] = rollOrder(rngState, level)
  const all = Array.from({ length: CUSTOMERS.variantCount }, (_, i) => i)
  const free = all.filter((v) => !usedVariants.includes(v))
  const options = free.length > 0 ? free : all
  const [idx, s2] = randomInt(s1, 0, options.length - 1)
  const patienceMax = patienceFor(order)
  return [
    {
      id,
      slot,
      order,
      variant: options[idx]!,
      patienceMax,
      patience: patienceMax,
      status: 'waiting',
      mood: 'neutral',
      leaveTimer: 0,
    },
    s2,
  ]
}
