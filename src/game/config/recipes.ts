import type { IngredientId } from './ingredients'

export interface Recipe {
  id: string
  name: string
  /** Do pão de baixo ao pão de cima. */
  ingredients: readonly IngredientId[]
  /** Nível mínimo para a receita aparecer nos pedidos. */
  unlockLevel: number
  /** Preço de venda padrão (R$); o jogador pode ajustar dentro dos limites de `PRICING`. */
  basePrice: number
}

export const RECIPES: readonly Recipe[] = [
  { id: 'simples', name: 'Simples', ingredients: ['bunBottom', 'patty', 'bunTop'], unlockLevel: 1, basePrice: 14 },
  { id: 'x-burger', name: 'X-Burger', ingredients: ['bunBottom', 'patty', 'cheese', 'bunTop'], unlockLevel: 1, basePrice: 17 },
  {
    id: 'classico',
    name: 'Clássico',
    ingredients: ['bunBottom', 'patty', 'lettuce', 'tomato', 'bunTop'],
    unlockLevel: 1, basePrice: 18,
  },
  {
    id: 'x-salada',
    name: 'X-Salada',
    ingredients: ['bunBottom', 'patty', 'cheese', 'lettuce', 'tomato', 'bunTop'],
    unlockLevel: 1, basePrice: 21,
  },
  {
    id: 'duplo',
    name: 'Duplo',
    ingredients: ['bunBottom', 'patty', 'cheese', 'patty', 'bunTop'],
    unlockLevel: 1, basePrice: 26,
  },
]
