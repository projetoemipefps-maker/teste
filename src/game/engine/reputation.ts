import { REPUTATION } from '../config'
import type { PlayerState, Review } from './types'

/** Média das avaliações recentes (com um peso de "nota neutra" enquanto há poucas), de 0 a 5. */
export function computeReputation(reviews: readonly Review[]): number {
  const recent = reviews.slice(0, REPUTATION.window)
  const sum = recent.reduce((s, r) => s + r.stars, 0)
  const value = (sum + REPUTATION.priorStars * REPUTATION.priorWeight) / (recent.length + REPUTATION.priorWeight)
  return Math.min(REPUTATION.maxStars, Math.max(0, value))
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
