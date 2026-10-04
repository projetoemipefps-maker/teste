import { describe, expect, it } from 'vitest'
import { DEMAND, SHIFT } from '../config'
import { dayMultiplier, expectedCustomers, forecastOf, hourlyDemand, isPeak, spawnInterval } from './demand'
import { defaultPrices } from './pricing'
import { testPlayer } from './testing'

const at = (hour: number) => ((hour - SHIFT.openHour + 0.5) / (SHIFT.closeHour - SHIFT.openHour)) * SHIFT.durationSeconds

describe('movimento do dia', () => {
  it('a tabela cobre todas as horas do turno', () => {
    expect(DEMAND.hourly).toHaveLength(SHIFT.closeHour - SHIFT.openHour)
  })

  it('o turno dura cerca de 5 minutos, das 11h às 23h', () => {
    expect(SHIFT.openHour).toBe(11)
    expect(SHIFT.closeHour).toBe(23)
    expect(SHIFT.durationSeconds).toBe(300)
  })

  it('almoço (12h–14h) e jantar (19h–21h) têm pico; o fim de tarde é calmo', () => {
    for (const h of [12, 13, 19, 20]) expect(isPeak(at(h))).toBe(true)
    for (const h of [15, 16, 17]) expect(hourlyDemand(at(h))).toBeLessThan(1)
    expect(hourlyDemand(at(12))).toBeGreaterThan(hourlyDemand(at(16)) * 2)
    expect(hourlyDemand(at(20))).toBeGreaterThan(hourlyDemand(at(16)) * 2)
  })

  it('fora do turno usa a primeira/última hora', () => {
    expect(hourlyDemand(-10)).toBe(DEMAND.hourly[0])
    expect(hourlyDemand(1e6)).toBe(DEMAND.hourly[DEMAND.hourly.length - 1])
  })

  it('o movimento do dia é determinístico, dentro dos limites, e o dia 1 é normal', () => {
    expect(dayMultiplier(1)).toBe(1)
    for (let d = 2; d < 60; d++) {
      const m = dayMultiplier(d)
      expect(m).toBe(dayMultiplier(d))
      expect(m).toBeGreaterThanOrEqual(DEMAND.dayMultiplierMin)
      expect(m).toBeLessThanOrEqual(DEMAND.dayMultiplierMax)
    }
    const labels = new Set(Array.from({ length: 60 }, (_, i) => forecastOf(dayMultiplier(i + 2))))
    expect(labels.size).toBe(3) // aparecem dias fracos, normais e movimentados
  })

  it('a previsão classifica o movimento', () => {
    expect(forecastOf(0.8)).toBe('weak')
    expect(forecastOf(1)).toBe('normal')
    expect(forecastOf(1.2)).toBe('strong')
  })

  it('no pico os clientes chegam mais rápido que no fim de tarde', () => {
    const prices = defaultPrices()
    expect(spawnInterval(at(12), 1, 3, prices, 0.5)).toBeLessThan(spawnInterval(at(16), 1, 3, prices, 0.5))
  })

  it('reputação alta e preço baixo aceleram as chegadas', () => {
    const prices = defaultPrices()
    const cheap = Object.fromEntries(Object.entries(prices).map(([k, v]) => [k, Math.round(v * 0.7)]))
    const normal = spawnInterval(at(12), 1, 3, prices, 0.5)
    expect(spawnInterval(at(12), 1, 5, prices, 0.5)).toBeLessThan(normal)
    expect(spawnInterval(at(12), 1, 1, prices, 0.5)).toBeGreaterThan(normal)
    expect(spawnInterval(at(12), 1, 3, cheap, 0.5)).toBeLessThan(normal)
  })

  it('o intervalo respeita mínimo e máximo', () => {
    const prices = defaultPrices()
    expect(spawnInterval(at(12), 100, 5, prices, 0.5)).toBe(DEMAND.minSpawnInterval)
    expect(spawnInterval(at(16), 0.01, 0, prices, 0.5)).toBe(DEMAND.maxSpawnInterval)
  })

  it('o jitter varia o intervalo dentro da margem', () => {
    const prices = defaultPrices()
    const lo = spawnInterval(at(12), 1, 3, prices, 0)
    const hi = spawnInterval(at(12), 1, 3, prices, 0.999)
    expect(hi / lo).toBeCloseTo((1 + DEMAND.spawnJitter) / (1 - DEMAND.spawnJitter), 1)
  })

  it('a estimativa de clientes do dia é coerente (algumas dezenas) e reage à reputação e ao preço', () => {
    const base = expectedCustomers(testPlayer())
    expect(base).toBeGreaterThan(15)
    expect(base).toBeLessThan(60)
    expect(expectedCustomers(testPlayer({ reputation: 5 }))).toBeGreaterThan(base)
    expect(expectedCustomers(testPlayer({ reputation: 1 }))).toBeLessThan(base)
  })
})
