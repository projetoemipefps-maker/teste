/** O que cabe na bandeja de entrega, por tipo de item. */
export const TRAY = { burgers: 4, sides: 4, drinks: 4, desserts: 3 } as const

/** Regras de sorteio dos pedidos (crescem com o nível: pedidos ficam maiores). */
export const ORDER_RULES = {
  /** Chance de cada lanche vir com acompanhamento, bebida e sobremesa: `base + porNível × (nível − 1)`, até o teto. */
  sideChance: { base: 0.35, perLevel: 0.012, max: 0.8 },
  drinkChance: { base: 0.4, perLevel: 0.012, max: 0.85 },
  dessertChance: { base: 0.1, perLevel: 0.01, max: 0.45 },
  /** Chance de um cliente normal pedir 2 lanches: `(nível − startLevel) × perLevel`, até o teto. */
  extraBurger: { startLevel: 5, perLevel: 0.012, max: 0.4 },
} as const
