import { DRINKS, DRINK_AUTO_STOP_RATIO, DRINK_CONFIG, TRAY, type CupSize, type DrinkKind } from '../config'
import { hasStock, refundStock, useStock } from './stock'
import type { Perks } from './upgrades'
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

export const drinkUnits = (size: CupSize): number => DRINKS.cups[size].units

/** Estoque depois de devolver o copo atual, se ainda estiver vazio (nada foi servido). */
function stockAfterRefund(session: SessionState) {
  const { cup } = session
  return cup && cup.fill === 0
    ? refundStock(session.stock, DRINK_CONFIG[cup.kind].stock, drinkUnits(cup.size))
    : session.stock
}

/** Dá para pôr um copo deste tipo e tamanho (liberado, com estoque — contando o que volta se o copo atual estiver vazio)? */
export function canChooseCup(session: SessionState, kind: DrinkKind, size: CupSize): boolean {
  const cfg = DRINK_CONFIG[kind]
  return !session.ended && cfg.unlockLevel <= session.level && hasStock(stockAfterRefund(session), cfg.stock, drinkUnits(size))
}

/**
 * Escolhe um copo vazio e o coloca sob a máquina, gastando a bebida do estoque.
 * Trocar um copo ainda vazio devolve o que ele gastou; trocar um copo já servido desperdiça.
 */
export function chooseCup(session: SessionState, kind: DrinkKind, size: CupSize): ActionResult {
  if (session.cup && session.cup.kind === kind && session.cup.size === size && session.cup.fill === 0) {
    return { session, events: [] }
  }
  if (!canChooseCup(session, kind, size)) return { session, events: [] }
  const available = stockAfterRefund(session)
  return {
    session: {
      ...session,
      cup: { kind, size, fill: 0 },
      pouring: false,
      stock: useStock(available, DRINK_CONFIG[kind].stock, drinkUnits(size)),
    },
    events: [],
  }
}

export function setPouring(session: SessionState, pouring: boolean): SessionState {
  const value = pouring && session.cup !== null && !session.ended
  return value === session.pouring ? session : { ...session, pouring: value }
}

export interface PourResult {
  cup: Cup
  /** Começou a derramar neste instante. */
  startedSpilling: boolean
  /** Máquina automática: o copo chegou ao ponto certo e ela parou. */
  finished: boolean
}

/**
 * Enche o copo enquanto o botão está pressionado. Com a melhoria de enchimento automático, a máquina para sozinha
 * no ponto certo (copo cheio, sem derramar) e pode encher mais rápido.
 */
export function pourCup(cup: Cup, dt: number, perks?: Pick<Perks, 'drinkAuto' | 'drinkSpeed'>): PourResult {
  const capacity = cupCapacity(cup.size)
  const rate = DRINK_CONFIG[cup.kind].fillRate * (perks?.drinkSpeed ?? 1)
  if (perks?.drinkAuto) {
    const stopAt = capacity * DRINK_AUTO_STOP_RATIO
    const fill = Math.min(cup.fill + rate * dt, Math.max(cup.fill, stopAt))
    return { cup: { ...cup, fill }, startedSpilling: false, finished: fill >= stopAt }
  }
  const fill = Math.min(cup.fill + rate * dt, capacity * DRINKS.overflowCapRatio)
  return { cup: { ...cup, fill }, startedSpilling: cup.fill <= capacity && fill > capacity, finished: false }
}

export function cupToTray(session: SessionState): ActionResult {
  const { cup } = session
  if (session.ended || !cup || cup.fill <= 0 || session.tray.drinks.length >= TRAY.drinks) return { session, events: [] }
  return {
    session: {
      ...session,
      cup: null,
      pouring: false,
      tray: { ...session.tray, drinks: [...session.tray.drinks, { kind: cup.kind, size: cup.size, quality: cupQuality(cup) }] },
    },
    events: [{ type: 'trayPlaced', category: 'drinks' }],
  }
}

export function discardCup(session: SessionState): ActionResult {
  if (!session.cup) return { session, events: [] }
  return { session: { ...session, cup: null, pouring: false, stock: stockAfterRefund(session) }, events: [] }
}
