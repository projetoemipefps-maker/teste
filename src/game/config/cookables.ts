import type { StockId } from './stock'

export const SIDE_IDS = ['fries', 'rustic', 'loaded', 'nuggets', 'rings'] as const
export type SideId = (typeof SIDE_IDS)[number]
export type CookableId = SideId | 'brownie'

export interface CookableConfig {
  id: CookableId
  name: string
  /** Onde cozinha: fritadeira (acompanhamentos) ou forno (brownie). */
  station: 'fryer' | 'oven'
  /** Segundos até ficar pronto e até queimar. */
  readySeconds: number
  burntSeconds: number
  /** Segundos guardado (estufa) até murchar; null = não murcha. */
  staleSeconds: number | null
  /** Estoque gasto por porção. */
  stock: Partial<Record<StockId, number>>
  basePrice: number
  unlockLevel: number
}

export const COOKABLES: Record<CookableId, CookableConfig> = {
  fries: { id: 'fries', name: 'Batata frita', station: 'fryer', readySeconds: 8, burntSeconds: 13, staleSeconds: 30, stock: { potato: 1 }, basePrice: 8, unlockLevel: 1 },
  rustic: { id: 'rustic', name: 'Batata rústica', station: 'fryer', readySeconds: 10, burntSeconds: 16, staleSeconds: 30, stock: { rusticPotato: 1 }, basePrice: 11, unlockLevel: 7 },
  nuggets: { id: 'nuggets', name: 'Nuggets', station: 'fryer', readySeconds: 7, burntSeconds: 11, staleSeconds: 30, stock: { nuggets: 1 }, basePrice: 13, unlockLevel: 11 },
  rings: { id: 'rings', name: 'Anéis de cebola', station: 'fryer', readySeconds: 6, burntSeconds: 10, staleSeconds: 30, stock: { onionRings: 1 }, basePrice: 11, unlockLevel: 17 },
  loaded: { id: 'loaded', name: 'Batata com cheddar e bacon', station: 'fryer', readySeconds: 8, burntSeconds: 13, staleSeconds: 25, stock: { potato: 1, cheddar: 1, bacon: 1 }, basePrice: 17, unlockLevel: 26 },
  brownie: { id: 'brownie', name: 'Brownie', station: 'oven', readySeconds: 9, burntSeconds: 15, staleSeconds: null, stock: { brownie: 1 }, basePrice: 9, unlockLevel: 12 },
}

export const DESSERT_IDS = ['brownie', 'iceCream'] as const
export type DessertId = (typeof DESSERT_IDS)[number]

export interface DessertConfig {
  id: DessertId
  name: string
  basePrice: number
  unlockLevel: number
  /** Estoque gasto ao servir (só sobremesas instantâneas; o brownie gasta ao ir para o forno). */
  stock: Partial<Record<StockId, number>>
}

export const DESSERTS: Record<DessertId, DessertConfig> = {
  brownie: { id: 'brownie', name: 'Brownie', basePrice: COOKABLES.brownie.basePrice, unlockLevel: COOKABLES.brownie.unlockLevel, stock: {} },
  iceCream: { id: 'iceCream', name: 'Sorvete', basePrice: 8, unlockLevel: 21, stock: { iceCream: 1 } },
}

/** Espaços do forno: um número por vaga, com o nível em que ela é liberada (os da chapa e da fritadeira vêm da loja). */
export const OVEN_SLOT_LEVELS: readonly number[] = [12, 12]
/** Porções que cabem na estufa (sem melhorias) e na vitrine de brownies. */
export const WARMER_CAPACITY = 3
export const SHELF_CAPACITY = 3
