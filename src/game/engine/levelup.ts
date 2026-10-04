
import { unlockGifts } from './stock'
import { fryerBasketCount, grillSlotCount, unlocksBetween, type UnlockEntry } from './unlocks'
import type { SessionState } from './types'


/** Sobe o nível da sessão: libera vagas na chapa/fritadeira e dá estoque de presente dos itens novos. */
export function applyLevelUp(session: SessionState, from: number, to: number): { session: SessionState; unlocks: UnlockEntry[] } {
  const grill = [...session.grill]
  while (grill.length < grillSlotCount(to)) grill.push(null)
  const fryer = [...session.fryer]
  while (fryer.length < fryerBasketCount(to)) fryer.push(null)
  return {
    session: { ...session, level: to, grill, fryer, stock: unlockGifts(session.stock, from, to) },
    unlocks: unlocksBetween(from, to),
  }
}
