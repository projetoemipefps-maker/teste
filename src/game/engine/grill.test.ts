import { describe, expect, it } from 'vitest'
import { GRILL } from '../config'
import { addPattyToBurger, createSession } from './session'
import { cookPatty, createPatty, flipPatty, pattyHint, pattyStage, placeRawPatty, takePatty } from './grill'
import type { GrillPatty, SessionState } from './types'

const cookSide = (p: GrillPatty, seconds: number) => cookPatty(p, seconds)
const withPatty = (patty: GrillPatty, slot = 0): SessionState => {
  const s = createSession(1)
  const grill = [...s.grill]
  grill[slot] = patty
  return { ...s, grill }
}

describe('chapa', () => {
  it('começa com 2 espaços vazios', () => {
    expect(GRILL.slots).toBe(2)
    expect(createSession(1).grill).toEqual([null, null])
  })

  it('coloca carne crua num espaço vazio, mas não num ocupado', () => {
    const placed = placeRawPatty(createSession(1), 0)
    expect(placed.session.grill[0]).toEqual(createPatty())
    expect(placed.events).toEqual([{ type: 'pattyPlaced', slot: 0 }])
    expect(placeRawPatty(placed.session, 0).session).toBe(placed.session)
    expect(placeRawPatty(createSession(1), 5).events).toEqual([])
  })

  it('só cozinha o lado que está na chapa', () => {
    const p = cookSide(createPatty(), 3)
    expect(p.sides).toEqual([3, 0])
    expect(cookSide({ ...p, down: 1 }, 2).sides).toEqual([3, 2])
  })

  it('crua → no ponto → passada → queimada, nessa ordem', () => {
    const both = (a: number, b: number): GrillPatty => ({ sides: [a, b], down: 0, flips: 1 })
    expect(pattyStage(createPatty())).toBe('raw')
    expect(pattyStage(both(GRILL.sideDoneSeconds, 0))).toBe('raw') // um lado só
    expect(pattyStage(both(GRILL.sideDoneSeconds, GRILL.sideDoneSeconds))).toBe('perfect')
    expect(pattyStage(both(GRILL.sideOverdoneSeconds, GRILL.sideDoneSeconds))).toBe('overdone')
    expect(pattyStage(both(GRILL.sideBurntSeconds, GRILL.sideDoneSeconds))).toBe('burnt')
  })

  it('sem virar, o lado de baixo queima e a carne nunca fica no ponto', () => {
    let p = createPatty()
    const seen = new Set<string>()
    for (let t = 0; t < GRILL.sideBurntSeconds + 1; t += 0.1) {
      p = cookPatty(p, 0.1)
      seen.add(pattyStage(p))
    }
    expect(seen.has('perfect')).toBe(false)
    expect(pattyStage(p)).toBe('burnt')
  })

  it('virando na metade a carne fica no ponto', () => {
    let s = placeRawPatty(createSession(1), 0).session
    const cook = (sec: number) => {
      s = { ...s, grill: s.grill.map((p) => (p ? cookPatty(p, sec) : p)) }
    }
    cook(GRILL.sideDoneSeconds)
    s = flipPatty(s, 0).session
    cook(GRILL.sideDoneSeconds)
    expect(pattyStage(s.grill[0]!)).toBe('perfect')
    expect(s.grill[0]!.flips).toBe(1)
  })

  it('virar sem carne não faz nada', () => {
    const s = createSession(1)
    expect(flipPatty(s, 0)).toEqual({ session: s, events: [] })
  })

  it('avisa para virar quando o lado de baixo está quase no ponto e o outro cru', () => {
    expect(pattyHint(createPatty())).toBeNull()
    expect(pattyHint(cookSide(createPatty(), GRILL.sideDoneSeconds))).toBe('flip')
    const flipped: GrillPatty = { sides: [GRILL.sideDoneSeconds, 1], down: 1, flips: 1 }
    expect(pattyHint(flipped)).toBeNull()
    expect(pattyHint({ sides: [GRILL.sideDoneSeconds, GRILL.sideDoneSeconds], down: 1, flips: 1 })).toBe('take')
    expect(pattyHint({ sides: [GRILL.sideOverdoneSeconds, 8], down: 1, flips: 1 })).toBe('overdone')
    expect(pattyHint({ sides: [GRILL.sideBurntSeconds, 8], down: 1, flips: 1 })).toBe('burnt')
  })

  it('tirar uma carne no ponto manda para o prato com a qualidade certa', () => {
    const s = withPatty({ sides: [8, 8], down: 0, flips: 1 })
    const r = takePatty(s, 0)
    expect(r.session.grill[0]).toBeNull()
    expect(r.session.held).toEqual(['perfect'])
    expect(r.events[0]).toMatchObject({ type: 'pattyTaken', quality: 'perfect' })
  })

  it('carne crua ou passada também vai para o prato (com a qualidade ruim)', () => {
    expect(takePatty(withPatty(createPatty()), 0).session.held).toEqual(['raw'])
    expect(takePatty(withPatty({ sides: [12, 8], down: 0, flips: 1 }), 0).session.held).toEqual(['overdone'])
  })

  it('carne queimada vai para o lixo, não para o prato', () => {
    const r = takePatty(withPatty({ sides: [GRILL.sideBurntSeconds, 5], down: 0, flips: 0 }), 0)
    expect(r.session.grill[0]).toBeNull()
    expect(r.session.held).toEqual([])
    expect(r.events[0]).toEqual({ type: 'pattyTrashed', slot: 0 })
  })

  it('prato cheio não deixa tirar carne boa, mas ainda deixa jogar a queimada fora', () => {
    const full = { ...withPatty({ sides: [8, 8], down: 0, flips: 1 }), held: Array(GRILL.heldCapacity).fill('perfect') }
    expect(takePatty(full, 0).session).toBe(full)
    const burnt = { ...full, grill: [{ sides: [20, 0], down: 0, flips: 0 } as GrillPatty, null] }
    expect(takePatty(burnt, 0).session.grill[0]).toBeNull()
  })

  it('a carne do prato entra no lanche com o ponto registrado', () => {
    const base = { ...createSession(1), burger: ['bunBottom' as const], held: ['raw' as const, 'perfect' as const] }
    const r = addPattyToBurger(base, 1)
    expect(r.session.burger).toEqual(['bunBottom', 'patty'])
    expect(r.session.burgerPatties).toEqual(['perfect'])
    expect(r.session.held).toEqual(['raw'])
  })

  it('não põe carne no lanche sem o pão de baixo ou sem carne no prato', () => {
    const s = { ...createSession(1), held: ['perfect' as const] }
    expect(addPattyToBurger(s, 0).session).toBe(s)
    const noHeld = { ...createSession(1), burger: ['bunBottom' as const] }
    expect(addPattyToBurger(noHeld, 0).session).toBe(noHeld)
  })
})
