export const DEMAND = {
  /**
   * Multiplicador de movimento por hora do relógio, de `SHIFT.openHour` até `SHIFT.closeHour`.
   * Almoço (12h–14h) e jantar (19h–21h) têm pico; o fim de tarde é calmo.
   */
  hourly: [0.8, 1.6, 1.6, 0.9, 0.5, 0.4, 0.5, 0.9, 1.8, 1.8, 0.9, 0.5],
  /** Segundos médios entre clientes quando o movimento total é 1,0. */
  baseSpawnInterval: 10,
  /** Variação aleatória do intervalo (± fração). */
  spawnJitter: 0.25,
  minSpawnInterval: 2.5,
  maxSpawnInterval: 40,
  /** Movimento de cada dia (a "previsão"), entre estes valores. O dia 1 é sempre normal. */
  dayMultiplierMin: 0.8,
  dayMultiplierMax: 1.25,
  /** Abaixo de `weak` o dia é fraco; acima de `strong`, movimentado. */
  forecast: { weak: 0.92, strong: 1.1 },
  /** A partir deste multiplicador a interface avisa que é horário de pico. */
  peakThreshold: 1.4,
  /** Depois do fechamento, quanto tempo os clientes que sobraram ainda podem ser atendidos (s). */
  closingGraceSeconds: 30,
} as const
