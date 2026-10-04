import type { StockId } from './stock'

export const INGREDIENT_IDS = [
  'bunBottom', 'bunTop', 'briocheBottom', 'briocheTop', 'australianBottom', 'australianTop',
  'patty', 'chicken', 'veggie',
  'cheese', 'cheddar', 'creamyCheddar',
  'lettuce', 'tomato', 'onion', 'pickles', 'caramelizedOnion',
  'bacon', 'egg',
  'greenMayo', 'barbecue',
] as const
export type IngredientId = (typeof INGREDIENT_IDS)[number]

export type IngredientCategory = 'bun' | 'protein' | 'cheese' | 'veggie' | 'sauce' | 'extra'
/** base = abre o lanche; closing = fecha; protein = vem da chapa; topping = vem direto da bancada. */
export type IngredientRole = 'base' | 'closing' | 'protein' | 'topping'

export interface IngredientConfig {
  id: IngredientId
  name: string
  category: IngredientCategory
  role: IngredientRole
  unlockLevel: number
  /** Item do estoque gasto quando o ingrediente entra no lanche (o pão de cima não gasta: o pão é um só). */
  stock: StockId | null
}

const ing = (
  id: IngredientId,
  name: string,
  category: IngredientCategory,
  role: IngredientRole,
  unlockLevel: number,
  stock: StockId | null,
): IngredientConfig => ({ id, name, category, role, unlockLevel, stock })

export const INGREDIENTS: Record<IngredientId, IngredientConfig> = {
  bunBottom: ing('bunBottom', 'Pão', 'bun', 'base', 1, 'bun'),
  bunTop: ing('bunTop', 'Pão de cima', 'bun', 'closing', 1, null),
  briocheBottom: ing('briocheBottom', 'Pão brioche', 'bun', 'base', 9, 'brioche'),
  briocheTop: ing('briocheTop', 'Brioche de cima', 'bun', 'closing', 9, null),
  australianBottom: ing('australianBottom', 'Pão australiano', 'bun', 'base', 23, 'australian'),
  australianTop: ing('australianTop', 'Australiano de cima', 'bun', 'closing', 23, null),
  patty: ing('patty', 'Hambúrguer', 'protein', 'protein', 1, 'patty'),
  chicken: ing('chicken', 'Frango empanado', 'protein', 'protein', 20, 'chicken'),
  veggie: ing('veggie', 'Hambúrguer vegetal', 'protein', 'protein', 28, 'veggie'),
  cheese: ing('cheese', 'Queijo', 'cheese', 'topping', 1, 'cheese'),
  cheddar: ing('cheddar', 'Cheddar', 'cheese', 'topping', 2, 'cheddar'),
  creamyCheddar: ing('creamyCheddar', 'Cheddar cremoso', 'cheese', 'topping', 14, 'creamyCheddar'),
  lettuce: ing('lettuce', 'Alface', 'veggie', 'topping', 1, 'lettuce'),
  tomato: ing('tomato', 'Tomate', 'veggie', 'topping', 1, 'tomato'),
  onion: ing('onion', 'Cebola', 'veggie', 'topping', 3, 'onion'),
  pickles: ing('pickles', 'Picles', 'veggie', 'topping', 6, 'pickles'),
  caramelizedOnion: ing('caramelizedOnion', 'Cebola caramelizada', 'veggie', 'topping', 10, 'caramelizedOnion'),
  bacon: ing('bacon', 'Bacon', 'extra', 'topping', 4, 'bacon'),
  egg: ing('egg', 'Ovo', 'extra', 'topping', 18, 'egg'),
  greenMayo: ing('greenMayo', 'Maionese verde', 'sauce', 'topping', 8, 'greenMayo'),
  barbecue: ing('barbecue', 'Barbecue', 'sauce', 'topping', 16, 'barbecue'),
}

/** Cada pão de baixo fecha com o seu pão de cima. */
export const BUN_PAIRS: Record<'bunBottom' | 'briocheBottom' | 'australianBottom', IngredientId> = {
  bunBottom: 'bunTop',
  briocheBottom: 'briocheTop',
  australianBottom: 'australianTop',
}

/** As proteínas que passam pela chapa. */
export const PROTEIN_IDS = ['patty', 'chicken', 'veggie'] as const
export type ProteinId = (typeof PROTEIN_IDS)[number]

/** Abas de ingredientes da bancada de montagem (a proteína vem da chapa). */
export const TRAY_CATEGORIES: readonly { id: Exclude<IngredientCategory, 'protein'>; name: string }[] = [
  { id: 'bun', name: 'Pães' },
  { id: 'cheese', name: 'Queijos' },
  { id: 'veggie', name: 'Vegetais' },
  { id: 'sauce', name: 'Molhos' },
  { id: 'extra', name: 'Extras' },
]

/** Altura máxima da pilha (inclui os dois pães). */
export const MAX_BURGER_HEIGHT = 10
