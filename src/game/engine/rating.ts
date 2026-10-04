import { RATING } from '../config'
import { matchesRecipe } from './burger'
import { getRecipe } from './customers'
import type {
  DessertId,
  DrinkOrder,
  DrinkQuality,
  OrderItems,
  PattyQuality,
  ServiceNote,
  SideId,
  Tray,
} from './types'

/** Quanto da estrela `index` (0-based) está preenchida, de 0 a 1. */
export function starFill(reputation: number, index: number): number {
  return Math.min(1, Math.max(0, reputation - index))
}

export function clampStars(value: number): number {
  return Math.min(RATING.maxStars, Math.max(RATING.minStars, Math.round(value)))
}

export function waitPenalty(patienceRatio: number): number {
  for (const tier of RATING.wait) if (patienceRatio >= tier.minRatio) return tier.penalty
  return RATING.wait[RATING.wait.length - 1]!.penalty
}

export interface BurgerResult {
  recipeId: string
  status: 'exact' | 'wrong' | 'missing'
  patties: PattyQuality[]
  /** Fração das proteínas no ponto (0–1). */
  perfectShare: number
}
export interface SideResult {
  id: SideId
  status: 'exact' | 'wrong' | 'missing'
  stale: boolean
}
export interface DrinkResult {
  order: DrinkOrder
  status: 'exact' | 'sizeWrong' | 'kindWrong' | 'missing'
  quality: DrinkQuality | null
}
export interface DessertResult {
  id: DessertId
  status: 'exact' | 'wrong' | 'missing'
}

export interface OrderRating {
  stars: number
  notes: ServiceNote[]
  burgers: BurgerResult[]
  sides: SideResult[]
  drinks: DrinkResult[]
  desserts: DessertResult[]
  /** Todos os lanches pedidos estão certos. */
  burgerCorrect: boolean
}

/**
 * Casa cada item pedido com um item da bandeja, por níveis de proximidade (exato, parecido, qualquer).
 * Devolve, para cada pedido, o nível alcançado e o item usado, ou null se faltou.
 */
function assign<O, T>(
  ordered: readonly O[],
  available: readonly T[],
  tiers: readonly ((o: O, t: T) => boolean)[],
): ({ tier: number; item: T } | null)[] {
  const used = new Set<number>()
  const result: ({ tier: number; item: T } | null)[] = ordered.map(() => null)
  tiers.forEach((matches, tier) => {
    ordered.forEach((o, i) => {
      if (result[i]) return
      const idx = available.findIndex((t, j) => !used.has(j) && matches(o, t))
      if (idx >= 0) {
        used.add(idx)
        result[i] = { tier, item: available[idx]! }
      }
    })
  })
  return result
}

const mean = (values: readonly number[]): number => (values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length)

/**
 * Nota de 1 a 5: parte de 5 e perde estrelas por lanche errado ou faltando, ponto da carne, espera e itens do pedido
 * (acompanhamentos, bebidas, sobremesas). Em cada categoria vale a média dos itens pedidos.
 */
export function rateOrder(order: OrderItems, tray: Tray, patienceRatio: number): OrderRating {
  const P = RATING.penalty
  const notes = new Set<ServiceNote>()

  const burgerAssign = assign(order.burgers, tray.burgers, [
    (id, b) => matchesRecipe(b.ingredients, getRecipe(id)),
    () => true,
  ])
  const burgers: BurgerResult[] = order.burgers.map((recipeId, i) => {
    const m = burgerAssign[i]
    if (!m) return { recipeId, status: 'missing', patties: [], perfectShare: 0 }
    const patties = m.item.patties
    const perfectShare = patties.length > 0 ? patties.filter((q) => q === 'perfect').length / patties.length : 0
    return { recipeId, status: m.tier === 0 ? 'exact' : 'wrong', patties: m.tier === 0 ? patties : [], perfectShare: m.tier === 0 ? perfectShare : 0 }
  })
  const burgerPenalty = mean(
    burgers.map((b) => {
      if (b.status === 'missing') {
        notes.add('burgerMissing')
        return P.burgerMissing
      }
      if (b.status === 'wrong') {
        notes.add('burgerWrong')
        return P.burgerWrong
      }
      return mean(b.patties.map((q) => (q === 'raw' ? P.pattyRaw : q === 'overdone' ? P.pattyOverdone : 0)))
    }),
  )
  const exactPatties = burgers.flatMap((b) => b.patties)
  if (exactPatties.length > 0) {
    if (exactPatties.includes('raw')) notes.add('pattyRaw')
    else if (exactPatties.includes('overdone')) notes.add('pattyOverdone')
    else notes.add('pattyPerfect')
  }

  const sideAssign = assign(order.sides, tray.sides, [(id, s) => s.id === id, () => true])
  const sides: SideResult[] = order.sides.map((id, i) => {
    const m = sideAssign[i]
    if (!m) return { id, status: 'missing', stale: false }
    return { id, status: m.tier === 0 ? 'exact' : 'wrong', stale: m.item.quality === 'stale' }
  })
  const sidePenalty = mean(
    sides.map((s) => {
      if (s.status === 'missing') {
        notes.add('sideMissing')
        return P.sideMissing
      }
      if (s.status === 'wrong') {
        notes.add('sideWrong')
        return P.sideWrong
      }
      if (s.stale) {
        notes.add('sideStale')
        return P.sideStale
      }
      return 0
    }),
  )

  const drinkAssign = assign(order.drinks, tray.drinks, [
    (o, d) => d.kind === o.kind && d.size === o.size,
    (o, d) => d.kind === o.kind,
    () => true,
  ])
  const drinks: DrinkResult[] = order.drinks.map((o, i) => {
    const m = drinkAssign[i]
    if (!m) return { order: o, status: 'missing', quality: null }
    return { order: o, status: (['exact', 'sizeWrong', 'kindWrong'] as const)[m.tier]!, quality: m.item.quality }
  })
  const drinkPenalty = mean(
    drinks.map((d) => {
      if (d.status === 'missing') {
        notes.add('drinkMissing')
        return P.drinkMissing
      }
      let p = 0
      if (d.status === 'kindWrong') {
        notes.add('drinkWrongKind')
        p += P.drinkWrongKind
      } else if (d.status === 'sizeWrong') {
        notes.add('drinkWrongSize')
        p += P.drinkWrongSize
      }
      if (d.quality === 'low') {
        notes.add('drinkLow')
        p += P.drinkLow
      } else if (d.quality === 'spilled') {
        notes.add('drinkSpilled')
        p += P.drinkSpilled
      }
      return p
    }),
  )

  const dessertAssign = assign(order.desserts, tray.desserts, [(id, d) => d.id === id, () => true])
  const desserts: DessertResult[] = order.desserts.map((id, i) => {
    const m = dessertAssign[i]
    return { id, status: !m ? 'missing' : m.tier === 0 ? 'exact' : 'wrong' }
  })
  const dessertPenalty = mean(
    desserts.map((d) => {
      if (d.status === 'missing') {
        notes.add('dessertMissing')
        return P.dessertMissing
      }
      if (d.status === 'wrong') {
        notes.add('dessertWrong')
        return P.dessertWrong
      }
      return 0
    }),
  )

  const wait = waitPenalty(patienceRatio)
  if (wait > 0 && patienceRatio < RATING.wait[1]!.minRatio) notes.add('slow')
  else if (patienceRatio >= RATING.fastRatio) notes.add('fast')

  const penalty = burgerPenalty + sidePenalty + drinkPenalty + dessertPenalty + wait
  return {
    stars: clampStars(Math.ceil(RATING.maxStars - penalty - 0.5)), // arredonda "meio para baixo"
    notes: [...notes],
    burgers,
    sides,
    drinks,
    desserts,
    burgerCorrect: burgers.every((b) => b.status === 'exact'),
  }
}
