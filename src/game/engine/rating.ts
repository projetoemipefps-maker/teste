import { PROGRESSION } from '../config'

export type ServiceOutcome = 'correct' | 'wrong' | 'lost'

export function clampReputation(value: number): number {
  return Math.min(PROGRESSION.maxReputation, Math.max(0, value))
}

export function reputationDelta(outcome: ServiceOutcome, patienceRatio: number): number {
  if (outcome === 'lost') return PROGRESSION.reputation.lost
  if (outcome === 'wrong') return PROGRESSION.reputation.wrong
  return patienceRatio >= PROGRESSION.greatPatienceRatio
    ? PROGRESSION.reputation.great
    : PROGRESSION.reputation.good
}

export function applyReputation(current: number, delta: number): number {
  return clampReputation(current + delta)
}

/** Quanto da estrela `index` (0-based) está preenchida, de 0 a 1. */
export function starFill(reputation: number, index: number): number {
  return Math.min(1, Math.max(0, reputation - index))
}
