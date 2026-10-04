export const CUP_SIZES = ['small', 'medium', 'large'] as const
export type CupSize = (typeof CUP_SIZES)[number]

export interface CupConfig {
  name: string
  /** Letra mostrada no botão do copo. */
  short: string
  /** Capacidade em ml. */
  capacity: number
  /** Preço da bebida (R$). */
  price: number
}

export const DRINKS = {
  cups: {
    small: { name: 'Pequeno', short: 'P', capacity: 300, price: 4 },
    medium: { name: 'Médio', short: 'M', capacity: 400, price: 6 },
    large: { name: 'Grande', short: 'G', capacity: 500, price: 8 },
  } satisfies Record<CupSize, CupConfig>,
  /** Vazão da máquina em ml por segundo. */
  fillRate: 120,
  /** Abaixo desta fração do copo o cliente reclama. */
  minFillRatio: 0.8,
  /** Acima de 100% derrama; o copo não passa desta fração enquanto derrama. */
  overflowCapRatio: 1.3,
} as const
