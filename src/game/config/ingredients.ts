export const INGREDIENT_IDS = ['bunBottom', 'patty', 'cheese', 'lettuce', 'tomato', 'bunTop'] as const
export type IngredientId = (typeof INGREDIENT_IDS)[number]

export interface IngredientConfig {
  id: IngredientId
  name: string
}

export const INGREDIENTS: Record<IngredientId, IngredientConfig> = {
  bunBottom: { id: 'bunBottom', name: 'Pão de baixo' },
  patty: { id: 'patty', name: 'Hambúrguer' },
  cheese: { id: 'cheese', name: 'Queijo' },
  lettuce: { id: 'lettuce', name: 'Alface' },
  tomato: { id: 'tomato', name: 'Tomate' },
  bunTop: { id: 'bunTop', name: 'Pão de cima' },
}

/** Ordem das bandejas na bancada (da esquerda para a direita, de cima para baixo). */
export const TRAY_ORDER: readonly IngredientId[] = INGREDIENT_IDS

/** Primeiro ingrediente de qualquer lanche. */
export const BASE_INGREDIENT: IngredientId = 'bunBottom'
/** Ingrediente que fecha o lanche; nada pode ser colocado depois dele. */
export const CLOSING_INGREDIENT: IngredientId = 'bunTop'
/** Altura máxima da pilha (inclui os dois pães). */
export const MAX_BURGER_HEIGHT = 9
