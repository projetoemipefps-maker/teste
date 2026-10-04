export const CUSTOMERS = {
  maxSlots: 3,
  /** Paciência = base + porIngrediente × nº de ingredientes do pedido (segundos). */
  patienceBase: 25,
  patiencePerIngredient: 4,
  patienceFriesBonus: 8,
  patienceDrinkBonus: 6,
  firstSpawnDelay: 2,
  /** Tempo que o cliente fica reagindo (feliz/bravo) antes de sair (segundos). */
  leaveDuration: 1.3,
  /** Quantidade de aparências de cliente desenhadas em /src/art/customers. */
  variantCount: 6,
} as const
