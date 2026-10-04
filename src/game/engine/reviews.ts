import { PRICING, REPUTATION, REVIEW_NAMES, REVIEW_TEXTS, type CustomerTypeId, type ReviewTheme } from '../config'
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
  ['sideMissing', 'sideMissing'],
  ['dessertMissing', 'dessertMissing'],
  ['drinkMissing', 'drinkMissing'],
  ['slow', 'slow'],
  ['sideWrong', 'wrong'],
  ['dessertWrong', 'wrong'],
  ['drinkWrongKind', 'wrong'],
  ['pattyOverdone', 'dry'],
  ['drinkSpilled', 'drinkSpilled'],
  ['drinkLow', 'drinkLow'],
  ['sideStale', 'sideStale'],
]

export function reviewTheme(
  stars: number,
  notes: readonly ServiceNote[],
  priceRatio: number,
  type: CustomerTypeId = 'normal',
): ReviewTheme {
  if (type === 'critic') return stars >= 5 ? 'critic' : 'criticBad'
  if (type === 'influencer' && stars >= 4) return 'influencer'
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
  /** Nota que o cliente publica (o crítico é mais duro que o atendimento). */
  stars: number
  notes: readonly ServiceNote[]
  priceRatio: number
  type?: CustomerTypeId
  weight?: number
}

export function makeReview({ customerId, day, stars, notes, priceRatio, type = 'normal', weight = 1 }: Input): Review {
  const seed = hashSeed(customerId, day)
  return {
    id: `${day}-${customerId}`,
    day,
    stars,
    text: pick(REVIEW_TEXTS[reviewTheme(stars, notes, priceRatio, type)], seed),
    name: pick(REVIEW_NAMES, hashSeed(seed, 7)),
    ...(weight !== 1 && { weight }),
    ...(type !== 'normal' && { type }),
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
