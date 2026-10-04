import { DRINKS, type CupSize } from '../config'
import { hasStock, refundStock, useStock } from './stock'
import type { ActionResult, Cup, DrinkQuality, SessionState } from './types'

export function cupCapacity(size: CupSize): number {
  return DRINKS.cups[size].capacity
}

export function cupFillRatio(cup: Cup): number {
  return cup.fill / cupCapacity(cup.size)
}

/** Derramou (passou de 100%), pouco (abaixo do mínimo) ou bom. */
export function cupQuality(cup: Cup): DrinkQuality {
  const ratio = cupFillRatio(cup)
  if (ratio > 1) return 'spilled'
  if (ratio < DRINKS.minFillRatio) return 'low'
  return 'good'
}

export const sodaUnits = (size: CupSize): number => DRINKS.cups[size].sodaUnits

/** Estoque depois de devolver o copo atual, se ainda estiver vazio (nada foi servido). */
function stockAfterRefund(session: SessionState) {
  const { cup } = session
  return cup && cup.fill === 0 ? refundStock(session.stock, 'soda', sodaUnits(cup.size)) : session.stock
}

/** Dá para pôr um copo deste tamanho (há refrigerante, contando o que volta se o copo atual estiver vazio)? */
export function canChooseCup(session: SessionState, size: CupSize): boolean {
  return !session.ended && hasStock(stockAfterRefund(session), 'soda', sodaUnits(size))
}

/**
 * Escolhe um copo vazio e o coloca sob a máquina, gastando refrigerante do estoque.
 * Trocar um copo ainda vazio devolve o refrigerante dele; trocar um copo já servido desperdiça.
 */
export function chooseCup(session: SessionState, size: CupSize): ActionResult {
  if (session.ended || (session.cup?.size === size && session.cup.fill === 0)) return { session, events: [] }
  const available = stockAfterRefund(session)
  if (!hasStock(available, 'soda', sodaUnits(size))) return { session, events: [] }
  return {
    session: { ...session, cup: { size, fill: 0 }, pouring: false, stock: useStock(available, 'soda', sodaUnits(size)) },
    events: [],
  }
}

export function setPouring(session: SessionState, pouring: boolean): SessionState {
  const value = pouring && session.cup !== null && !session.ended
  return value === session.pouring ? session : { ...session, pouring: value }
}

/** Enche o copo enquanto o botão está pressionado. Devolve true no instante em que começa a derramar. */
export function pourCup(cup: Cup, dt: number): { cup: Cup; startedSpilling: boolean } {
  const capacity = cupCapacity(cup.size)
  const fill = Math.min(cup.fill + DRINKS.fillRate * dt, capacity * DRINKS.overflowCapRatio)
  return { cup: { ...cup, fill }, startedSpilling: cup.fill <= capacity && fill > capacity }
}

export function cupToTray(session: SessionState): ActionResult {
  const { cup } = session
  if (session.ended || !cup || cup.fill <= 0 || session.tray.drink) return { session, events: [] }
  return {
    session: {
      ...session,
      cup: null,
      pouring: false,
      tray: { ...session.tray, drink: { size: cup.size, quality: cupQuality(cup) } },
    },
    events: [{ type: 'trayPlaced', item: 'drink' }],
  }
}

export function discardCup(session: SessionState): ActionResult {
  if (!session.cup) return { session, events: [] }
  return { session: { ...session, cup: null, pouring: false, stock: stockAfterRefund(session) }, events: [] }
}
