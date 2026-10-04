export const CUP_SIZES = ['small', 'medium', 'large'] as const
export type CupSize = (typeof CUP_SIZES)[number]

export interface CupConfig {
  name: string
  /** Letra mostrada no botão do copo. */
  short: string
  /** Capacidade em ml. */
  capacity: number
  /** Preço de venda padrão da bebida (R$). */
  basePrice: number
  /** Unidades de refrigerante (estoque) gastas por copo. */
  sodaUnits: number
}

export const DRINKS = {
  cups: {
    small: { name: 'Pequeno', short: 'P', capacity: 300, basePrice: 5, sodaUnits: 1 },
    medium: { name: 'Médio', short: 'M', capacity: 400, basePrice: 8, sodaUnits: 2 },
    large: { name: 'Grande', short: 'G', capacity: 500, basePrice: 10, sodaUnits: 3 },
  } satisfies Record<CupSize, CupConfig>,
  /** Vazão da máquina em ml por segundo. */
  fillRate: 120,
  /** Abaixo desta fração do copo o cliente reclama. */
  minFillRatio: 0.8,
  /** Acima de 100% derrama; o copo não passa desta fração enquanto derrama. */
  overflowCapRatio: 1.3,
} as const
