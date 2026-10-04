import { patienceFor } from './customers'
import { createSession, type SessionOptions } from './session'
import { filledStock } from './stock'
import { createPlayer } from './player'
import { defaultPrices, orderPriceRatio } from './pricing'
import type { Customer, CustomerLook, CustomerTypeId, OrderItems, PlayerState, SessionState } from './types'

/** Ajudantes só para os testes. */
export const testPlayer = (overrides: Partial<PlayerState> = {}): PlayerState => ({ ...createPlayer(), ...overrides })

export const testLook: CustomerLook = { skin: 0, hairStyle: 0, hairColor: 0, outfit: 0, outfitColor: 0, accessory: 0 }

/** Pedido simples de um lanche, com extras opcionais. */
export const order = (burger = 'simples', extra: Partial<OrderItems> = {}): OrderItems => ({
  burgers: [burger],
  sides: [],
  drinks: [],
  desserts: [],
  ...extra,
})

export function testCustomer(o: OrderItems, patienceRatioValue = 1, slot = 0, type: CustomerTypeId = 'normal'): Customer {
  const max = patienceFor(o)
  return {
    id: 1,
    slot,
    type,
    order: o,
    priceRatio: orderPriceRatio(o, defaultPrices()),
    look: testLook,
    companion: null,
    patienceMax: max,
    patience: max * patienceRatioValue,
    status: 'waiting',
    mood: 'neutral',
    leaveTimer: 0,
    mindChangeAt: null,
    changedMind: false,
  }
}

/** Sessão de teste: nível máximo (tudo liberado) e estoque farto, a menos que se diga o contrário. */
export const testSession = (seed = 1, options: SessionOptions = {}): SessionState =>
  createSession(seed, { level: 50, stock: filledStock(99), ...options })
