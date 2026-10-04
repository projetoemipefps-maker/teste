import { CUSTOMERS } from '../config'
import { addIngredient } from './burger'
import type { GameEvent, SessionState } from './types'
import type { IngredientId } from '../config'

export function createSession(seed: number): SessionState {
  return {
    slots: Array.from({ length: CUSTOMERS.maxSlots }, () => null),
    burger: [],
    selectedSlot: null,
    elapsed: 0,
    spawnTimer: CUSTOMERS.firstSpawnDelay,
    nextCustomerId: 1,
    rngState: seed >>> 0,
    ended: false,
    stats: { served: 0, wrong: 0, lost: 0, earned: 0 },
  }
}

/** Clicar no cliente seleciona o pedido; clicar de novo desmarca. Só clientes esperando podem ser selecionados. */
export function selectSlot(session: SessionState, slot: number): SessionState {
  const customer = session.slots[slot]
  if (!customer || customer.status !== 'waiting') return session
  return { ...session, selectedSlot: session.selectedSlot === slot ? null : slot }
}

export function addToBurger(
  session: SessionState,
  ingredient: IngredientId,
): { session: SessionState; events: GameEvent[] } {
  if (session.ended) return { session, events: [] }
  const burger = addIngredient(session.burger, ingredient)
  if (burger === session.burger) return { session, events: [] }
  return {
    session: { ...session, burger: [...burger] },
    events: [{ type: 'ingredientAdded', ingredient }],
  }
}

export function discardBurger(session: SessionState): { session: SessionState; events: GameEvent[] } {
  if (session.burger.length === 0) return { session, events: [] }
  return { session: { ...session, burger: [] }, events: [{ type: 'burgerDiscarded' }] }
}
