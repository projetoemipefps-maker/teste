import { describe, expect, it } from 'vitest'
import { GRILL, INGREDIENTS } from '../config'
import { addPattyToBurger } from './session'
import { cookPatty, createPatty, flipPatty, grillTimes, pattyHint, pattyStage, placeRawPatty, takePatty } from './grill'
import { testPerks, testSession } from './testing'
import { createSession } from './session'
import { filledStock } from './stock'
import type { GrillPatty, SessionState } from './types'

const patty = grillTimes('patty')
const withPatty = (p: GrillPatty, slot = 0): SessionState => {
  const s = testSession()
  const grill = [...s.grill]
  grill[slot] = p
  return { ...s, grill }
}
const both = (a: number, b: number, kind: GrillPatty['kind'] = 'patty'): GrillPatty => ({ kind, sides: [a, b], down: 0, flips: 1 })

describe('chapa', () => {
  it('começa com 2 espaços vazios; mais espaços vêm da loja (até 6), não do nível', () => {
    expect(createSession(1).grill).toEqual([null, null])
    expect(createSession(1, { level: 50 }).grill).toHaveLength(2)
    expect(createSession(1, { perks: testPerks({ grillSlots: 6 }) }).grill).toHaveLength(6)
  })

  it('coloca carne crua num espaço vazio, mas não num ocupado', () => {
    const placed = placeRawPatty(testSession(), 0)
    expect(placed.session.grill[0]).toEqual(createPatty('patty'))
    expect(placed.events).toEqual([{ type: 'pattyPlaced', slot: 0 }])
    expect(placeRawPatty(placed.session, 0).session).toBe(placed.session)
    expect(placeRawPatty(testSession(), 9).events).toEqual([])
  })

  it('gasta o estoque da proteína e não coloca sem estoque', () => {
    const s = testSession(1, { stock: { ...filledStock(0), patty: 1 } })
    const grilled = placeRawPatty(s, 0).session
    expect(grilled.stock.patty).toBe(0)
    expect(placeRawPatty(grilled, 1).session).toBe(grilled)
  })

  it('só cozinha o lado que está na chapa', () => {
    const p = cookPatty(createPatty(), 3)
    expect(p.sides).toEqual([3, 0])
    expect(cookPatty({ ...p, down: 1 }, 2).sides).toEqual([3, 2])
  })

  it('crua → no ponto → passada → queimada, nessa ordem', () => {
    expect(pattyStage(createPatty())).toBe('raw')
    expect(pattyStage(both(patty.done, 0))).toBe('raw') // um lado só
    expect(pattyStage(both(patty.done, patty.done))).toBe('perfect')
    expect(pattyStage(both(patty.overdone, patty.done))).toBe('overdone')
    expect(pattyStage(both(patty.burnt, patty.done))).toBe('burnt')
  })

  it('cada proteína tem o seu tempo: frango demora mais, vegetal menos', () => {
    expect(grillTimes('chicken').done).toBeGreaterThan(patty.done)
    expect(grillTimes('veggie').done).toBeLessThan(patty.done)
    // 8 s por lado: carne no ponto, frango ainda cru, vegetal passando
    expect(pattyStage(both(8, 8, 'patty'))).toBe('perfect')
    expect(pattyStage(both(8, 8, 'chicken'))).toBe('raw')
    expect(pattyStage(both(8, 8, 'veggie'))).toBe('overdone')
  })

  it('só a proteína liberada pode ir para a chapa', () => {
    expect(INGREDIENTS.chicken.unlockLevel).toBeGreaterThan(1)
    const early = testSession(1, { level: 1 })
    expect(placeRawPatty(early, 0, 'chicken').session).toBe(early)
    const late = testSession(1, { level: 20 })
    expect(placeRawPatty(late, 0, 'chicken').session.grill[0]?.kind).toBe('chicken')
  })

  it('sem virar, o lado de baixo queima e a carne nunca fica no ponto', () => {
    let p = createPatty()
    const seen = new Set<string>()
    for (let t = 0; t < patty.burnt + 1; t += 0.1) {
      p = cookPatty(p, 0.1)
      seen.add(pattyStage(p))
    }
    expect(seen.has('perfect')).toBe(false)
    expect(pattyStage(p)).toBe('burnt')
  })

  it('virando na metade a carne fica no ponto', () => {
    let s = placeRawPatty(testSession(), 0).session
    const cook = (sec: number) => {
      s = { ...s, grill: s.grill.map((p) => (p ? cookPatty(p, sec) : p)) }
    }
    cook(patty.done)
    s = flipPatty(s, 0).session
    cook(patty.done)
    expect(pattyStage(s.grill[0]!)).toBe('perfect')
    expect(s.grill[0]!.flips).toBe(1)
  })

  it('virar sem carne não faz nada', () => {
    const s = testSession()
    expect(flipPatty(s, 0)).toEqual({ session: s, events: [] })
  })

  it('avisa para virar quando o lado de baixo está quase no ponto e o outro cru', () => {
    expect(pattyHint(createPatty())).toBeNull()
    expect(pattyHint(cookPatty(createPatty(), patty.done))).toBe('flip')
    expect(pattyHint({ kind: 'patty', sides: [patty.done, 1], down: 1, flips: 1 })).toBeNull()
    expect(pattyHint(both(patty.done, patty.done))).toBe('take')
    expect(pattyHint(both(patty.overdone, 8))).toBe('overdone')
    expect(pattyHint(both(patty.burnt, 8))).toBe('burnt')
  })

  it('tirar uma carne no ponto manda para o prato com o tipo e a qualidade certos', () => {
    const r = takePatty(withPatty(both(8, 8)), 0)
    expect(r.session.grill[0]).toBeNull()
    expect(r.session.held).toEqual([{ id: 'patty', quality: 'perfect' }])
    expect(r.events[0]).toMatchObject({ type: 'pattyTaken', quality: 'perfect' })
    expect(takePatty(withPatty(both(9, 9, 'chicken')), 0).session.held).toEqual([{ id: 'chicken', quality: 'perfect' }])
  })

  it('carne crua ou passada também vai para o prato (com a qualidade ruim)', () => {
    expect(takePatty(withPatty(createPatty()), 0).session.held).toEqual([{ id: 'patty', quality: 'raw' }])
    expect(takePatty(withPatty(both(12, 8)), 0).session.held).toEqual([{ id: 'patty', quality: 'overdone' }])
  })

  it('carne queimada vai para o lixo, não para o prato', () => {
    const r = takePatty(withPatty(both(patty.burnt, 5)), 0)
    expect(r.session.grill[0]).toBeNull()
    expect(r.session.held).toEqual([])
    expect(r.events[0]).toEqual({ type: 'pattyTrashed', slot: 0 })
  })

  it('prato cheio não deixa tirar carne boa, mas ainda deixa jogar a queimada fora', () => {
    const full = {
      ...withPatty(both(8, 8)),
      held: Array.from({ length: GRILL.heldCapacity }, () => ({ id: 'patty' as const, quality: 'perfect' as const })),
    }
    expect(takePatty(full, 0).session).toBe(full)
    const burnt = { ...full, grill: [both(20, 0), null] }
    expect(takePatty(burnt, 0).session.grill[0]).toBeNull()
  })

  it('a proteína do prato entra no lanche com o ponto registrado (e o tipo certo)', () => {
    const base: SessionState = {
      ...testSession(),
      burger: ['bunBottom'],
      held: [
        { id: 'patty', quality: 'raw' },
        { id: 'chicken', quality: 'perfect' },
      ],
    }
    const r = addPattyToBurger(base, 1)
    expect(r.session.burger).toEqual(['bunBottom', 'chicken'])
    expect(r.session.burgerPatties).toEqual(['perfect'])
    expect(r.session.held).toEqual([{ id: 'patty', quality: 'raw' }])
  })

  it('não põe proteína no lanche sem o pão de baixo ou sem nada no prato', () => {
    const s: SessionState = { ...testSession(), held: [{ id: 'patty', quality: 'perfect' }] }
    expect(addPattyToBurger(s, 0).session).toBe(s)
    const noHeld: SessionState = { ...testSession(), burger: ['bunBottom'] }
    expect(addPattyToBurger(noHeld, 0).session).toBe(noHeld)
  })
})
