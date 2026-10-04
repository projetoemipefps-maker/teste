import { describe, expect, it } from 'vitest'
import { DRINKS, DRINK_CONFIG, DRINK_KINDS, TRAY } from '../config'
import { canChooseCup, chooseCup, cupFillRatio, cupQuality, cupToTray, discardCup, setPouring } from './drinks'
import { createSession } from './session'
import { filledStock } from './stock'
import { step } from './tick'
import { testPlayer, testSession } from './testing'
import type { SessionState } from './types'

const base = (): SessionState => ({ ...testSession(), spawnTimer: 999 })

/** Segura o botão por `seconds` (em passos curtos). */
function pour(s: SessionState, seconds: number) {
  let session = setPouring(s, true)
  const events = []
  for (let t = 0; t < seconds - 1e-9; t += 0.05) {
    const r = step(session, testPlayer(), 0.05)
    session = r.session
    events.push(...r.events)
  }
  return { session: setPouring(session, false), events }
}

describe('máquina de bebidas', () => {
  it('escolher o copo põe um copo vazio sob a máquina', () => {
    const s = chooseCup(base(), 'soda', 'medium').session
    expect(s.cup).toEqual({ kind: 'soda', size: 'medium', fill: 0 })
  })

  it('só enche com copo e com o botão pressionado', () => {
    expect(setPouring(base(), true).pouring).toBe(false)
    const withCup = chooseCup(base(), 'soda', 'small').session
    expect(setPouring(withCup, true).pouring).toBe(true)
    expect(step(withCup, testPlayer(), 0.1).session.cup!.fill).toBe(0)
  })

  it('enche na vazão da bebida: milkshake é mais grosso e enche mais devagar', () => {
    const soda = pour(chooseCup(base(), 'soda', 'large').session, 2).session
    expect(soda.cup!.fill).toBeCloseTo(2 * DRINK_CONFIG.soda.fillRate, 0)
    const shake = pour(chooseCup(base(), 'shakeChocolate', 'large').session, 2).session
    expect(shake.cup!.fill).toBeCloseTo(2 * DRINK_CONFIG.shakeChocolate.fillRate, 0)
    expect(shake.cup!.fill).toBeLessThan(soda.cup!.fill)
  })

  it('classifica o copo: pouco, bom, derramou', () => {
    const cap = DRINKS.cups.small.capacity
    const cup = (fill: number) => ({ kind: 'soda' as const, size: 'small' as const, fill })
    expect(cupQuality(cup(cap * 0.5))).toBe('low')
    expect(cupQuality(cup(cap * DRINKS.minFillRatio))).toBe('good')
    expect(cupQuality(cup(cap))).toBe('good')
    expect(cupQuality(cup(cap * 1.05))).toBe('spilled')
  })

  it('encher demais derrama (uma única vez) e o copo trava no limite', () => {
    const r = pour(chooseCup(base(), 'soda', 'small').session, 10)
    expect(r.events.filter((e) => e.type === 'cupSpilled')).toHaveLength(1)
    expect(cupQuality(r.session.cup!)).toBe('spilled')
    expect(cupFillRatio(r.session.cup!)).toBeCloseTo(DRINKS.overflowCapRatio)
  })

  it('a janela de "bom" é maior que o tempo de reação, em todas as bebidas', () => {
    for (const kind of DRINK_KINDS) {
      const window = (DRINKS.cups.small.capacity * (1 - DRINKS.minFillRatio)) / DRINK_CONFIG[kind].fillRate
      expect(window, kind).toBeGreaterThanOrEqual(0.4)
    }
  })

  it('o copo vai para a bandeja com tipo, tamanho e qualidade, e a máquina fica livre', () => {
    const filled = pour(chooseCup(base(), 'juice', 'small').session, 1.5).session // 180 ml de 300 = 60% → pouco
    const r = cupToTray(filled)
    expect(r.session.cup).toBeNull()
    expect(r.session.tray.drinks).toEqual([{ kind: 'juice', size: 'small', quality: 'low' }])
  })

  it('copo vazio não vai para a bandeja; bandeja cheia não aceita outra bebida', () => {
    const empty = chooseCup(base(), 'soda', 'small').session
    expect(cupToTray(empty).session).toBe(empty)
    const full = {
      ...pour(empty, 2.2).session,
      tray: { ...base().tray, drinks: Array.from({ length: TRAY.drinks }, () => ({ kind: 'soda' as const, size: 'small' as const, quality: 'good' as const })) },
    }
    expect(cupToTray(full).session).toBe(full)
  })

  it('dá para jogar o copo fora', () => {
    const s = chooseCup(base(), 'soda', 'small').session
    expect(discardCup(s).session.cup).toBeNull()
    expect(discardCup(base()).events).toEqual([])
  })

  it('gasta o estoque da bebida certa conforme o tamanho e não vai sem estoque', () => {
    const s = chooseCup(testSession(1, { stock: { ...filledStock(0), soda: 5 } }), 'soda', 'large').session
    expect(s.stock.soda).toBe(2)
    const poor = testSession(1, { stock: { ...filledStock(0), soda: 1 } })
    expect(canChooseCup(poor, 'soda', 'medium')).toBe(false)
    expect(chooseCup(poor, 'soda', 'medium').session).toBe(poor)
    // suco usa o estoque de suco, não o de refri
    const juice = testSession(1, { stock: { ...filledStock(0), soda: 9 } })
    expect(chooseCup(juice, 'juice', 'small').session).toBe(juice)
  })

  it('só as bebidas liberadas pelo nível podem ser servidas', () => {
    const early = testSession(1, { level: 1 })
    expect(canChooseCup(early, 'juice', 'small')).toBe(false)
    expect(canChooseCup(testSession(1, { level: DRINK_CONFIG.juice.unlockLevel }), 'juice', 'small')).toBe(true)
    expect(canChooseCup(testSession(1, { level: 14 }), 'shakeChocolate', 'small')).toBe(false)
    expect(canChooseCup(testSession(1, { level: 15 }), 'shakeChocolate', 'small')).toBe(true)
  })

  it('trocar um copo ainda vazio devolve a bebida; jogar fora também', () => {
    let s = chooseCup(testSession(1, { stock: { ...filledStock(0), soda: 3 } }), 'soda', 'large').session
    expect(s.stock.soda).toBe(0)
    s = chooseCup(s, 'soda', 'small').session
    expect(s.stock.soda).toBe(2)
    expect(discardCup(s).session.stock.soda).toBe(3)
    const used = { ...s, cup: { kind: 'soda' as const, size: 'small' as const, fill: 50 } }
    expect(discardCup(used).session.stock.soda).toBe(s.stock.soda) // copo já servido desperdiça
  })

  it('escolher o mesmo copo vazio não gasta de novo', () => {
    const s = chooseCup(createSession(1, { stock: { ...filledStock(0), soda: 3 } }), 'soda', 'small').session
    expect(chooseCup(s, 'soda', 'small').session).toBe(s)
  })
})
