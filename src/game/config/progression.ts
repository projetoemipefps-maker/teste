export const PROGRESSION = {
  startingLevel: 1,
  startingDay: 1,
  /** XP para sair de cada um dos primeiros níveis (começo rápido: níveis nos primeiros minutos). */
  earlyXp: [15, 35, 60, 100, 150],
  /** Depois dos primeiros níveis: `xpBase × nível ^ xpExponent`. */
  xpBase: 30,
  xpExponent: 1.25,
  /** XP por nota do atendimento (índice 0 = 1 estrela). */
  xpByStars: [2, 5, 9, 13, 18],
  /** XP extra por item (lanche além do primeiro, acompanhamento, bebida ou sobremesa) entregue. */
  xpPerExtraItem: 4,
  maxLevel: 50,

  startingReputation: 3,
  maxReputation: 5,

  /** Dificuldade que cresce com o nível. */
  difficulty: {
    /** Movimento (chegada de clientes) = 1 + (nível − 1) × este valor, até o teto. */
    demandPerLevel: 0.02,
    demandMax: 2,
  },
} as const