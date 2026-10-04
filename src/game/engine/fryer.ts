import { FRIES_STOCK_UNITS, FRYER } from '../config'
import { hasStock, useStock } from './stock'
import type { ActionResult, FriesQuality, FriesStage, SessionState, TrayItem } from './types'

export function friesStage(cook: number): FriesStage {
  if (cook >= FRYER.burntSeconds) return 'burnt'
  if (cook >= FRYER.readySeconds) return 'ready'
  return 'cooking'
}

export function friesQuality(age: number): FriesQuality {
  return age >= FRYER.staleSeconds ? 'stale' : 'fresh'
}

/** Põe uma porção no cesto (gasta batata do estoque). */
export function placeFries(session: SessionState, basket: number): ActionResult {
  if (
    session.ended ||
    basket < 0 ||
    basket >= session.fryer.length ||
    session.fryer[basket] ||
    !hasStock(session.stock, 'potato', FRIES_STOCK_UNITS)
  ) {
    return { session, events: [] }
  }
  const fryer = [...session.fryer]
  fryer[basket] = { cook: 0 }
  return {
    session: { ...session, fryer, stock: useStock(session.stock, 'potato', FRIES_STOCK_UNITS) },
    events: [{ type: 'friesPlaced', basket }],
  }
}

/** Pronta vai para a estufa (se houver espaço); queimada vai para o lixo; ainda fritando não sai. */
export function takeFries(session: SessionState, basket: number): ActionResult {
  const b = session.fryer[basket]
  if (session.ended || !b) return { session, events: [] }
  const stage = friesStage(b.cook)
  if (stage === 'cooking') return { session, events: [] }
  const fryer = [...session.fryer]
  if (stage === 'burnt') {
    fryer[basket] = null
    return { session: { ...session, fryer }, events: [{ type: 'friesTrashed', basket }] }
  }
  if (session.warmer.length >= FRYER.warmerCapacity) return { session, events: [] }
  fryer[basket] = null
  return {
    session: { ...session, fryer, warmer: [...session.warmer, { age: 0 }] },
    events: [{ type: 'friesTaken', basket }],
  }
}

/** Passa uma porção da estufa para a bandeja. */
export function friesToTray(session: SessionState, warmerIndex: number): ActionResult {
  const portion = session.warmer[warmerIndex]
  if (session.ended || !portion || session.tray.fries) return { session, events: [] }
  const item: TrayItem = 'fries'
  return {
    session: {
      ...session,
      warmer: session.warmer.filter((_, i) => i !== warmerIndex),
      tray: { ...session.tray, fries: { quality: friesQuality(portion.age) } },
    },
    events: [{ type: 'trayPlaced', item }],
  }
}
