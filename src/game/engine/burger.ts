import { BUN_PAIRS, INGREDIENTS, MAX_BURGER_HEIGHT, type IngredientId, type Recipe } from '../config'

type BaseBun = keyof typeof BUN_PAIRS
const isBase = (id: IngredientId): id is BaseBun => id in BUN_PAIRS

/** O pão de cima que fecha esta pilha (depende do pão de baixo), ou null se ainda não há pão de baixo. */
export function closingFor(stack: readonly IngredientId[]): IngredientId | null {
  const first = stack[0]
  return first !== undefined && isBase(first) ? BUN_PAIRS[first] : null
}

export function isClosed(stack: readonly IngredientId[]): boolean {
  const closing = closingFor(stack)
  return closing !== null && stack.length > 1 && stack[stack.length - 1] === closing
}

/** O pão de baixo abre o lanche, o pão de cima (do mesmo tipo) fecha, e o resto vai no meio. */
export function canAddIngredient(stack: readonly IngredientId[], id: IngredientId): boolean {
  if (stack.length === 0) return isBase(id)
  if (isClosed(stack)) return false
  const { role } = INGREDIENTS[id]
  if (role === 'base') return false
  if (role === 'closing') return id === closingFor(stack)
  // Reserva o último espaço para o pão de cima.
  return stack.length < MAX_BURGER_HEIGHT - 1
}

/** Devolve a mesma pilha (mesma referência) se o ingrediente não puder ser adicionado. */
export function addIngredient(stack: readonly IngredientId[], id: IngredientId): readonly IngredientId[] {
  return canAddIngredient(stack, id) ? [...stack, id] : stack
}

export function matchesRecipe(stack: readonly IngredientId[], recipe: Recipe): boolean {
  return stack.length === recipe.ingredients.length && stack.every((ing, i) => ing === recipe.ingredients[i])
}
