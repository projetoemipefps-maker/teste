import { describe, expect, it } from 'vitest'
import { COMBOS, CUP_SIZES, ECONOMY, RECIPES } from '../config'
import { getRecipe, rollOrder } from './customers'
import { drinkPrice, orderPrice, recipePrice } from './payment'
import { rateOrder, waitPenalty } from './rating'
import { evaluateService } from './serve'
import type { Customer, OrderItems, Tray } from './types'

const burgerFor = (recipeId: string, patties: ('raw' | 'perfect' | 'overdone')[]) => ({
  ingredients: [...getRecipe(recipeId).ingredients],
  patties,
})
const noTray = (): Tray => ({ burger: null, fries: null, drink: null })
const customer = (order: OrderItems, ratio = 1): Customer => ({
  id: 1, slot: 0, order, variant: 0, patienceMax: 40, patience: 40 * ratio, status: 'waiting', mood: 'neutral', leaveTimer: 0,
})
const solo: OrderItems = { recipeId: 'simples', fries: false, drink: null }
const combo: OrderItems = { recipeId: 'simples', fries: true, drink: 'medium' }
const perfectCombo = (): Tray => ({
  burger: burgerFor('simples', ['perfect']),
  fries: { quality: 'fresh' },
  drink: { size: 'medium', quality: 'good' },
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
    const tray = { ...perfectCombo(), burger: burgerFor('classico', ['perfect']) }
    const r = rateOrder(combo, tray, 1)
    expect(r.burgerCorrect).toBe(false)
    expect(r.stars).toBeLessThanOrEqual(2)
    expect(r.notes).toContain('burgerWrong')
  })

  it('sem lanche na bandeja: 1 estrela', () => {
    const r = rateOrder(solo, noTray(), 1)
    expect(r.stars).toBe(1)
    expect(r.notes).toContain('burgerMissing')
  })

  it('o ponto da carne pesa: passada < no ponto, crua < passada', () => {
    const stars = (q: 'raw' | 'perfect' | 'overdone') =>
      rateOrder(solo, { ...noTray(), burger: burgerFor('simples', [q]) }, 1).stars
    expect(stars('perfect')).toBeGreaterThan(stars('overdone'))
    expect(stars('overdone')).toBeGreaterThanOrEqual(stars('raw'))
    expect(stars('raw')).toBeLessThanOrEqual(3)
  })

  it('em lanche duplo, a penalidade da carne é a média', () => {
    const tray = { ...noTray(), burger: burgerFor('duplo', ['perfect', 'raw']) }
    const r = rateOrder({ recipeId: 'duplo', fries: false, drink: null }, tray, 1)
    expect(r.perfectShare).toBe(0.5)
    expect(r.notes).toContain('pattyRaw')
  })

  it('faltar item do combo tira estrelas', () => {
    const noFries = { ...perfectCombo(), fries: null }
    const noDrink = { ...perfectCombo(), drink: null }
    expect(rateOrder(combo, noFries, 1).stars).toBeLessThan(5)
    expect(rateOrder(combo, noFries, 1).notes).toContain('friesMissing')
    expect(rateOrder(combo, noDrink, 1).notes).toContain('drinkMissing')
  })

  it('batata murcha, copo pouco cheio, derramado ou de outro tamanho pioram a nota', () => {
    const stale = { ...perfectCombo(), fries: { quality: 'stale' as const } }
    const low = { ...perfectCombo(), drink: { size: 'medium' as const, quality: 'low' as const } }
    const spilled = { ...perfectCombo(), drink: { size: 'medium' as const, quality: 'spilled' as const } }
    const wrongSize = { ...perfectCombo(), drink: { size: 'small' as const, quality: 'good' as const } }
    expect(rateOrder(combo, stale, 1).notes).toContain('friesStale')
    expect(rateOrder(combo, low, 1).notes).toContain('drinkLow')
    expect(rateOrder(combo, spilled, 1).notes).toContain('drinkSpilled')
    expect(rateOrder(combo, wrongSize, 1).notes).toContain('drinkWrongSize')
    for (const t of [stale, low, spilled, wrongSize]) expect(rateOrder(combo, t, 1).stars).toBeLessThan(5)
  })

  it('itens que o cliente não pediu não contam', () => {
    const extra = { ...noTray(), burger: burgerFor('simples', ['perfect']), fries: { quality: 'fresh' as const } }
    expect(rateOrder(solo, extra, 1).stars).toBe(5)
  })

  it('esperar muito tira estrelas', () => {
    const tray = { ...noTray(), burger: burgerFor('simples', ['perfect']) }
    expect(rateOrder(solo, tray, 1).stars).toBe(5)
    expect(rateOrder(solo, tray, 0.1).stars).toBeLessThan(5)
    expect(rateOrder(solo, tray, 0.1).notes).toContain('slow')
    expect(waitPenalty(1)).toBe(0)
    expect(waitPenalty(0.45)).toBeGreaterThan(0)
    expect(waitPenalty(0)).toBeGreaterThan(waitPenalty(0.45))
  })

  it('a nota fica sempre entre 1 e 5', () => {
    const awful = { burger: burgerFor('classico', ['raw']), fries: { quality: 'stale' as const }, drink: { size: 'small' as const, quality: 'spilled' as const } }
    expect(rateOrder(combo, awful, 0).stars).toBe(1)
    expect(rateOrder(combo, perfectCombo(), 1).stars).toBe(5)
  })
})

describe('pagamento do pedido', () => {
  it('perfeito: preço dos itens + gorjeta + bônus da carne', () => {
    const r = evaluateService(customer(combo), perfectCombo())
    expect(r.itemsPaid).toBe(orderPrice(combo))
    expect(r.tip).toBeGreaterThan(0)
    expect(r.bonus).toBeGreaterThan(0)
    expect(r.total).toBe(r.itemsPaid + r.tip + r.bonus)
    expect(r.stars).toBe(5)
    expect(r.extrasDelivered).toBe(2)
  })

  it('o bônus só vem com carne no ponto e lanche certo', () => {
    const overdone = evaluateService(customer(solo), { ...noTray(), burger: burgerFor('simples', ['overdone']) })
    expect(overdone.bonus).toBe(0)
    const wrong = evaluateService(customer(solo), { ...noTray(), burger: burgerFor('classico', ['perfect']) })
    expect(wrong.bonus).toBe(0)
  })

  it('item errado paga fração; item faltando não paga', () => {
    const price = recipePrice(getRecipe('simples'))
    const wrong = evaluateService(customer(solo), { ...noTray(), burger: burgerFor('classico', ['perfect']) })
    expect(wrong.itemsPaid).toBe(Math.round(price * ECONOMY.wrongPayFraction))
    const missing = evaluateService(customer(combo), { ...perfectCombo(), fries: null, drink: null })
    expect(missing.itemsPaid).toBe(price)
    expect(missing.extrasDelivered).toBe(0)
    const wrongCup = evaluateService(customer(combo), { ...perfectCombo(), drink: { size: 'small', quality: 'good' } })
    expect(wrongCup.itemsPaid).toBe(price + ECONOMY.friesPrice + Math.round(drinkPrice('medium') * ECONOMY.wrongPayFraction))
  })

  it('a gorjeta depende da nota e da rapidez', () => {
    const good = evaluateService(customer(solo, 1), { ...noTray(), burger: burgerFor('simples', ['perfect']) })
    const slow = evaluateService(customer(solo, 0.05), { ...noTray(), burger: burgerFor('simples', ['perfect']) })
    const bad = evaluateService(customer(solo, 1), { ...noTray(), burger: burgerFor('simples', ['raw']) })
    expect(good.tip).toBeGreaterThan(slow.tip)
    expect(good.tip).toBeGreaterThan(bad.tip)
  })

  it('pagar nunca dá valor negativo, mesmo sem nada na bandeja', () => {
    const r = evaluateService(customer(combo), noTray())
    expect(r.total).toBe(0)
    expect(r.stars).toBe(1)
  })
})

describe('sorteio de pedidos', () => {
  it('só gera lanches, combos e copos que existem na config', () => {
    let state = 99
    const seen = new Set<string>()
    for (let i = 0; i < 300; i++) {
      const [order, next] = rollOrder(state, 1)
      state = next
      expect(RECIPES.some((r) => r.id === order.recipeId)).toBe(true)
      if (order.drink) expect(CUP_SIZES).toContain(order.drink)
      seen.add(`${order.fries}-${order.drink !== null}`)
    }
    expect(seen.size).toBe(COMBOS.length) // aparecem todos os tipos de combo
  })

  it('é determinístico pela seed', () => {
    expect(rollOrder(5, 1)).toEqual(rollOrder(5, 1))
  })
})
