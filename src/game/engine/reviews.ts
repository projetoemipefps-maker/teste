import { PRICING, REPUTATION, REVIEW_NAMES, REVIEW_TEXTS, type ReviewTheme } from '../config'
import type { Review, ServiceNote } from './types'

/** Mistura simples e determinística de dois inteiros (para escolher textos sem sortear). */
function hashSeed(a: number, b: number): number {
  let h = (a * 374761393 + b * 668265263) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return (h ^ (h >>> 16)) >>> 0
}

const pick = <T>(list: readonly T[], seed: number): T => list[seed % list.length]!

/** Problemas em ordem de importância para escolher o assunto de uma avaliação ruim. */
const NEGATIVE_ORDER: readonly [ServiceNote, ReviewTheme][] = [
  ['burgerMissing', 'wrong'],
  ['burgerWrong', 'wrong'],
  ['pattyRaw', 'raw'],
  ['friesMissing', 'friesMissing'],
  ['drinkMissing', 'drinkMissing'],
  ['slow', 'slow'],
  ['pattyOverdone', 'dry'],
  ['drinkSpilled', 'drinkSpilled'],
  ['drinkLow', 'drinkLow'],
  ['friesStale', 'friesStale'],
]

export function reviewTheme(stars: number, notes: readonly ServiceNote[], priceRatio: number): ReviewTheme {
  if (stars >= 4) {
    if (stars === 5 && notes.includes('pattyPerfect')) return 'greatPatty'
    if (notes.includes('fast')) return 'fast'
    if (priceRatio <= PRICING.cheapRatio) return 'cheap'
    return 'good'
  }
  if (stars === 3) return priceRatio >= PRICING.priceyRatio ? 'pricey' : 'okay'
  for (const [note, theme] of NEGATIVE_ORDER) if (notes.includes(note)) return theme
  return priceRatio >= PRICING.priceyRatio ? 'pricey' : 'bad'
}

interface Input {
  customerId: number
  day: number
  stars: number
  notes: readonly ServiceNote[]
  priceRatio: number
}

export function makeReview({ customerId, day, stars, notes, priceRatio }: Input): Review {
  const seed = hashSeed(customerId, day)
  return {
    id: `${day}-${customerId}`,
    day,
    stars,
    text: pick(REVIEW_TEXTS[reviewTheme(stars, notes, priceRatio)], seed),
    name: pick(REVIEW_NAMES, hashSeed(seed, 7)),
  }
}

/** Avaliação de quem desistiu de esperar. */
export function makeLostReview(customerId: number, day: number): Review {
  const seed = hashSeed(customerId, day)
  return {
    id: `${day}-${customerId}`,
    day,
    stars: REPUTATION.lostStars,
    text: pick(REVIEW_TEXTS.lost, seed),
    name: pick(REVIEW_NAMES, hashSeed(seed, 7)),
  }
}
