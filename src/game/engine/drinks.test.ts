import { describe, expect, it } from 'vitest'
import { DRINKS, PROGRESSION } from '../config'
import { chooseCup, cupFillRatio, cupQuality, cupToTray, discardCup, setPouring } from './drinks'
import { createSession } from './session'
import { step } from './tick'
import type { PlayerState, SessionState } from './types'

const player = (): PlayerState => ({ money: 0, xp: 0, level: 1, day: 1, reputation: PROGRESSION.startingReputation })
const base = (): SessionState => ({ ...createSession(1), spawnTimer: 999 })

/** Segura o botão por `seconds` (em passos curtos). */
function pour(s: SessionState, seconds: number) {
  let session = setPouring(s, true)
  const events = []
  for (let t = 0; t < seconds - 1e-9; t += 0.05) {
    const r = step(session, player(), 0.05)
    session = r.session
    events.push(...r.events)
  }
  return { session: setPouring(session, false), events }
}

describe('máquina de refrigerante', () => {
  it('escolher o copo põe um copo vazio sob a máquina', () => {
    const s = chooseCup(base(), 'medium').session
    expect(s.cup).toEqual({ size: 'medium', fill: 0 })
  })

  it('só enche com copo e com o botão pressionado', () => {
    expect(setPouring(base(), true).pouring).toBe(false)
    const withCup = chooseCup(base(), 'small').session
    expect(setPouring(withCup, true).pouring).toBe(true)
    const idle = step(withCup, player(), 0.1).session
    expect(idle.cup!.fill).toBe(0)
  })

  it('enche na vazão configurada', () => {
    const s = pour(chooseCup(base(), 'large').session, 2).session
    expect(s.cup!.fill).toBeCloseTo(2 * DRINKS.fillRate, 0)
  })

  it('classifica o copo: pouco, bom, derramou', () => {
    const cap = DRINKS.cups.small.capacity
    expect(cupQuality({ size: 'small', fill: cap * 0.5 })).toBe('low')
    expect(cupQuality({ size: 'small', fill: cap * DRINKS.minFillRatio })).toBe('good')
    expect(cupQuality({ size: 'small', fill: cap })).toBe('good')
    expect(cupQuality({ size: 'small', fill: cap * 1.05 })).toBe('spilled')
  })

  it('encher demais derrama (uma única vez) e o copo trava no limite', () => {
    const r = pour(chooseCup(base(), 'small').session, 10)
    expect(r.events.filter((e) => e.type === 'cupSpilled')).toHaveLength(1)
    expect(cupQuality(r.session.cup!)).toBe('spilled')
    expect(cupFillRatio(r.session.cup!)).toBeCloseTo(DRINKS.overflowCapRatio)
  })

  it('o copo vai para a bandeja com a qualidade, e a máquina fica livre', () => {
    const filled = pour(chooseCup(base(), 'small').session, 1.5).session // 180 ml de 300 = 60% → pouco
    const r = cupToTray(filled)
    expect(r.session.cup).toBeNull()
    expect(r.session.tray.drink).toEqual({ size: 'small', quality: 'low' })
  })

  it('copo vazio não vai para a bandeja; bandeja com bebida não aceita outra', () => {
    const empty = chooseCup(base(), 'small').session
    expect(cupToTray(empty).session).toBe(empty)
    const taken = { ...pour(empty, 2.2).session, tray: { burger: null, fries: null, drink: { size: 'small' as const, quality: 'good' as const } } }
    expect(cupToTray(taken).session).toBe(taken)
  })

  it('dá para jogar o copo fora', () => {
    const s = chooseCup(base(), 'small').session
    expect(discardCup(s).session.cup).toBeNull()
    expect(discardCup(base()).events).toEqual([])
  })
})
