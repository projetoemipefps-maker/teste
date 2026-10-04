export const STOCK_IDS = [
  'bun', 'brioche', 'australian',
  'patty', 'chicken', 'veggie',
  'cheese', 'cheddar', 'creamyCheddar',
  'lettuce', 'tomato', 'onion', 'pickles', 'caramelizedOnion',
  'bacon', 'egg', 'greenMayo', 'barbecue',
  'potato', 'rusticPotato', 'nuggets', 'onionRings',
  'soda', 'juice', 'shakeChocolate', 'shakeStrawberry', 'shakeVanilla',
  'brownie', 'iceCream',
] as const
export type StockId = (typeof STOCK_IDS)[number]

export type StockCategory = 'bun' | 'protein' | 'cheese' | 'veggie' | 'sauce' | 'extra' | 'side' | 'drink' | 'dessert'

/** Seções da tela de compra, na ordem em que aparecem. */
export const STOCK_CATEGORIES: readonly { id: StockCategory; name: string }[] = [
  { id: 'bun', name: 'Pães' },
  { id: 'protein', name: 'Carnes' },
  { id: 'cheese', name: 'Queijos' },
  { id: 'veggie', name: 'Vegetais' },
  { id: 'sauce', name: 'Molhos' },
  { id: 'extra', name: 'Extras' },
  { id: 'side', name: 'Acompanhamentos' },
  { id: 'drink', name: 'Bebidas' },
  { id: 'dessert', name: 'Sobremesas' },
]

export interface StockItemConfig {
  id: StockId
  name: string
  category: StockCategory
  /** Custo de compra por unidade (R$). */
  unitCost: number
  /** Dias parado até estragar (só ingredientes frescos). */
  spoilDays?: number
  /** Nível em que o item é liberado (e passa a aparecer na compra). */
  unlockLevel: number
  /** Quantidade que o jogador já tem no primeiro dia (só itens do nível 1). */
  startingStock: number
}

const item = (
  id: StockId,
  name: string,
  category: StockCategory,
  unitCost: number,
  unlockLevel: number,
  startingStock = 0,
  spoilDays?: number,
): StockItemConfig => ({ id, name, category, unitCost, unlockLevel, startingStock, ...(spoilDays !== undefined && { spoilDays }) })

export const STOCK_ITEMS: Record<StockId, StockItemConfig> = {
  bun: item('bun', 'Pão', 'bun', 3, 1, 12),
  brioche: item('brioche', 'Pão brioche', 'bun', 5, 9),
  australian: item('australian', 'Pão australiano', 'bun', 6, 23),
  patty: item('patty', 'Carne', 'protein', 4, 1, 12),
  chicken: item('chicken', 'Frango empanado', 'protein', 4, 20),
  veggie: item('veggie', 'Hambúrguer vegetal', 'protein', 4, 28),
  cheese: item('cheese', 'Queijo', 'cheese', 1, 1, 10),
  cheddar: item('cheddar', 'Cheddar', 'cheese', 2, 2),
  creamyCheddar: item('creamyCheddar', 'Cheddar cremoso', 'cheese', 2, 14),
  lettuce: item('lettuce', 'Alface', 'veggie', 1, 1, 8, 3),
  tomato: item('tomato', 'Tomate', 'veggie', 1, 1, 8, 3),
  onion: item('onion', 'Cebola', 'veggie', 1, 3, 0, 4),
  pickles: item('pickles', 'Picles', 'veggie', 1, 6),
  caramelizedOnion: item('caramelizedOnion', 'Cebola caramelizada', 'veggie', 2, 10),
  bacon: item('bacon', 'Bacon', 'extra', 2, 4),
  egg: item('egg', 'Ovo', 'extra', 1, 18, 0, 5),
  greenMayo: item('greenMayo', 'Maionese verde', 'sauce', 1, 8),
  barbecue: item('barbecue', 'Barbecue', 'sauce', 1, 16),
  potato: item('potato', 'Batata', 'side', 2, 1, 10),
  rusticPotato: item('rusticPotato', 'Batata rústica', 'side', 3, 7),
  nuggets: item('nuggets', 'Nuggets', 'side', 4, 11),
  onionRings: item('onionRings', 'Anéis de cebola', 'side', 3, 17),
  soda: item('soda', 'Refrigerante', 'drink', 2, 1, 12),
  juice: item('juice', 'Suco natural', 'drink', 2, 5, 0, 3),
  shakeChocolate: item('shakeChocolate', 'Milkshake de chocolate', 'drink', 3, 15),
  shakeStrawberry: item('shakeStrawberry', 'Milkshake de morango', 'drink', 3, 19),
  shakeVanilla: item('shakeVanilla', 'Milkshake de baunilha', 'drink', 3, 24),
  brownie: item('brownie', 'Brownie', 'dessert', 2, 12),
  iceCream: item('iceCream', 'Sorvete', 'dessert', 2, 21),
}

/** Pacotes de compra da tela de preparação. */
export const BUY_BUNDLES = [10, 50] as const
/** Quanto cabe no estoque de cada item. */
export const MAX_STOCK = 300
/** Unidades de presente ao liberar um item novo (para o jogador testar antes de comprar). */
export const UNLOCK_GIFT_UNITS = 6
