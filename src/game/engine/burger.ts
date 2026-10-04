import {
  BASE_INGREDIENT,
  CLOSING_INGREDIENT,
  MAX_BURGER_HEIGHT,
  type IngredientId,
  type Recipe,
} from '../config'

export function isClosed(stack: readonly IngredientId[]): boolean {
  return stack[stack.length - 1] === CLOSING_INGREDIENT
}

/** O pão de baixo abre o lanche, o pão de cima fecha, e o resto vai no meio. */
export function canAddIngredient(stack: readonly IngredientId[], id: IngredientId): boolean {
  if (stack.length === 0) return id === BASE_INGREDIENT
  if (isClosed(stack)) return false
  if (id === BASE_INGREDIENT) return false
  if (id === CLOSING_INGREDIENT) return true
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
