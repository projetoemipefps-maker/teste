export const PROGRESSION = {
  startingLevel: 1,
  startingDay: 1,
  /** XP necessário para sair do nível 1; cresce por `xpGrowth` a cada nível. */
  xpBase: 50,
  xpGrowth: 1.35,
  xpPerCorrectServe: 10,
  xpPerIngredient: 2,
  xpPerWrongServe: 2,
  maxLevel: 50,

  startingReputation: 3,
  maxReputation: 5,
  /** Paciência restante (0–1) a partir da qual o atendimento conta como "ótimo". */
  greatPatienceRatio: 0.5,
  reputation: {
    great: 0.12,
    good: 0.06,
    wrong: -0.25,
    lost: -0.4,
  },
} as const
