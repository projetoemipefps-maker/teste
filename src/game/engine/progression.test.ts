import { describe, expect, it } from 'vitest'
import { PROGRESSION, RECIPES } from '../config'
import { addXp, xpForServe, xpProgress, xpToNext } from './xp'
import { applyReputation, clampReputation, reputationDelta, starFill } from './rating'
import { formatClock, shiftProgress } from './clock'
import { SHIFT } from '../config'

describe('XP e nível', () => {
  it('a curva cresce a cada nível', () => {
    expect(xpToNext(1)).toBe(PROGRESSION.xpBase)
    expect(xpToNext(2)).toBeGreaterThan(xpToNext(1))
  })

  it('soma XP sem subir de nível', () => {
    expect(addXp(1, 0, 10)).toEqual({ level: 1, xp: 10, levelsGained: 0 })
  })

  it('sobe de nível e carrega o excedente', () => {
    const r = addXp(1, 40, 20)
    expect(r.level).toBe(2)
    expect(r.xp).toBe(40 + 20 - xpToNext(1))
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

  it('acerto dá mais XP que erro, e lanche maior dá mais', () => {
    const small = RECIPES.find((r) => r.id === 'simples')!
    const big = RECIPES.find((r) => r.id === 'x-salada')!
    expect(xpForServe(small, true)).toBeGreaterThan(xpForServe(small, false))
    expect(xpForServe(big, true)).toBeGreaterThan(xpForServe(small, true))
  })

  it('progresso da barra fica entre 0 e 1', () => {
    expect(xpProgress(1, 0)).toBe(0)
    expect(xpProgress(1, xpToNext(1) / 2)).toBeCloseTo(0.5)
  })
})

describe('reputação', () => {
  it('ótimo atendimento rende mais que bom; erro e abandono tiram', () => {
    expect(reputationDelta('correct', 1)).toBeGreaterThan(reputationDelta('correct', 0.1))
    expect(reputationDelta('wrong', 1)).toBeLessThan(0)
    expect(reputationDelta('lost', 0)).toBeLessThan(reputationDelta('wrong', 0))
  })

  it('fica entre 0 e o máximo', () => {
    expect(applyReputation(0.1, -5)).toBe(0)
    expect(applyReputation(4.9, 5)).toBe(PROGRESSION.maxReputation)
    expect(clampReputation(-1)).toBe(0)
  })

  it('preenchimento das estrelas', () => {
    expect(starFill(2.5, 0)).toBe(1)
    expect(starFill(2.5, 2)).toBeCloseTo(0.5)
    expect(starFill(2.5, 3)).toBe(0)
  })
})

describe('relógio do turno', () => {
  it('começa na abertura e termina no fechamento', () => {
    expect(formatClock(0)).toBe('10:00')
    expect(formatClock(SHIFT.durationSeconds)).toBe('22:00')
    expect(formatClock(SHIFT.durationSeconds / 2)).toBe('16:00')
  })

  it('o progresso é limitado a 0–1', () => {
    expect(shiftProgress(-5)).toBe(0)
    expect(shiftProgress(SHIFT.durationSeconds * 3)).toBe(1)
  })
})
