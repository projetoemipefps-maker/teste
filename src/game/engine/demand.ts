import { DEMAND, SHIFT } from '../config'
import { demandFactorFromPrices } from './pricing'
import { demandFactorForReputation } from './reputation'
import { shiftProgress } from './clock'
import type { PlayerState, Prices } from './types'

const HOURS = SHIFT.closeHour - SHIFT.openHour

/** Multiplicador de movimento da hora do relógio em que o turno está. */
export function hourlyDemand(elapsed: number): number {
  const idx = Math.min(HOURS - 1, Math.floor(shiftProgress(elapsed) * HOURS))
  return DEMAND.hourly[idx] ?? 1
}

export const isPeak = (elapsed: number): boolean => hourlyDemand(elapsed) >= DEMAND.peakThreshold

/** Movimento do dia (a previsão): determinístico por dia; o primeiro dia é sempre normal. */
export function dayMultiplier(day: number): number {
  if (day <= 1) return 1
  const x = Math.sin(day * 12.9898) * 43758.5453
  const frac = x - Math.floor(x)
  return DEMAND.dayMultiplierMin + frac * (DEMAND.dayMultiplierMax - DEMAND.dayMultiplierMin)
}

export type Forecast = 'weak' | 'normal' | 'strong'
export function forecastOf(multiplier: number): Forecast {
  if (multiplier < DEMAND.forecast.weak) return 'weak'
  if (multiplier > DEMAND.forecast.strong) return 'strong'
  return 'normal'
}

/** Segundos até o próximo cliente. `jitter` vem de um sorteio em [0, 1). */
export function spawnInterval(
  elapsed: number,
  dayMult: number,
  reputation: number,
  prices: Prices,
  jitter: number,
): number {
  const rate = hourlyDemand(elapsed) * dayMult * demandFactorForReputation(reputation) * demandFactorFromPrices(prices)
  const wobble = 1 + (jitter * 2 - 1) * DEMAND.spawnJitter
  const interval = (DEMAND.baseSpawnInterval / Math.max(0.05, rate)) * wobble
  return Math.min(DEMAND.maxSpawnInterval, Math.max(DEMAND.minSpawnInterval, interval))
}

/** Clientes esperados no dia (estimativa para a tela de preparação). */
export function expectedCustomers(player: Pick<PlayerState, 'day' | 'reputation' | 'prices'>): number {
  const meanHourly = DEMAND.hourly.reduce((a, b) => a + b, 0) / DEMAND.hourly.length
  const rate =
    meanHourly *
    dayMultiplier(player.day) *
    demandFactorForReputation(player.reputation) *
    demandFactorFromPrices(player.prices)
  return Math.round((SHIFT.durationSeconds / DEMAND.baseSpawnInterval) * rate)
}
