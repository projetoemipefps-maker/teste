import { CUSTOMERS, RECIPES, type Recipe } from '../config'
import { nextRandom, randomInt } from './rng'
import type { Customer } from './types'

export function getRecipe(id: string): Recipe {
  const recipe = RECIPES.find((r) => r.id === id)
  if (!recipe) throw new Error(`Receita desconhecida: ${id}`)
  return recipe
}

export function patienceFor(recipe: Recipe): number {
  return CUSTOMERS.patienceBase + CUSTOMERS.patiencePerIngredient * recipe.ingredients.length
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

/** Sorteia receita e aparência de um novo cliente. Devolve o cliente (sem id/slot finais) e o novo estado do RNG. */
export function rollCustomer(
  rngState: number,
  level: number,
  id: number,
  slot: number,
  usedVariants: readonly number[] = [],
): [Customer, number] {
  const pool = unlockedRecipes(level)
  const [pick, s1] = nextRandom(rngState)
  const recipe = pool[Math.floor(pick * pool.length)] ?? pool[0]!
  // Evita repetir a aparência de quem já está no balcão (enquanto houver aparências livres).
  const all = Array.from({ length: CUSTOMERS.variantCount }, (_, i) => i)
  const free = all.filter((v) => !usedVariants.includes(v))
  const options = free.length > 0 ? free : all
  const [idx, s2] = randomInt(s1, 0, options.length - 1)
  const variant = options[idx]!
  const patienceMax = patienceFor(recipe)
  return [
    {
      id,
      slot,
      recipeId: recipe.id,
      variant,
      patienceMax,
      patience: patienceMax,
      status: 'waiting',
      mood: 'neutral',
      leaveTimer: 0,
    },
    s2,
  ]
}
