import { unlockGifts } from './stock'
import { ovenSlotCount, unlocksBetween, type UnlockEntry } from './unlocks'
import type { SessionState } from './types'

/** Sobe o nível da sessão: libera as vagas do forno e dá estoque de presente dos itens novos. */
export function applyLevelUp(session: SessionState, from: number, to: number): { session: SessionState; unlocks: UnlockEntry[] } {
  const oven = [...session.oven]
  while (oven.length < ovenSlotCount(to)) oven.push(null)
  return {
    session: { ...session, level: to, oven, stock: unlockGifts(session.stock, from, to) },
    unlocks: unlocksBetween(from, to),
  }
}
