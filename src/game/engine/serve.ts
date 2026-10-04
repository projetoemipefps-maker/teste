import { CUSTOMERS, ECONOMY } from '../config'
import { getRecipe, patienceRatio } from './customers'
import { computeTip, drinkPrice, orderPrice, perfectPattyBonus, recipePrice, wrongItemPay } from './payment'
import { applyReputation, rateOrder, reputationForStars } from './rating'
import { trayIsEmpty } from './session'
import { addXp, xpForServe } from './xp'
import type { Customer, Mood, PlayerState, ServiceNote, SessionState, StepResult, Tray } from './types'

export function canServe(session: SessionState): boolean {
  if (session.ended || trayIsEmpty(session) || session.selectedSlot === null) return false
  return session.slots[session.selectedSlot]?.status === 'waiting'
}

export interface ServiceResult {
  stars: number
  burgerCorrect: boolean
  itemsPaid: number
  tip: number
  bonus: number
  total: number
  notes: ServiceNote[]
  extrasDelivered: number
}

/** Calcula nota e pagamento de uma entrega (função pura, sem alterar o estado). */
export function evaluateService(customer: Customer, tray: Tray): ServiceResult {
  const { order } = customer
  const ratio = patienceRatio(customer)
  const rating = rateOrder(order, tray, ratio)
  const recipe = getRecipe(order.recipeId)
  const burgerPrice = recipePrice(recipe)

  let itemsPaid = 0
  if (tray.burger) itemsPaid += rating.burgerCorrect ? burgerPrice : wrongItemPay(burgerPrice)
  let extrasDelivered = 0
  if (order.fries && tray.fries) {
    itemsPaid += ECONOMY.friesPrice
    extrasDelivered += 1
  }
  if (order.drink && tray.drink) {
    const price = drinkPrice(order.drink)
    itemsPaid += tray.drink.size === order.drink ? price : wrongItemPay(price)
    extrasDelivered += 1
  }

  const tip = computeTip(orderPrice(order), rating.stars, ratio)
  const bonus = rating.burgerCorrect ? perfectPattyBonus(burgerPrice, rating.perfectShare) : 0
  return {
    stars: rating.stars,
    burgerCorrect: rating.burgerCorrect,
    itemsPaid,
    tip,
    bonus,
    total: itemsPaid + tip + bonus,
    notes: rating.notes,
    extrasDelivered,
  }
}

/** Entrega a bandeja ao cliente selecionado: dá nota, paga, dá XP e ajusta a reputação. */
export function serveOrder(session: SessionState, player: PlayerState): StepResult {
  if (!canServe(session)) return { session, player, events: [] }
  const slot = session.selectedSlot!
  const customer = session.slots[slot]!
  const result = evaluateService(customer, session.tray)
  const xpGain = xpForServe(result.stars, result.extrasDelivered)
  const progress = addXp(player.level, player.xp, xpGain)

  const mood: Mood = result.stars >= 4 ? 'happy' : result.stars <= 2 ? 'angry' : 'neutral'
  const slots = [...session.slots]
  slots[slot] = { ...customer, status: 'leaving', mood, leaveTimer: CUSTOMERS.leaveDuration }

  const events: StepResult['events'] = [
    {
      type: 'customerServed',
      slot,
      customerId: customer.id,
      stars: result.stars,
      burgerCorrect: result.burgerCorrect,
      itemsPaid: result.itemsPaid,
      tip: result.tip,
      bonus: result.bonus,
      total: result.total,
      notes: result.notes,
      xp: xpGain,
    },
  ]
  if (progress.levelsGained > 0) events.push({ type: 'leveledUp', level: progress.level })

  return {
    session: {
      ...session,
      slots,
      tray: { burger: null, fries: null, drink: null },
      selectedSlot: null,
      stats: {
        ...session.stats,
        served: session.stats.served + 1,
        earned: session.stats.earned + result.total,
        starsTotal: session.stats.starsTotal + result.stars,
      },
    },
    player: {
      ...player,
      money: player.money + result.total,
      xp: progress.xp,
      level: progress.level,
      reputation: applyReputation(player.reputation, reputationForStars(result.stars)),
    },
    events,
  }
}
