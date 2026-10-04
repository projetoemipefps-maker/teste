import { describe, expect, it } from 'vitest'
import { CUSTOMER_RULES, CUSTOMER_TYPES, ECONOMY, RECIPES } from '../config'
import { getRecipe, orderSize, rollOrder } from './customers'
import { defaultPrices, drinkKey, itemPrice, orderPrice, recipeKey, sideKey } from './pricing'
import { rateOrder, waitPenalty } from './rating'
import { evaluateService } from './serve'
import { order, testCustomer } from './testing'
import type { OrderItems, PattyQuality, Tray, TrayBurger } from './types'

const prices = defaultPrices()
const burgerOf = (recipeId: string, quality: PattyQuality = 'perfect'): TrayBurger => {
  const ingredients = [...getRecipe(recipeId).ingredients]
  const proteins = ingredients.filter((i) => i === 'patty' || i === 'chicken' || i === 'veggie').length
  return { ingredients, patties: Array.from({ length: proteins }, () => quality) }
}
const emptyTray = (): Tray => ({ burgers: [], sides: [], drinks: [], desserts: [] })
const tray = (t: Partial<Tray>): Tray => ({ ...emptyTray(), ...t })

const solo = order('simples')
const combo: OrderItems = order('simples', { sides: ['fries'], drinks: [{ kind: 'soda', size: 'medium' }] })
const perfectCombo = (): Tray =>
  tray({
    burgers: [burgerOf('simples')],
    sides: [{ id: 'fries', quality: 'fresh' }],
    drinks: [{ kind: 'soda', size: 'medium', quality: 'good' }],
  })

describe('nota do pedido', () => {
  it('tudo perfeito e rápido = 5 estrelas', () => {
    const r = rateOrder(combo, perfectCombo(), 1)
    expect(r.stars).toBe(5)
    expect(r.burgerCorrect).toBe(true)
    expect(r.notes).toContain('pattyPerfect')
    expect(r.notes).toContain('fast')
  })

  it('lanche de outra receita derruba a nota para 2 ou menos', () => {
    const r = rateOrder(combo, { ...perfectCombo(), burgers: [burgerOf('classico')] }, 1)
    expect(r.burgerCorrect).toBe(false)
    expect(r.stars).toBeLessThanOrEqual(2)
    expect(r.notes).toContain('burgerWrong')
  })

  it('sem lanche na bandeja: 1 estrela', () => {
    const r = rateOrder(solo, emptyTray(), 1)
    expect(r.stars).toBe(1)
    expect(r.notes).toContain('burgerMissing')
  })

  it('o ponto da carne pesa: passada < no ponto, crua < passada', () => {
    const stars = (q: PattyQuality) => rateOrder(solo, tray({ burgers: [burgerOf('simples', q)] }), 1).stars
    expect(stars('perfect')).toBeGreaterThan(stars('overdone'))
    expect(stars('overdone')).toBeGreaterThanOrEqual(stars('raw'))
    expect(stars('raw')).toBeLessThanOrEqual(3)
  })

  it('em lanche com duas carnes, a penalidade da carne é a média', () => {
    const duplo: TrayBurger = { ...burgerOf('duplo'), patties: ['perfect', 'raw'] }
    const r = rateOrder(order('duplo'), tray({ burgers: [duplo] }), 1)
    expect(r.burgers[0]!.perfectShare).toBe(0.5)
    expect(r.notes).toContain('pattyRaw')
  })

  it('faltar item do pedido tira estrelas', () => {
    const noSide = { ...perfectCombo(), sides: [] }
    const noDrink = { ...perfectCombo(), drinks: [] }
    expect(rateOrder(combo, noSide, 1).stars).toBeLessThan(5)
    expect(rateOrder(combo, noSide, 1).notes).toContain('sideMissing')
    expect(rateOrder(combo, noDrink, 1).notes).toContain('drinkMissing')
    const withDessert = order('simples', { desserts: ['brownie'] })
    expect(rateOrder(withDessert, tray({ burgers: [burgerOf('simples')] }), 1).notes).toContain('dessertMissing')
  })

  it('acompanhamento murcho, errado ou de outro tipo piora a nota', () => {
    const stale = { ...perfectCombo(), sides: [{ id: 'fries' as const, quality: 'stale' as const }] }
    const wrong = { ...perfectCombo(), sides: [{ id: 'nuggets' as const, quality: 'fresh' as const }] }
    expect(rateOrder(combo, stale, 1).notes).toContain('sideStale')
    expect(rateOrder(combo, wrong, 1).notes).toContain('sideWrong')
    for (const t of [stale, wrong]) expect(rateOrder(combo, t, 1).stars).toBeLessThan(5)
  })

  it('copo pouco cheio, derramado, de outro tamanho ou de outra bebida piora a nota', () => {
    const drink = (d: Partial<Tray['drinks'][number]>) => ({ ...perfectCombo(), drinks: [{ kind: 'soda' as const, size: 'medium' as const, quality: 'good' as const, ...d }] })
    expect(rateOrder(combo, drink({ quality: 'low' }), 1).notes).toContain('drinkLow')
    expect(rateOrder(combo, drink({ quality: 'spilled' }), 1).notes).toContain('drinkSpilled')
    expect(rateOrder(combo, drink({ size: 'small' }), 1).notes).toContain('drinkWrongSize')
    expect(rateOrder(combo, drink({ kind: 'juice' }), 1).notes).toContain('drinkWrongKind')
    for (const d of [{ quality: 'low' as const }, { size: 'small' as const }, { kind: 'juice' as const }]) {
      expect(rateOrder(combo, drink(d), 1).stars).toBeLessThan(5)
    }
  })

  it('itens que o cliente não pediu não contam', () => {
    const extra = tray({ burgers: [burgerOf('simples')], sides: [{ id: 'fries', quality: 'fresh' }] })
    expect(rateOrder(solo, extra, 1).stars).toBe(5)
  })

  it('esperar muito tira estrelas', () => {
    const t = tray({ burgers: [burgerOf('simples')] })
    expect(rateOrder(solo, t, 1).stars).toBe(5)
    expect(rateOrder(solo, t, 0.1).stars).toBeLessThan(5)
    expect(rateOrder(solo, t, 0.1).notes).toContain('slow')
    expect(waitPenalty(1)).toBe(0)
    expect(waitPenalty(0.45)).toBeGreaterThan(0)
    expect(waitPenalty(0)).toBeGreaterThan(waitPenalty(0.45))
  })

  it('a nota fica sempre entre 1 e 5', () => {
    const awful = tray({
      burgers: [burgerOf('classico', 'raw')],
      sides: [{ id: 'rings', quality: 'stale' }],
      drinks: [{ kind: 'juice', size: 'small', quality: 'spilled' }],
    })
    expect(rateOrder(combo, awful, 0).stars).toBe(1)
    expect(rateOrder(combo, perfectCombo(), 1).stars).toBe(5)
  })
})

describe('pedidos com vários lanches (família)', () => {
  const family: OrderItems = order('simples', { burgers: ['simples', 'x-burger', 'simples'], sides: ['fries', 'fries'], drinks: [{ kind: 'soda', size: 'small' }] })
  const familyTray = (): Tray =>
    tray({
      burgers: [burgerOf('x-burger'), burgerOf('simples'), burgerOf('simples')], // fora de ordem de propósito
      sides: [{ id: 'fries', quality: 'fresh' }, { id: 'fries', quality: 'fresh' }],
      drinks: [{ kind: 'soda', size: 'small', quality: 'good' }],
    })

  it('casa cada lanche pedido com o da bandeja, em qualquer ordem', () => {
    const r = rateOrder(family, familyTray(), 1)
    expect(r.burgers.map((b) => b.status)).toEqual(['exact', 'exact', 'exact'])
    expect(r.stars).toBe(5)
  })

  it('um lanche faltando entre vários penaliza pela média, mas sempre aparece na nota', () => {
    const t = { ...familyTray(), burgers: familyTray().burgers.slice(0, 2) }
    const r = rateOrder(family, t, 1)
    expect(r.burgers.filter((b) => b.status === 'missing')).toHaveLength(1)
    expect(r.notes).toContain('burgerMissing')
    expect(r.stars).toBeLessThan(5)
    expect(r.burgerCorrect).toBe(false)
  })

  it('o pagamento soma todos os lanches', () => {
    const paid = evaluateService(testCustomer(family, 1, 0, 'family'), familyTray(), prices)
    expect(paid.itemsPaid).toBe(orderPrice(family, prices))
    expect(paid.soldRecipes.sort()).toEqual(['simples', 'simples', 'x-burger'])
  })

  it('itens extras entregues dão XP extra: lanches além do primeiro, acompanhamentos e bebidas', () => {
    const paid = evaluateService(testCustomer(family, 1, 0, 'family'), familyTray(), prices)
    expect(paid.extrasDelivered).toBe(2 + 2 + 1)
  })
})

describe('pagamento do pedido', () => {
  it('perfeito: preço dos itens + gorjeta + bônus da carne', () => {
    const r = evaluateService(testCustomer(combo), perfectCombo(), prices)
    expect(r.itemsPaid).toBe(orderPrice(combo, prices))
    expect(r.tip).toBeGreaterThan(0)
    expect(r.bonus).toBeGreaterThan(0)
    expect(r.total).toBe(r.itemsPaid + r.tip + r.bonus)
    expect(r.stars).toBe(5)
    expect(r.extrasDelivered).toBe(2)
  })

  it('o bônus só vem com carne no ponto e lanche certo', () => {
    const overdone = evaluateService(testCustomer(solo), tray({ burgers: [burgerOf('simples', 'overdone')] }), prices)
    expect(overdone.bonus).toBe(0)
    const wrong = evaluateService(testCustomer(solo), tray({ burgers: [burgerOf('classico')] }), prices)
    expect(wrong.bonus).toBe(0)
  })

  it('item errado paga fração; item faltando não paga', () => {
    const price = itemPrice(prices, recipeKey('simples'))
    const wrong = evaluateService(testCustomer(solo), tray({ burgers: [burgerOf('classico')] }), prices)
    expect(wrong.itemsPaid).toBe(Math.round(price * ECONOMY.wrongPayFraction))
    const missing = evaluateService(testCustomer(combo), tray({ burgers: [burgerOf('simples')] }), prices)
    expect(missing.itemsPaid).toBe(price)
    expect(missing.extrasDelivered).toBe(0)
    const wrongCup = evaluateService(testCustomer(combo), { ...perfectCombo(), drinks: [{ kind: 'soda', size: 'small', quality: 'good' }] }, prices)
    expect(wrongCup.itemsPaid).toBe(price + itemPrice(prices, sideKey('fries')) + Math.round(itemPrice(prices, drinkKey('soda', 'medium')) * ECONOMY.wrongPayFraction))
  })

  it('a gorjeta depende da nota e da rapidez', () => {
    const t = tray({ burgers: [burgerOf('simples')] })
    const good = evaluateService(testCustomer(solo, 1), t, prices)
    const slow = evaluateService(testCustomer(solo, 0.05), t, prices)
    const bad = evaluateService(testCustomer(solo, 1), tray({ burgers: [burgerOf('simples', 'raw')] }), prices)
    expect(good.tip).toBeGreaterThan(slow.tip)
    expect(good.tip).toBeGreaterThan(bad.tip)
  })

  it('pagar nunca dá valor negativo, mesmo sem nada na bandeja', () => {
    const r = evaluateService(testCustomer(combo), emptyTray(), prices)
    expect(r.total).toBe(0)
    expect(r.stars).toBe(1)
  })
})

describe('tipos de cliente no pagamento', () => {
  const perfect = tray({ burgers: [burgerOf('simples')] })
  const as = (type: keyof typeof CUSTOMER_TYPES, t = perfect, ratio = 1) => evaluateService(testCustomer(solo, ratio, 0, type), t, prices)

  it('o apressado dá gorjeta maior que o cliente normal (com a mesma nota)', () => {
    expect(as('hurried').tip).toBeGreaterThan(as('normal').tip)
  })

  it('a criança dá gorjeta menor', () => {
    expect(as('kid').tip).toBeLessThan(as('normal').tip)
  })

  it('o influenciador paga mais pelos mesmos itens', () => {
    expect(as('influencer').itemsPaid).toBe(Math.round(as('normal').itemsPaid * CUSTOMER_TYPES.influencer.payFactor))
    expect(as('influencer').itemsPaid).toBeGreaterThan(as('normal').itemsPaid)
  })

  it('o crítico exige perfeição: com 5 estrelas dá muita gorjeta e nota 5; abaixo disso, nada de gorjeta e nota dura', () => {
    const great = as('critic')
    expect(great.stars).toBe(5)
    expect(great.reviewStars).toBe(5)
    expect(great.tip).toBeGreaterThan(as('normal').tip * 2)
    const slightlyOff = as('critic', perfect, 0.2) // demorou: 4 estrelas
    expect(slightlyOff.stars).toBeLessThan(5)
    expect(slightlyOff.tip).toBe(0)
    expect(slightlyOff.reviewStars).toBe(Math.max(1, slightlyOff.stars - CUSTOMER_RULES.criticStarPenalty))
    // cliente normal com a mesma nota publica a nota do atendimento
    expect(as('normal', perfect, 0.2).reviewStars).toBe(as('normal', perfect, 0.2).stars)
  })
})

describe('sorteio de pedidos', () => {
  it('só gera lanches, acompanhamentos e bebidas liberados no nível', () => {
    let state = 99
    for (let i = 0; i < 200; i++) {
      const [o, next] = rollOrder(state, 1)
      state = next
      for (const id of o.burgers) expect(getRecipe(id).unlockLevel).toBeLessThanOrEqual(1)
      for (const s of o.sides) expect(s).toBe('fries')
      for (const d of o.drinks) expect(d.kind).toBe('soda')
      expect(o.desserts).toEqual([])
    }
  })

  it('os pedidos crescem com o nível (mais itens por cliente, em média)', () => {
    const average = (level: number) => {
      let state = 5
      let total = 0
      const n = 400
      for (let i = 0; i < n; i++) {
        const [o, next] = rollOrder(state, level)
        state = next
        total += orderSize(o)
      }
      return total / n
    }
    expect(average(30)).toBeGreaterThan(average(1) * 1.3)
  })

  it('a família pede vários lanches; a criança, só receitas simples', () => {
    let state = 11
    for (let i = 0; i < 100; i++) {
      const [fam, n1] = rollOrder(state, 30, CUSTOMER_TYPES.family)
      expect(fam.burgers.length).toBeGreaterThanOrEqual(2)
      expect(fam.burgers.length).toBeLessThanOrEqual(CUSTOMER_TYPES.family.burgers.max)
      const [kid, n2] = rollOrder(n1, 30, CUSTOMER_TYPES.kid)
      expect(kid.burgers).toHaveLength(1)
      for (const id of kid.burgers) expect(RECIPES.find((r) => r.id === id)!.simple).toBe(true)
      state = n2
    }
  })

  it('é determinístico pela seed', () => {
    expect(rollOrder(5, 20)).toEqual(rollOrder(5, 20))
  })
})
