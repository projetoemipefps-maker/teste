export const INGREDIENT_IDS = ['bunBottom', 'patty', 'cheese', 'lettuce', 'tomato', 'bunTop'] as const
export type IngredientId = (typeof INGREDIENT_IDS)[number]

export interface IngredientConfig {
  id: IngredientId
  name: string
  /** Custo do ingrediente, base do preço de venda do lanche (R$). */
  cost: number
}

export const INGREDIENTS: Record<IngredientId, IngredientConfig> = {
  bunBottom: { id: 'bunBottom', name: 'Pão de baixo', cost: 2 },
  patty: { id: 'patty', name: 'Hambúrguer', cost: 5 },
  cheese: { id: 'cheese', name: 'Queijo', cost: 2 },
  lettuce: { id: 'lettuce', name: 'Alface', cost: 1 },
  tomato: { id: 'tomato', name: 'Tomate', cost: 1 },
  bunTop: { id: 'bunTop', name: 'Pão de cima', cost: 2 },
}

/** Ordem das bandejas na bancada (da esquerda para a direita, de cima para baixo). */
export const TRAY_ORDER: readonly IngredientId[] = INGREDIENT_IDS

/** Primeiro ingrediente de qualquer lanche. */
export const BASE_INGREDIENT: IngredientId = 'bunBottom'
/** Ingrediente que fecha o lanche; nada pode ser colocado depois dele. */
export const CLOSING_INGREDIENT: IngredientId = 'bunTop'
/** Altura máxima da pilha (inclui os dois pães). */
export const MAX_BURGER_HEIGHT = 9
