import { describe, expect, it } from 'vitest'
import { COOKABLES, SHELF_CAPACITY, SIDE_IDS, TRAY, WARMER_CAPACITY } from '../config'
import { cookStage, placeCookable, storedQuality, storedToTray, takeCookable } from './cookers'
import { createSession } from './session'
import { filledStock } from './stock'
import { step } from './tick'
import { testPerks, testPlayer, testSession } from './testing'
import type { SessionState, Station } from './types'

const player = () => testPlayer()
const base = (): SessionState => ({ ...testSession(), spawnTimer: 999 })

function run(s: SessionState, seconds: number) {
  let session = s
  let pl = player()
  const events = []
  for (let t = 0; t < seconds; t += 0.05) {
    const r = step(session, pl, 0.05)
    session = r.session
    pl = r.player
    events.push(...r.events)
  }
  return { session, events }
}

const fries = COOKABLES.fries

describe('fritadeira e forno', () => {
  it('cada item vai de "cozinhando" a "pronto" e depois queima', () => {
    expect(cookStage('fries', 0)).toBe('cooking')
    expect(cookStage('fries', fries.readySeconds)).toBe('ready')
    expect(cookStage('fries', fries.burntSeconds)).toBe('burnt')
    expect(cookStage('nuggets', COOKABLES.nuggets.readySeconds - 0.1)).toBe('cooking')
    expect(cookStage('brownie', COOKABLES.brownie.readySeconds)).toBe('ready')
  })

  it('a janela de ponto de todo item dá tempo de reagir', () => {
    for (const c of Object.values(COOKABLES)) expect(c.burntSeconds - c.readySeconds, c.name).toBeGreaterThanOrEqual(3)
  })

  it('começa com 2 cestos (mais cestos vêm da loja) e o forno aparece com os brownies, pelo nível', () => {
    expect(createSession(1).fryer).toHaveLength(2)
    expect(createSession(1, { level: 50 }).fryer).toHaveLength(2)
    expect(createSession(1, { perks: testPerks({ fryerBaskets: 4 }) }).fryer).toHaveLength(4)
    expect(createSession(1, { level: 11 }).oven).toHaveLength(0)
    expect(createSession(1, { level: 12 }).oven).toHaveLength(2)
  })

  it('só coloca em vaga vazia, no lugar certo, e gasta estoque', () => {
    const placed = placeCookable(base(), 'fryer', 0, 'fries')
    expect(placed.session.fryer[0]).toEqual({ kind: 'fries', cook: 0 })
    expect(placed.session.stock.potato).toBe(98)
    expect(placeCookable(placed.session, 'fryer', 0, 'fries').session).toBe(placed.session)
    expect(placeCookable(base(), 'fryer', 9, 'fries').events).toEqual([])
    // brownie não vai na fritadeira, nem batata no forno
    expect(placeCookable(base(), 'fryer', 0, 'brownie').session).toEqual(base())
    expect(placeCookable(base(), 'oven', 0, 'fries').session).toEqual(base())
  })

  it('o item composto gasta todo o estoque dele (batata com cheddar e bacon)', () => {
    const s = placeCookable(base(), 'fryer', 0, 'loaded').session
    expect(s.stock.potato).toBe(98)
    expect(s.stock.cheddar).toBe(98)
    expect(s.stock.bacon).toBe(98)
    const noBacon = testSession(1, { stock: { ...filledStock(9), bacon: 0 } })
    expect(placeCookable(noBacon, 'fryer', 0, 'loaded').session).toBe(noBacon)
  })

  it('sem estoque ou antes do nível, não coloca', () => {
    const empty = testSession(1, { stock: filledStock(0) })
    expect(placeCookable(empty, 'fryer', 0, 'fries').session).toBe(empty)
    const early = testSession(1, { level: 1 })
    expect(placeCookable(early, 'fryer', 0, 'nuggets').session).toBe(early)
  })

  it('avisa quando fica pronto e quando queima (uma vez cada)', () => {
    const { events } = run(placeCookable(base(), 'fryer', 0, 'fries').session, fries.burntSeconds + 1)
    expect(events.filter((e) => e.type === 'cookReady')).toHaveLength(1)
    expect(events.filter((e) => e.type === 'cookBurnt')).toHaveLength(1)
  })

  it('ainda cozinhando não dá para tirar', () => {
    const s = run(placeCookable(base(), 'fryer', 0, 'fries').session, 2).session
    expect(takeCookable(s, 'fryer', 0).session).toBe(s)
  })

  it('pronto vai para a estufa (fritadeira) ou para a vitrine (forno)', () => {
    const s = run(placeCookable(base(), 'fryer', 0, 'rustic').session, COOKABLES.rustic.readySeconds + 0.5).session
    const r = takeCookable(s, 'fryer', 0)
    expect(r.session.fryer[0]).toBeNull()
    expect(r.session.warmer).toEqual([{ kind: 'rustic', age: 0 }])
    const o = run(placeCookable(base(), 'oven', 0, 'brownie').session, COOKABLES.brownie.readySeconds + 0.5).session
    expect(takeCookable(o, 'oven', 0).session.shelf).toEqual([{ kind: 'brownie', age: 0 }])
  })

  it('queimado vai para o lixo, não para a estufa', () => {
    const s = run(placeCookable(base(), 'fryer', 0, 'fries').session, fries.burntSeconds + 0.5).session
    const r = takeCookable(s, 'fryer', 0)
    expect(r.session.warmer).toEqual([])
    expect(r.events[0]).toEqual({ type: 'cookTrashed', station: 'fryer', index: 0 })
  })

  it('estufa e vitrine cheias não aceitam mais porções', () => {
    const s = run(placeCookable(base(), 'fryer', 0, 'fries').session, fries.readySeconds + 0.5).session
    const full = { ...s, warmer: Array.from({ length: WARMER_CAPACITY }, () => ({ kind: 'fries' as const, age: 0 })) }
    expect(takeCookable(full, 'fryer', 0).session).toBe(full)
    const o = run(placeCookable(base(), 'oven', 0, 'brownie').session, COOKABLES.brownie.readySeconds + 0.5).session
    const fullShelf = { ...o, shelf: Array.from({ length: SHELF_CAPACITY }, () => ({ kind: 'brownie' as const, age: 0 })) }
    expect(takeCookable(fullShelf, 'oven', 0).session).toBe(fullShelf)
  })

  it('o acompanhamento na estufa murcha com o tempo; o brownie não', () => {
    expect(storedQuality('fries', 0)).toBe('fresh')
    expect(storedQuality('fries', COOKABLES.fries.staleSeconds!)).toBe('stale')
    expect(storedQuality('brownie', 9999)).toBe('fresh')
    const s: SessionState = { ...base(), warmer: [{ kind: 'fries', age: 0 }], shelf: [{ kind: 'brownie', age: 0 }] }
    const after = run(s, 2).session
    expect(after.warmer[0]!.age).toBeCloseTo(2, 0)
    expect(after.shelf[0]!.age).toBeCloseTo(2, 0)
  })

  it('passa da estufa para a bandeja com o tipo e a qualidade, respeitando a capacidade', () => {
    const s: SessionState = { ...base(), warmer: [{ kind: 'rings', age: 0 }, { kind: 'fries', age: COOKABLES.fries.staleSeconds! + 1 }] }
    const first = storedToTray(s, 'fryer', 1)
    expect(first.session.tray.sides).toEqual([{ id: 'fries', quality: 'stale' }])
    expect(first.session.warmer).toHaveLength(1)
    const full = { ...first.session, tray: { ...first.session.tray, sides: Array.from({ length: TRAY.sides }, () => ({ id: 'fries' as const, quality: 'fresh' as const })) } }
    expect(storedToTray(full, 'fryer', 0).session).toBe(full)
  })

  it('da vitrine, o brownie vai para as sobremesas da bandeja', () => {
    const s: SessionState = { ...base(), shelf: [{ kind: 'brownie', age: 0 }] }
    const r = storedToTray(s, 'oven', 0)
    expect(r.session.tray.desserts).toEqual([{ id: 'brownie' }])
    expect(r.session.shelf).toEqual([])
  })

  it('há um acompanhamento para cada cookable da fritadeira', () => {
    for (const id of SIDE_IDS) expect(COOKABLES[id].station).toBe('fryer')
    expect((['fryer', 'oven'] as Station[]).length).toBe(2)
  })
})
