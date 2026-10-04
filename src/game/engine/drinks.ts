import { DRINKS, type CupSize } from '../config'
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

/** Escolhe um copo vazio e o coloca sob a máquina (troca o copo atual, se houver). */
export function chooseCup(session: SessionState, size: CupSize): ActionResult {
  if (session.ended) return { session, events: [] }
  return { session: { ...session, cup: { size, fill: 0 }, pouring: false }, events: [] }
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
  return { session: { ...session, cup: null, pouring: false }, events: [] }
}
