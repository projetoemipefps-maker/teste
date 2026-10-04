import { CUSTOMERS } from '../config'
import { patienceRatio } from './customers'
import { computeTip, perfectPattyBonus, wrongItemPay } from './payment'
import { FRIES_KEY, drinkKey, itemPrice, orderPrice, recipeKey } from './pricing'
import { rateOrder } from './rating'
import { addReview } from './reputation'
import { makeReview } from './reviews'
import { trayIsEmpty } from './session'
import { addXp, xpForServe } from './xp'
import type { Customer, Mood, PlayerState, Prices, ServiceNote, SessionState, StepResult, Tray } from './types'

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

/** Calcula nota e pagamento de uma entrega com os preços do jogador (função pura, sem alterar o estado). */
export function evaluateService(customer: Customer, tray: Tray, prices: Prices): ServiceResult {
  const { order } = customer
  const ratio = patienceRatio(customer)
  const rating = rateOrder(order, tray, ratio)
  const burgerPrice = itemPrice(prices, recipeKey(order.recipeId))

  let itemsPaid = 0
  if (tray.burger) itemsPaid += rating.burgerCorrect ? burgerPrice : wrongItemPay(burgerPrice)
  let extrasDelivered = 0
  if (order.fries && tray.fries) {
    itemsPaid += itemPrice(prices, FRIES_KEY)
    extrasDelivered += 1
  }
  if (order.drink && tray.drink) {
    const price = itemPrice(prices, drinkKey(order.drink))
    itemsPaid += tray.drink.size === order.drink ? price : wrongItemPay(price)
    extrasDelivered += 1
  }

  const tip = computeTip(orderPrice(order, prices), rating.stars, ratio, customer.priceRatio)
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

/** Entrega a bandeja ao cliente selecionado: dá nota, paga, dá XP, registra a avaliação e atualiza a reputação. */
export function serveOrder(session: SessionState, player: PlayerState): StepResult {
  if (!canServe(session)) return { session, player, events: [] }
  const slot = session.selectedSlot!
  const customer = session.slots[slot]!
  const result = evaluateService(customer, session.tray, player.prices)
  const xpGain = xpForServe(result.stars, result.extrasDelivered)
  const progress = addXp(player.level, player.xp, xpGain)
  const review = makeReview({
    customerId: customer.id,
    day: player.day,
    stars: result.stars,
    notes: result.notes,
    priceRatio: customer.priceRatio,
  })

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
      review,
    },
  ]
  if (progress.levelsGained > 0) events.push({ type: 'leveledUp', level: progress.level })

  const sold = { ...session.stats.soldByRecipe }
  if (result.burgerCorrect) sold[customer.order.recipeId] = (sold[customer.order.recipeId] ?? 0) + 1

  return {
    session: {
      ...session,
      slots,
      tray: { burger: null, fries: null, drink: null },
      selectedSlot: null,
      stats: {
        ...session.stats,
        served: session.stats.served + 1,
        revenue: session.stats.revenue + result.itemsPaid,
        tips: session.stats.tips + result.tip + result.bonus,
        starsTotal: session.stats.starsTotal + result.stars,
        xpGained: session.stats.xpGained + xpGain,
        soldByRecipe: sold,
      },
    },
    player: addReview(
      { ...player, money: player.money + result.total, xp: progress.xp, level: progress.level },
      review,
    ),
    events,
  }
}
