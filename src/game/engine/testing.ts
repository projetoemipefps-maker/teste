import { getRecipe, patienceFor } from './customers'
import { createPlayer } from './player'
import { defaultPrices, orderPriceRatio } from './pricing'
import type { Customer, OrderItems, PlayerState } from './types'

/** Ajudantes só para os testes. */
export const testPlayer = (overrides: Partial<PlayerState> = {}): PlayerState => ({ ...createPlayer(), ...overrides })

export function testCustomer(order: OrderItems, patienceRatioValue = 1, slot = 0): Customer {
  getRecipe(order.recipeId)
  const max = patienceFor(order)
  return {
    id: 1,
    slot,
    order,
    priceRatio: orderPriceRatio(order, defaultPrices()),
    variant: 0,
    patienceMax: max,
    patience: max * patienceRatioValue,
    status: 'waiting',
    mood: 'neutral',
    leaveTimer: 0,
  }
}
