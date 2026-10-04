import type { IngredientId } from './ingredients'

export const STOCK_IDS = ['bun', 'patty', 'cheese', 'lettuce', 'tomato', 'potato', 'soda'] as const
export type StockId = (typeof STOCK_IDS)[number]

export interface StockItemConfig {
  id: StockId
  name: string
  /** Custo de compra por unidade (R$). */
  unitCost: number
  /** Dias parado até estragar (só ingredientes frescos). */
  spoilDays?: number
  /** Quantidade que o jogador já tem no primeiro dia. */
  startingStock: number
}

export const STOCK_ITEMS: Record<StockId, StockItemConfig> = {
  bun: { id: 'bun', name: 'Pão', unitCost: 3, startingStock: 12 },
  patty: { id: 'patty', name: 'Carne', unitCost: 4, startingStock: 12 },
  cheese: { id: 'cheese', name: 'Queijo', unitCost: 1, startingStock: 10 },
  lettuce: { id: 'lettuce', name: 'Alface', unitCost: 1, spoilDays: 3, startingStock: 8 },
  tomato: { id: 'tomato', name: 'Tomate', unitCost: 1, spoilDays: 3, startingStock: 8 },
  potato: { id: 'potato', name: 'Batata', unitCost: 2, startingStock: 10 },
  soda: { id: 'soda', name: 'Refrigerante', unitCost: 2, startingStock: 12 },
}

/** Pacotes de compra da tela de preparação. */
export const BUY_BUNDLES = [10, 50] as const
/** Quanto cabe no estoque de cada item. */
export const MAX_STOCK = 300

/**
 * Item do estoque gasto quando o ingrediente entra no lanche (a carne gasta ao ir para a chapa).
 * O pão de cima não gasta nada: o pão é um só (gasto ao abrir o lanche).
 */
export const INGREDIENT_STOCK: Record<IngredientId, StockId | null> = {
  bunBottom: 'bun',
  patty: 'patty',
  cheese: 'cheese',
  lettuce: 'lettuce',
  tomato: 'tomato',
  bunTop: null,
}

/** Unidades de batata gastas por porção. */
export const FRIES_STOCK_UNITS = 1
