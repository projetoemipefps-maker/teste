import { COOKABLES, SHELF_CAPACITY, TRAY, type CookableId, type SideId } from '../config'
import { hasStockFor, useStockFor } from './stock'
import type { ActionResult, CookerItem, CookStage, SessionState, Station, StoredItem, StoredQuality } from './types'

/** Onde cada estação guarda o que está cozinhando e o que já está pronto. */
const KEYS = {
  fryer: { cooking: 'fryer', stored: 'warmer' },
  oven: { cooking: 'oven', stored: 'shelf' },
} as const

/** Quantas porções cabem na estufa (melhoria "Estufa maior") ou na vitrine de brownies. */
export const storedCapacity = (session: SessionState, station: Station): number =>
  station === 'fryer' ? session.perks.warmerSize : SHELF_CAPACITY

export function cookStage(kind: CookableId, cook: number): CookStage {
  const c = COOKABLES[kind]
  if (cook >= c.burntSeconds) return 'burnt'
  if (cook >= c.readySeconds) return 'ready'
  return 'cooking'
}

/** Guardado há muito tempo murcha (só quem tem `staleSeconds`). */
export function storedQuality(kind: CookableId, age: number): StoredQuality {
  const limit = COOKABLES[kind].staleSeconds
  return limit !== null && age >= limit ? 'stale' : 'fresh'
}

/** Põe uma porção para cozinhar na estação (gasta o estoque dela). */
export function placeCookable(session: SessionState, station: Station, index: number, kind: CookableId): ActionResult {
  const cfg = COOKABLES[kind]
  const cookers = session[KEYS[station].cooking]
  if (
    session.ended ||
    cfg.station !== station ||
    index < 0 ||
    index >= cookers.length ||
    cookers[index] ||
    cfg.unlockLevel > session.level ||
    !hasStockFor(session.stock, cfg.stock)
  ) {
    return { session, events: [] }
  }
  const next = [...cookers]
  next[index] = { kind, cook: 0 }
  return {
    session: { ...session, [KEYS[station].cooking]: next, stock: useStockFor(session.stock, cfg.stock) },
    events: [{ type: 'cookPlaced', station, index }],
  }
}

/** Pronta vai para a estufa/vitrine (se houver espaço); queimada vai para o lixo; ainda cozinhando não sai. */
export function takeCookable(session: SessionState, station: Station, index: number): ActionResult {
  const keys = KEYS[station]
  const item: CookerItem | null | undefined = session[keys.cooking][index]
  if (session.ended || !item) return { session, events: [] }
  const stage = cookStage(item.kind, item.cook)
  if (stage === 'cooking') return { session, events: [] }
  const cookers = [...session[keys.cooking]]
  if (stage === 'burnt') {
    cookers[index] = null
    return { session: { ...session, [keys.cooking]: cookers }, events: [{ type: 'cookTrashed', station, index }] }
  }
  if (session[keys.stored].length >= storedCapacity(session, station)) return { session, events: [] }
  cookers[index] = null
  const stored: StoredItem = { kind: item.kind, age: 0 }
  return {
    session: { ...session, [keys.cooking]: cookers, [keys.stored]: [...session[keys.stored], stored] },
    events: [{ type: 'cookTaken', station, index }],
  }
}

/** Passa uma porção da estufa (acompanhamento) ou da vitrine (brownie) para a bandeja, se couber. */
export function storedToTray(session: SessionState, station: Station, index: number): ActionResult {
  const keys = KEYS[station]
  const portion = session[keys.stored][index]
  if (session.ended || !portion) return { session, events: [] }
  const remaining = session[keys.stored].filter((_, i) => i !== index)
  if (station === 'fryer') {
    if (session.tray.sides.length >= TRAY.sides) return { session, events: [] }
    const side = { id: portion.kind as SideId, quality: storedQuality(portion.kind, portion.age) }
    return {
      session: { ...session, warmer: remaining, tray: { ...session.tray, sides: [...session.tray.sides, side] } },
      events: [{ type: 'trayPlaced', category: 'sides' }],
    }
  }
  if (session.tray.desserts.length >= TRAY.desserts) return { session, events: [] }
  return {
    session: { ...session, shelf: remaining, tray: { ...session.tray, desserts: [...session.tray.desserts, { id: 'brownie' }] } },
    events: [{ type: 'trayPlaced', category: 'desserts' }],
  }
}
