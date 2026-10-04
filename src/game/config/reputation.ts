export const REPUTATION = {
  /** Quantas avaliações recentes entram na média. */
  window: 25,
  /** "Avaliações imaginárias" que puxam a nota para o meio quando há poucas reais. */
  priorStars: 3,
  priorWeight: 4,
  /** Quantas avaliações ficam guardadas no save. */
  keepReviews: 40,
  /** Cliente que vai embora sem ser atendido deixa esta nota. */
  lostStars: 1,
  maxStars: 5,
  /** Nota considerada neutra: acima dela vêm mais clientes, mais pacientes. */
  neutralStars: 3,
  /** Variação de movimento por estrela acima/abaixo da neutra. */
  demandPerStar: 0.16,
  /** Variação de paciência por estrela acima/abaixo da neutra. */
  patiencePerStar: 0.05,
} as const
