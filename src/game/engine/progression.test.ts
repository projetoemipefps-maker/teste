import { describe, expect, it } from 'vitest'
import { PROGRESSION, SHIFT } from '../config'
import { addXp, xpForServe, xpProgress, xpToNext } from './xp'
import { starFill } from './rating'
import { formatClock, shiftProgress } from './clock'

describe('XP e nível', () => {
  it('a curva cresce a cada nível', () => {
    expect(xpToNext(1)).toBe(PROGRESSION.earlyXp[0])
    expect(xpToNext(2)).toBeGreaterThan(xpToNext(1))
  })

  it('soma XP sem subir de nível', () => {
    expect(addXp(1, 0, 10)).toEqual({ level: 1, xp: 10, levelsGained: 0 })
  })

  it('sobe de nível e carrega o excedente', () => {
    const r = addXp(1, xpToNext(1) - 5, 10)
    expect(r.level).toBe(2)
    expect(r.xp).toBe(5)
    expect(r.levelsGained).toBe(1)
  })

  it('pode subir vários níveis de uma vez', () => {
    expect(addXp(1, 0, 10_000).levelsGained).toBeGreaterThan(1)
  })

  it('não passa do nível máximo', () => {
    const r = addXp(PROGRESSION.maxLevel, 0, 99999)
    expect(r.level).toBe(PROGRESSION.maxLevel)
    expect(xpProgress(r.level, r.xp)).toBe(1)
  })

  it('nota maior e itens extras dão mais XP', () => {
    expect(xpForServe(5, 0)).toBeGreaterThan(xpForServe(1, 0))
    expect(xpForServe(3, 2)).toBe(xpForServe(3, 0) + 2 * PROGRESSION.xpPerExtraItem)
    expect(xpForServe(9, 0)).toBe(xpForServe(5, 0))
  })

  it('progresso da barra fica entre 0 e 1', () => {
    expect(xpProgress(1, 0)).toBe(0)
    expect(xpProgress(1, xpToNext(1) / 2)).toBeCloseTo(0.5)
  })
})

describe('estrelas do HUD', () => {
  it('preenchimento das estrelas', () => {
    expect(starFill(2.5, 0)).toBe(1)
    expect(starFill(2.5, 2)).toBeCloseTo(0.5)
    expect(starFill(2.5, 3)).toBe(0)
  })
})

describe('relógio do turno', () => {
  it('começa na abertura e termina no fechamento', () => {
    expect(formatClock(0)).toBe('11:00')
    expect(formatClock(SHIFT.durationSeconds)).toBe('23:00')
    expect(formatClock(SHIFT.durationSeconds / 2)).toBe('17:00')
  })

  it('o progresso é limitado a 0–1', () => {
    expect(shiftProgress(-5)).toBe(0)
    expect(shiftProgress(SHIFT.durationSeconds * 3)).toBe(1)
  })
})
