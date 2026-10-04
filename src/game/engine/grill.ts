import { GRILL, INGREDIENTS, type GrillTimes, type ProteinId } from '../config'
import { hasStock, useStock } from './stock'
import { isIngredientUnlocked } from './unlocks'
import type { Perks } from './upgrades'
import type { ActionResult, GrillPatty, PattyQuality, PattyStage, SessionState } from './types'

export const grillTimes = (kind: ProteinId): GrillTimes => GRILL.kinds[kind]

export function createPatty(kind: ProteinId = 'patty'): GrillPatty {
  return { kind, sides: [0, 0], down: 0, flips: 0 }
}

/** Cozinha o lado que está na chapa. */
export function cookPatty(patty: GrillPatty, dt: number): GrillPatty {
  const sides: [number, number] = [patty.sides[0], patty.sides[1]]
  sides[patty.down] += dt
  return { ...patty, sides }
}

/** Crua até os dois lados ficarem no ponto; passa e queima pelo lado mais cozido. */
export function pattyStage(patty: GrillPatty): PattyStage {
  const t = grillTimes(patty.kind)
  const hot = Math.max(patty.sides[0], patty.sides[1])
  const cool = Math.min(patty.sides[0], patty.sides[1])
  if (hot >= t.burnt) return 'burnt'
  if (hot >= t.overdone) return 'overdone'
  if (cool >= t.done) return 'perfect'
  return 'raw'
}

export type PattyHint = 'flip' | 'take' | 'alarm' | 'overdone' | 'burnt' | null

type AlarmPerks = Pick<Perks, 'grillAlarm' | 'grillSpeed'>

/**
 * Alarme da chapa: toca nos últimos segundos do ponto, antes de a proteína passar. Os segundos do alarme são de relógio;
 * como a chapa mais quente esquenta mais rápido, o aviso é convertido para "segundos de chapa".
 */
export function alarmRinging(patty: GrillPatty, perks: AlarmPerks): boolean {
  if (perks.grillAlarm <= 0 || pattyStage(patty) !== 'perfect') return false
  const t = grillTimes(patty.kind)
  const hot = Math.max(patty.sides[0], patty.sides[1])
  return hot >= t.overdone - perks.grillAlarm * perks.grillSpeed
}

/** O que a interface deve sugerir ao jogador sobre esta proteína. */
export function pattyHint(patty: GrillPatty, perks?: AlarmPerks): PattyHint {
  const stage = pattyStage(patty)
  if (stage === 'burnt') return 'burnt'
  if (stage === 'overdone') return 'overdone'
  if (stage === 'perfect') return perks && alarmRinging(patty, perks) ? 'alarm' : 'take'
  const t = grillTimes(patty.kind)
  const down = patty.sides[patty.down]
  const up = patty.sides[patty.down === 0 ? 1 : 0]
  if (down >= t.done * GRILL.flipHintRatio && up < t.done) return 'flip'
  return null
}

/** Põe uma proteína crua na chapa (gasta 1 do estoque). */
export function placeRawPatty(session: SessionState, slot: number, kind: ProteinId = 'patty'): ActionResult {
  const stockId = INGREDIENTS[kind].stock!
  if (
    session.ended ||
    slot < 0 ||
    slot >= session.grill.length ||
    session.grill[slot] ||
    !isIngredientUnlocked(kind, session.level) ||
    !hasStock(session.stock, stockId)
  ) {
    return { session, events: [] }
  }
  const grill = [...session.grill]
  grill[slot] = createPatty(kind)
  return { session: { ...session, grill, stock: useStock(session.stock, stockId) }, events: [{ type: 'pattyPlaced', slot }] }
}

/** Vira a proteína: o lado de cima vai para a chapa. Pode virar quantas vezes quiser. */
export function flipPatty(session: SessionState, slot: number): ActionResult {
  const patty = session.grill[slot]
  if (session.ended || !patty) return { session, events: [] }
  const grill = [...session.grill]
  grill[slot] = { ...patty, down: patty.down === 0 ? 1 : 0, flips: patty.flips + 1 }
  return { session: { ...session, grill }, events: [{ type: 'pattyFlipped', slot }] }
}

/** Tira da chapa: queimada vai para o lixo; as outras vão para o prato (se houver espaço). */
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
    session: { ...session, grill, held: [...session.held, { id: patty.kind, quality }] },
    events: [{ type: 'pattyTaken', slot, quality }],
  }
}
