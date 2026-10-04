export const PROGRESSION = {
  startingLevel: 1,
  startingDay: 1,
  /** XP necessário para sair do nível 1; cresce por `xpGrowth` a cada nível. */
  xpBase: 50,
  xpGrowth: 1.35,
  /** XP por nota do atendimento (índice 0 = 1 estrela). */
  xpByStars: [2, 5, 9, 13, 18],
  /** XP extra por batata ou bebida do combo entregue. */
  xpPerExtraItem: 4,
  maxLevel: 50,

  startingReputation: 3,
  maxReputation: 5,
} as const
