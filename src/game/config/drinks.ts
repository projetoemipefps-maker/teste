import type { StockId } from './stock'

export const CUP_SIZES = ['small', 'medium', 'large'] as const
export type CupSize = (typeof CUP_SIZES)[number]

export const DRINK_KINDS = ['soda', 'juice', 'shakeChocolate', 'shakeStrawberry', 'shakeVanilla'] as const
export type DrinkKind = (typeof DRINK_KINDS)[number]

export interface CupConfig {
  name: string
  /** Letra mostrada no botão do copo. */
  short: string
  /** Capacidade em ml. */
  capacity: number
  /** Unidades do estoque da bebida gastas por copo. */
  units: number
}

export interface DrinkKindConfig {
  id: DrinkKind
  name: string
  /** Nome curto (botões). */
  short: string
  stock: StockId
  unlockLevel: number
  /** Vazão da máquina em ml por segundo (milkshake é mais grosso e enche devagar). */
  fillRate: number
  /** Preço de venda padrão por tamanho (R$). */
  basePrice: Record<CupSize, number>
}

export const DRINK_CONFIG: Record<DrinkKind, DrinkKindConfig> = {
  soda: { id: 'soda', name: 'Refrigerante', short: 'Refri', stock: 'soda', unlockLevel: 1, fillRate: 120, basePrice: { small: 5, medium: 8, large: 10 } },
  juice: { id: 'juice', name: 'Suco natural', short: 'Suco', stock: 'juice', unlockLevel: 5, fillRate: 120, basePrice: { small: 7, medium: 11, large: 14 } },
  shakeChocolate: { id: 'shakeChocolate', name: 'Milkshake de chocolate', short: 'Choc.', stock: 'shakeChocolate', unlockLevel: 15, fillRate: 80, basePrice: { small: 10, medium: 15, large: 19 } },
  shakeStrawberry: { id: 'shakeStrawberry', name: 'Milkshake de morango', short: 'Morango', stock: 'shakeStrawberry', unlockLevel: 19, fillRate: 80, basePrice: { small: 10, medium: 15, large: 19 } },
  shakeVanilla: { id: 'shakeVanilla', name: 'Milkshake de baunilha', short: 'Baunilha', stock: 'shakeVanilla', unlockLevel: 24, fillRate: 80, basePrice: { small: 10, medium: 15, large: 19 } },
}

export const DRINKS = {
  cups: {
    small: { name: 'Pequeno', short: 'P', capacity: 300, units: 1 },
    medium: { name: 'Médio', short: 'M', capacity: 400, units: 2 },
    large: { name: 'Grande', short: 'G', capacity: 500, units: 3 },
  } satisfies Record<CupSize, CupConfig>,
  /** Abaixo desta fração do copo o cliente reclama. */
  minFillRatio: 0.8,
  /** Acima de 100% derrama; o copo não passa desta fração enquanto derrama. */
  overflowCapRatio: 1.3,
} as const
