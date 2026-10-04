import { ECONOMY, FIRST_VENUE, PROGRESSION } from '../config'
import { defaultPrices } from './pricing'
import { startingStock } from './stock'
import { emptyDecor, emptyUpgrades } from './upgrades'
import type { PlayerState } from './types'

/** Jogador novo: primeiro dia, caixa inicial e um estoque para começar. */
export function createPlayer(): PlayerState {
  return {
    money: ECONOMY.startingMoney,
    xp: 0,
    level: PROGRESSION.startingLevel,
    day: PROGRESSION.startingDay,
    reputation: PROGRESSION.startingReputation,
    stock: startingStock(PROGRESSION.startingLevel),
    stockAge: {},
    prices: defaultPrices(),
    reviews: [],
    loan: { taken: false, installmentsLeft: 0, installment: 0 },
    debtDays: 0,
    todayPurchases: 0,
    bankrupt: false,
    dayBoost: 1,
    upgrades: emptyUpgrades(),
    decor: emptyDecor(),
    venue: FIRST_VENUE,
    phase: 'prep',
    dayStart: null,
  }
}
