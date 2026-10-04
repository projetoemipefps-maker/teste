export const SHIFT = {
  /** Duração do turno em segundos reais (o dia do jogo vai de `openHour` a `closeHour`). */
  durationSeconds: 300,
  /** Horário do relógio do jogo (horas) na abertura e no fechamento. */
  openHour: 11,
  closeHour: 23,
  /** Maior delta time aceito por quadro (segundos), evita saltos ao voltar de outra aba. */
  maxDeltaSeconds: 0.1,
} as const
