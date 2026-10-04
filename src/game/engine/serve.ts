import { CUSTOMER_RULES, CUSTOMER_TYPES, CUSTOMERS } from '../config'
import { patienceRatio } from './customers'
import { computeTip, perfectPattyBonus, wrongItemPay } from './payment'
import { dessertKey, drinkKey, itemPrice, orderPrice, recipeKey, sideKey } from './pricing'
import { rateOrder } from './rating'
import { addReview } from './reputation'
import { makeReview } from './reviews'
import { trayIsEmpty } from './session'
import { applyLevelUp } from './levelup'
import { addXp, xpForServe } from './xp'
import type { Customer, Mood, PlayerState, Prices, ServiceNote, SessionState, StepResult, Tray } from './types'

export function canServe(session: SessionState): boolean {
  if (session.ended || trayIsEmpty(session) || session.selectedSlot === null) return false
  return session.slots[session.selectedSlot]?.status === 'waiting'
}

export interface ServiceResult {
  /** Nota do atendimento (1–5). */
  stars: number
  /** Nota publicada na avaliação (o crítico é mais duro). */
  reviewStars: number
  burgerCorrect: boolean
  itemsPaid: number
  tip: number
  bonus: number
  total: number
  notes: ServiceNote[]
  /** Itens entregues certos além do primeiro lanche (dão XP extra). */
  extrasDelivered: number
  /** Quantos lanches entregues certos, por receita. */
  soldRecipes: string[]
}

/** Calcula nota e pagamento de uma entrega com os preços do jogador (função pura, sem alterar o estado). */
export function evaluateService(customer: Customer, tray: Tray, prices: Prices): ServiceResult {
  const { order } = customer
  const type = CUSTOMER_TYPES[customer.type]
  const ratio = patienceRatio(customer)
  const rating = rateOrder(order, tray, ratio)

  let paid = 0
  let bonus = 0
  let exactItems = 0
  const soldRecipes: string[] = []
  for (const b of rating.burgers) {
    const price = itemPrice(prices, recipeKey(b.recipeId))
    if (b.status === 'missing') continue
    if (b.status === 'wrong') {
      paid += wrongItemPay(price)
      continue
    }
    paid += price
    bonus += perfectPattyBonus(price, b.perfectShare)
    soldRecipes.push(b.recipeId)
    exactItems += 1
  }
  const pay = (key: string, status: string) => {
    if (status === 'missing') return
    const price = itemPrice(prices, key)
    if (status === 'exact') {
      paid += price
      exactItems += 1
    } else paid += wrongItemPay(price)
  }
  for (const s of rating.sides) pay(sideKey(s.id), s.status)
  for (const d of rating.drinks) pay(drinkKey(d.order.kind, d.order.size), d.status)
  for (const d of rating.desserts) pay(dessertKey(d.id), d.status)

  const itemsPaid = Math.round(paid * type.payFactor)
  // Crítico: só dá gorjeta quando tudo está perfeito.
  const tipAllowed = !type.strict || rating.stars === 5
  const tip = tipAllowed ? Math.round(computeTip(orderPrice(order, prices), rating.stars, ratio, customer.priceRatio) * type.tipFactor) : 0
  const reviewStars = type.strict && rating.stars < 5 ? Math.max(1, rating.stars - CUSTOMER_RULES.criticStarPenalty) : rating.stars
  return {
    stars: rating.stars,
    reviewStars,
    burgerCorrect: rating.burgerCorrect,
    itemsPaid,
    tip,
    bonus,
    total: itemsPaid + tip + bonus,
    notes: rating.notes,
    extrasDelivered: Math.max(0, exactItems - (soldRecipes.length > 0 ? 1 : 0)),
    soldRecipes,
  }
}

/** Entrega a bandeja ao cliente selecionado: dá nota, paga, dá XP, registra a avaliação e atualiza a reputação. */
export function serveOrder(session: SessionState, player: PlayerState): StepResult {
  if (!canServe(session)) return { session, player, events: [] }
  const slot = session.selectedSlot!
  const customer = session.slots[slot]!
  const type = CUSTOMER_TYPES[customer.type]
  const result = evaluateService(customer, session.tray, player.prices)
  const xpGain = xpForServe(result.stars, result.extrasDelivered, type.xpFactor)
  const progress = addXp(player.level, player.xp, xpGain)
  const review = makeReview({
    customerId: customer.id,
    day: player.day,
    stars: result.reviewStars,
    notes: result.notes,
    priceRatio: customer.priceRatio,
    type: customer.type,
    weight: type.reviewWeight,
  })

  const mood: Mood = result.stars >= 4 ? 'happy' : result.stars <= 2 ? 'angry' : 'neutral'
  const slots = [...session.slots]
  slots[slot] = { ...customer, status: 'leaving', mood, leaveTimer: CUSTOMERS.leaveDuration }

  const events: StepResult['events'] = [
    {
      type: 'customerServed',
      slot,
      customerId: customer.id,
      customerType: customer.type,
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

  const sold = { ...session.stats.soldByRecipe }
  for (const id of result.soldRecipes) sold[id] = (sold[id] ?? 0) + 1

  let nextSession: SessionState = {
    ...session,
    slots,
    tray: { burgers: [], sides: [], drinks: [], desserts: [] },
    selectedSlot: null,
    stats: {
      ...session.stats,
      served: session.stats.served + 1,
      revenue: session.stats.revenue + result.itemsPaid,
      tips: session.stats.tips + result.tip + result.bonus,
      starsTotal: session.stats.starsTotal + result.stars,
      xpGained: session.stats.xpGained + xpGain,
      soldByRecipe: sold,
      influencerHappy: session.stats.influencerHappy + (type.boostsDemand && result.stars >= 4 ? 1 : 0),
    },
  }
  if (progress.levelsGained > 0) {
    const up = applyLevelUp(nextSession, player.level, progress.level)
    nextSession = up.session
    events.push({ type: 'leveledUp', from: player.level, level: progress.level, unlocks: up.unlocks })
  }

  return {
    session: nextSession,
    player: addReview(
      { ...player, money: player.money + result.total, xp: progress.xp, level: progress.level },
      review,
    ),
    events,
  }
}
