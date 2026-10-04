import { REPUTATION } from '../config'
import type { PlayerState, Review } from './types'

/**
 * Média ponderada das avaliações recentes (o crítico pesa mais), com um peso de "nota neutra" enquanto há poucas.
 * De 0 a 5.
 */
export function computeReputation(reviews: readonly Review[]): number {
  const recent = reviews.slice(0, REPUTATION.window)
  let weighted = REPUTATION.priorStars * REPUTATION.priorWeight
  let total = REPUTATION.priorWeight
  for (const r of recent) {
    const w = r.weight ?? 1
    weighted += r.stars * w
    total += w
  }
  return Math.min(REPUTATION.maxStars, Math.max(0, weighted / total))
}

/** Reputação maior traz mais clientes. */
export const demandFactorForReputation = (reputation: number): number =>
  Math.max(0.2, 1 + (reputation - REPUTATION.neutralStars) * REPUTATION.demandPerStar)

/** Reputação maior deixa os clientes mais pacientes. */
export const patienceFactorForReputation = (reputation: number): number =>
  Math.max(0.5, 1 + (reputation - REPUTATION.neutralStars) * REPUTATION.patiencePerStar)

/** Guarda a avaliação (a mais nova primeiro) e recalcula a reputação. */
export function addReview(player: PlayerState, review: Review): PlayerState {
  const reviews = [review, ...player.reviews].slice(0, REPUTATION.keepReviews)
  return { ...player, reviews, reputation: computeReputation(reviews) }
}
