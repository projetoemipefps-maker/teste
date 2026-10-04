export const RATING = {
  minStars: 1,
  maxStars: 5,
  /** Cada problema tira esta quantidade de estrelas (a nota parte de 5 e é arredondada). */
  penalty: {
    burgerMissing: 3.5,
    burgerWrong: 3,
    pattyRaw: 1.5,
    pattyOverdone: 0.75,
    sideMissing: 1.5,
    sideWrong: 1,
    sideStale: 0.5,
    drinkMissing: 1.5,
    drinkWrongKind: 1.25,
    drinkWrongSize: 1,
    drinkLow: 1,
    drinkSpilled: 0.75,
    dessertMissing: 1.5,
    dessertWrong: 1,
  },
  /** Penalidade pela espera: vale a primeira faixa cuja paciência restante (0–1) for >= minRatio. */
  wait: [
    { minRatio: 0.6, penalty: 0 },
    { minRatio: 0.3, penalty: 0.5 },
    { minRatio: 0, penalty: 1 },
  ],
  /** A partir desta paciência restante o atendimento conta como "rápido". */
  fastRatio: 0.6,
} as const
