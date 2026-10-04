import { describe, expect, it } from 'vitest'
import { FRYER } from '../config'
import { createSession } from './session'
import { friesQuality, friesStage, friesToTray, placeFries, takeFries } from './fryer'
import { step } from './tick'
import { testPlayer } from './testing'
import type { PlayerState, SessionState } from './types'

const player = (): PlayerState => testPlayer()
const base = (): SessionState => ({ ...createSession(1), spawnTimer: 999 })

function fry(s: SessionState, seconds: number) {
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

describe('fritadeira', () => {
  it('coloca a porção, espera ficar pronta e depois queima', () => {
    expect(friesStage(0)).toBe('cooking')
    expect(friesStage(FRYER.readySeconds)).toBe('ready')
    expect(friesStage(FRYER.burntSeconds)).toBe('burnt')
  })

  it('só coloca em cesto vazio', () => {
    const placed = placeFries(base(), 0)
    expect(placed.session.fryer[0]).toEqual({ cook: 0 })
    expect(placeFries(placed.session, 0).session).toBe(placed.session)
    expect(placeFries(base(), 9).events).toEqual([])
  })

  it('avisa quando a batata fica pronta e quando queima', () => {
    const { events } = fry(placeFries(base(), 0).session, FRYER.burntSeconds + 1)
    expect(events.filter((e) => e.type === 'friesReady')).toHaveLength(1)
    expect(events.filter((e) => e.type === 'friesBurnt')).toHaveLength(1)
  })

  it('ainda fritando não dá para tirar', () => {
    const s = fry(placeFries(base(), 0).session, 2).session
    expect(takeFries(s, 0).session).toBe(s)
  })

  it('pronta vai para a estufa', () => {
    const s = fry(placeFries(base(), 0).session, FRYER.readySeconds + 0.5).session
    const r = takeFries(s, 0)
    expect(r.session.fryer[0]).toBeNull()
    expect(r.session.warmer).toEqual([{ age: 0 }])
  })

  it('queimada vai para o lixo, não para a estufa', () => {
    const s = fry(placeFries(base(), 0).session, FRYER.burntSeconds + 0.5).session
    const r = takeFries(s, 0)
    expect(r.session.warmer).toEqual([])
    expect(r.events[0]).toEqual({ type: 'friesTrashed', basket: 0 })
  })

  it('estufa cheia não aceita mais porções', () => {
    const s = fry(placeFries(base(), 0).session, FRYER.readySeconds + 0.5).session
    const full = { ...s, warmer: Array.from({ length: FRYER.warmerCapacity }, () => ({ age: 0 })) }
    expect(takeFries(full, 0).session).toBe(full)
  })

  it('a porção na estufa envelhece e murcha com o tempo', () => {
    expect(friesQuality(0)).toBe('fresh')
    expect(friesQuality(FRYER.staleSeconds)).toBe('stale')
    const s = { ...base(), warmer: [{ age: 0 }] }
    expect(fry(s, 2).session.warmer[0]!.age).toBeCloseTo(2, 0)
  })

  it('passa a porção da estufa para a bandeja com a qualidade, uma só por vez', () => {
    const s = { ...base(), warmer: [{ age: 0 }, { age: FRYER.staleSeconds + 1 }] }
    const first = friesToTray(s, 1)
    expect(first.session.tray.fries).toEqual({ quality: 'stale' })
    expect(first.session.warmer).toHaveLength(1)
    expect(friesToTray(first.session, 0).session).toBe(first.session) // bandeja já tem batata
  })
})
