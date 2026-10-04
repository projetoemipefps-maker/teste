import { PROGRESSION, RATING } from '../config'
import { matchesRecipe } from './burger'
import { getRecipe } from './customers'
import type { OrderItems, ServiceNote, Tray } from './types'

export function clampReputation(value: number): number {
  return Math.min(PROGRESSION.maxReputation, Math.max(0, value))
}

export function applyReputation(current: number, delta: number): number {
  return clampReputation(current + delta)
}

export function reputationForStars(stars: number): number {
  return PROGRESSION.reputation.byStars[clampStars(stars) - 1] ?? 0
}

export const reputationLost = (): number => PROGRESSION.reputation.lost

/** Quanto da estrela `index` (0-based) está preenchida, de 0 a 1. */
export function starFill(reputation: number, index: number): number {
  return Math.min(1, Math.max(0, reputation - index))
}

export function clampStars(value: number): number {
  return Math.min(RATING.maxStars, Math.max(RATING.minStars, Math.round(value)))
}

export interface OrderRating {
  stars: number
  notes: ServiceNote[]
  burgerCorrect: boolean
  /** Fração das carnes do lanche que estão no ponto (0–1). */
  perfectShare: number
}

export function waitPenalty(patienceRatio: number): number {
  for (const tier of RATING.wait) if (patienceRatio >= tier.minRatio) return tier.penalty
  return RATING.wait[RATING.wait.length - 1]!.penalty
}

/** Nota de 1 a 5: parte de 5 e perde estrelas por lanche errado, ponto da carne, espera e itens do combo. */
export function rateOrder(order: OrderItems, tray: Tray, patienceRatio: number): OrderRating {
  const P = RATING.penalty
  const notes: ServiceNote[] = []
  let penalty = 0
  let burgerCorrect = false
  let perfectShare = 0

  const burger = tray.burger
  if (!burger) {
    penalty += P.burgerMissing
    notes.push('burgerMissing')
  } else {
    burgerCorrect = matchesRecipe(burger.ingredients, getRecipe(order.recipeId))
    if (!burgerCorrect) {
      penalty += P.burgerWrong
      notes.push('burgerWrong')
    }
    const { patties } = burger
    if (patties.length > 0) {
      const each: number[] = patties.map((q) => (q === 'raw' ? P.pattyRaw : q === 'overdone' ? P.pattyOverdone : 0))
      penalty += each.reduce((a, b) => a + b, 0) / patties.length
      perfectShare = patties.filter((q) => q === 'perfect').length / patties.length
      if (patties.includes('raw')) notes.push('pattyRaw')
      else if (patties.includes('overdone')) notes.push('pattyOverdone')
      else notes.push('pattyPerfect')
    }
  }

  if (order.fries) {
    if (!tray.fries) {
      penalty += P.friesMissing
      notes.push('friesMissing')
    } else if (tray.fries.quality === 'stale') {
      penalty += P.friesStale
      notes.push('friesStale')
    }
  }

  if (order.drink) {
    const drink = tray.drink
    if (!drink) {
      penalty += P.drinkMissing
      notes.push('drinkMissing')
    } else {
      if (drink.size !== order.drink) {
        penalty += P.drinkWrongSize
        notes.push('drinkWrongSize')
      }
      if (drink.quality === 'low') {
        penalty += P.drinkLow
        notes.push('drinkLow')
      } else if (drink.quality === 'spilled') {
        penalty += P.drinkSpilled
        notes.push('drinkSpilled')
      }
    }
  }

  const wait = waitPenalty(patienceRatio)
  penalty += wait
  if (wait > 0 && patienceRatio < RATING.wait[1]!.minRatio) notes.push('slow')
  else if (patienceRatio >= RATING.fastRatio) notes.push('fast')

  // Arredonda "meio para baixo": qualquer penalidade de 0,5 estrela ou mais custa uma estrela inteira.
  return { stars: clampStars(Math.ceil(RATING.maxStars - penalty - 0.5)), notes, burgerCorrect, perfectShare }
}
