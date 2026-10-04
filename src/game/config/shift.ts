export const SHIFT = {
  /** Duração do turno em segundos reais. */
  durationSeconds: 180,
  /** Horário do relógio do jogo (horas) no início e no fim do turno. */
  openHour: 10,
  closeHour: 22,
  /** Maior delta time aceito por quadro (segundos), evita saltos ao voltar de outra aba. */
  maxDeltaSeconds: 0.1,
} as const
