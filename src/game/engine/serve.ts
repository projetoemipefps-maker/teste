import { getRecipe, patienceRatio } from './customers'
import { matchesRecipe } from './burger'
import { computePayment } from './payment'
import { applyReputation, reputationDelta } from './rating'
import { addXp, xpForServe } from './xp'
import { CUSTOMERS } from '../config'
import type { StepResult, SessionState, PlayerState } from './types'

export function canServe(session: SessionState): boolean {
  if (session.ended || session.burger.length === 0 || session.selectedSlot === null) return false
  return session.slots[session.selectedSlot]?.status === 'waiting'
}

/** Entrega o lanche montado ao cliente selecionado. Certo paga cheio; errado paga menos e o cliente sai bravo. */
export function serveOrder(session: SessionState, player: PlayerState): StepResult {
  if (!canServe(session)) return { session, player, events: [] }
  const slot = session.selectedSlot!
  const customer = session.slots[slot]!
  const recipe = getRecipe(customer.recipeId)
  const ratio = patienceRatio(customer)
  const correct = matchesRecipe(session.burger, recipe)

  const payment = computePayment(recipe, ratio, correct)
  const xpGain = xpForServe(recipe, correct)
  const progress = addXp(player.level, player.xp, xpGain)
  const reputation = applyReputation(player.reputation, reputationDelta(correct ? 'correct' : 'wrong', ratio))

  const slots = [...session.slots]
  slots[slot] = {
    ...customer,
    status: 'leaving',
    mood: correct ? 'happy' : 'angry',
    leaveTimer: CUSTOMERS.leaveDuration,
  }

  const events: StepResult['events'] = [
    {
      type: 'customerServed',
      slot,
      customerId: customer.id,
      correct,
      base: payment.base,
      tip: payment.tip,
      total: payment.total,
      xp: xpGain,
    },
  ]
  if (progress.levelsGained > 0) events.push({ type: 'leveledUp', level: progress.level })

  return {
    session: {
      ...session,
      slots,
      burger: [],
      selectedSlot: null,
      stats: {
        ...session.stats,
        served: session.stats.served + (correct ? 1 : 0),
        wrong: session.stats.wrong + (correct ? 0 : 1),
        earned: session.stats.earned + payment.total,
      },
    },
    player: {
      ...player,
      money: player.money + payment.total,
      xp: progress.xp,
      level: progress.level,
      reputation,
    },
    events,
  }
}
