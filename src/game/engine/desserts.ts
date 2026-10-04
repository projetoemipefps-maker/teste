import { DESSERTS, TRAY } from '../config'
import { hasStockFor, useStockFor } from './stock'
import type { ActionResult, SessionState } from './types'

/** Serve uma bola de sorvete direto na bandeja (gasta sorvete do estoque). */
export function scoopIceCream(session: SessionState): ActionResult {
  const cfg = DESSERTS.iceCream
  if (
    session.ended ||
    cfg.unlockLevel > session.level ||
    session.tray.desserts.length >= TRAY.desserts ||
    !hasStockFor(session.stock, cfg.stock)
  ) {
    return { session, events: [] }
  }
  return {
    session: {
      ...session,
      stock: useStockFor(session.stock, cfg.stock),
      tray: { ...session.tray, desserts: [...session.tray.desserts, { id: 'iceCream' }] },
    },
    events: [{ type: 'trayPlaced', category: 'desserts' }],
  }
}
