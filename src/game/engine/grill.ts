import { GRILL, INGREDIENT_STOCK } from '../config'
import { hasStock, useStock } from './stock'
import type { ActionResult, GrillPatty, PattyQuality, PattyStage, SessionState } from './types'

export function createPatty(): GrillPatty {
  return { sides: [0, 0], down: 0, flips: 0 }
}

/** Cozinha o lado que está na chapa. */
export function cookPatty(patty: GrillPatty, dt: number): GrillPatty {
  const sides: [number, number] = [patty.sides[0], patty.sides[1]]
  sides[patty.down] += dt
  return { ...patty, sides }
}

/** Crua até os dois lados ficarem no ponto; passa e queima pelo lado mais cozido. */
export function pattyStage(patty: GrillPatty): PattyStage {
  const hot = Math.max(patty.sides[0], patty.sides[1])
  const cool = Math.min(patty.sides[0], patty.sides[1])
  if (hot >= GRILL.sideBurntSeconds) return 'burnt'
  if (hot >= GRILL.sideOverdoneSeconds) return 'overdone'
  if (cool >= GRILL.sideDoneSeconds) return 'perfect'
  return 'raw'
}

export type PattyHint = 'flip' | 'take' | 'overdone' | 'burnt' | null

/** O que a interface deve sugerir ao jogador sobre esta carne. */
export function pattyHint(patty: GrillPatty): PattyHint {
  const stage = pattyStage(patty)
  if (stage === 'burnt') return 'burnt'
  if (stage === 'overdone') return 'overdone'
  if (stage === 'perfect') return 'take'
  const down = patty.sides[patty.down]
  const up = patty.sides[patty.down === 0 ? 1 : 0]
  if (down >= GRILL.sideDoneSeconds * GRILL.flipHintRatio && up < GRILL.sideDoneSeconds) return 'flip'
  return null
}

/** Põe uma carne crua na chapa (gasta 1 carne do estoque). */
export function placeRawPatty(session: SessionState, slot: number): ActionResult {
  const stockId = INGREDIENT_STOCK.patty!
  if (session.ended || slot < 0 || slot >= session.grill.length || session.grill[slot] || !hasStock(session.stock, stockId)) {
    return { session, events: [] }
  }
  const grill = [...session.grill]
  grill[slot] = createPatty()
  return { session: { ...session, grill, stock: useStock(session.stock, stockId) }, events: [{ type: 'pattyPlaced', slot }] }
}

/** Vira a carne: o lado de cima vai para a chapa. Pode virar quantas vezes quiser. */
export function flipPatty(session: SessionState, slot: number): ActionResult {
  const patty = session.grill[slot]
  if (session.ended || !patty) return { session, events: [] }
  const grill = [...session.grill]
  grill[slot] = { ...patty, down: patty.down === 0 ? 1 : 0, flips: patty.flips + 1 }
  return { session: { ...session, grill }, events: [{ type: 'pattyFlipped', slot }] }
}

/** Tira a carne da chapa: queimada vai para o lixo; as outras vão para o prato (se houver espaço). */
export function takePatty(session: SessionState, slot: number): ActionResult {
  const patty = session.grill[slot]
  if (session.ended || !patty) return { session, events: [] }
  const stage = pattyStage(patty)
  const grill = [...session.grill]
  if (stage === 'burnt') {
    grill[slot] = null
    return { session: { ...session, grill }, events: [{ type: 'pattyTrashed', slot }] }
  }
  if (session.held.length >= GRILL.heldCapacity) return { session, events: [] }
  grill[slot] = null
  const quality: PattyQuality = stage
  return {
    session: { ...session, grill, held: [...session.held, quality] },
    events: [{ type: 'pattyTaken', slot, quality }],
  }
}
