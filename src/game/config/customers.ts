export const CUSTOMERS = {
  /** Lugares no balcão com todas as melhorias (o jogador começa com `UPGRADES.counterSeats.base`). */
  maxSlots: 6,
  /** Paciência = base + porIngrediente × nº de ingredientes do pedido (segundos). */
  patienceBase: 25,
  patiencePerIngredient: 4,
  patienceSideBonus: 8,
  patienceDrinkBonus: 6,
  patienceDessertBonus: 6,
  firstSpawnDelay: 2,
  /** Tempo que o cliente fica reagindo (feliz/bravo) antes de sair (segundos). */
  leaveDuration: 1.3,
  /** Tentativas de sortear um visual diferente dos clientes que já estão no balcão. */
  lookRetries: 12,
  /** Abaixo desta paciência restante (0–1) o cliente fica com cara de impaciente. */
  impatientRatio: 0.35,
} as const
