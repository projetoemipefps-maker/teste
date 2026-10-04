import type { IngredientId } from './ingredients'

export interface Recipe {
  id: string
  name: string
  /** Do pão de baixo ao pão de cima. */
  ingredients: readonly IngredientId[]
  /** Nível em que a receita é liberada (passa a aparecer nos pedidos). */
  unlockLevel: number
  /** Preço de venda padrão (R$); o jogador pode ajustar dentro dos limites de `PRICING`. */
  basePrice: number
  /** Receita simples: é a que as crianças pedem. */
  simple?: boolean
  /** Lanche assinatura da casa. */
  signature?: boolean
}

export const RECIPES: readonly Recipe[] = [
  { id: 'simples', name: 'Simples', ingredients: ['bunBottom', 'patty', 'bunTop'], unlockLevel: 1, basePrice: 14, simple: true },
  { id: 'x-burger', name: 'X-Burger', ingredients: ['bunBottom', 'patty', 'cheese', 'bunTop'], unlockLevel: 1, basePrice: 17, simple: true },
  { id: 'classico', name: 'Clássico', ingredients: ['bunBottom', 'patty', 'lettuce', 'tomato', 'bunTop'], unlockLevel: 1, basePrice: 18 },
  { id: 'x-salada', name: 'X-Salada', ingredients: ['bunBottom', 'patty', 'cheese', 'lettuce', 'tomato', 'bunTop'], unlockLevel: 1, basePrice: 21 },
  { id: 'x-bacon', name: 'X-Bacon', ingredients: ['bunBottom', 'patty', 'cheese', 'bacon', 'bunTop'], unlockLevel: 4, basePrice: 23 },
  { id: 'picles', name: 'Burger Picles', ingredients: ['bunBottom', 'patty', 'cheddar', 'onion', 'pickles', 'bunTop'], unlockLevel: 6, basePrice: 22 },
  { id: 'brioche', name: 'Brioche Clássico', ingredients: ['briocheBottom', 'patty', 'cheese', 'lettuce', 'tomato', 'briocheTop'], unlockLevel: 9, basePrice: 26 },
  { id: 'duplo', name: 'Smash Duplo', ingredients: ['bunBottom', 'patty', 'cheddar', 'patty', 'onion', 'bunTop'], unlockLevel: 13, basePrice: 30 },
  { id: 'cheddar-melt', name: 'Cheddar Melt', ingredients: ['briocheBottom', 'patty', 'cheddar', 'creamyCheddar', 'caramelizedOnion', 'briocheTop'], unlockLevel: 14, basePrice: 29 },
  { id: 'barbecue-bacon', name: 'Barbecue Bacon', ingredients: ['bunBottom', 'patty', 'cheddar', 'bacon', 'onion', 'barbecue', 'bunTop'], unlockLevel: 16, basePrice: 31 },
  { id: 'x-egg', name: 'X-Egg', ingredients: ['bunBottom', 'patty', 'cheese', 'egg', 'lettuce', 'tomato', 'bunTop'], unlockLevel: 18, basePrice: 28 },
  { id: 'frango', name: 'Frango Crocante', ingredients: ['briocheBottom', 'chicken', 'lettuce', 'greenMayo', 'tomato', 'briocheTop'], unlockLevel: 20, basePrice: 27 },
  { id: 'australiano', name: 'Australiano', ingredients: ['australianBottom', 'patty', 'cheddar', 'bacon', 'egg', 'caramelizedOnion', 'australianTop'], unlockLevel: 24, basePrice: 36 },
  { id: 'vegetariano', name: 'Vegetariano', ingredients: ['bunBottom', 'veggie', 'lettuce', 'tomato', 'greenMayo', 'pickles', 'bunTop'], unlockLevel: 28, basePrice: 25 },
  {
    id: 'supreme',
    name: 'Brasa Supreme',
    ingredients: ['australianBottom', 'patty', 'cheddar', 'creamyCheddar', 'patty', 'bacon', 'caramelizedOnion', 'egg', 'barbecue', 'australianTop'],
    unlockLevel: 32,
    basePrice: 48,
    signature: true,
  },
]
