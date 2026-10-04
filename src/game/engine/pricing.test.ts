import { describe, expect, it } from 'vitest'
import { INGREDIENTS, PRICING, RECIPES } from '../config'
import {
  basePrice,
  clampPrice,
  defaultPrices,
  demandFactorFromPrices,
  drinkKey,
  menuItems,
  menuPriceRatio,
  orderPriceRatio,
  patienceFactorFromPrice,
  priceLimits,
  recipeKey,
  setPrice,
  sideKey,
  tipFactorFromPrice,
} from './pricing'
import { order, testPlayer } from './testing'

describe('preços de venda', () => {
  it('o cardápio tem todos os lanches, acompanhamentos, bebidas (3 tamanhos) e sobremesas', () => {
    const items = menuItems()
    const keys = items.map((i) => i.key)
    expect(new Set(keys).size).toBe(keys.length)
    expect(items.filter((i) => i.kind === 'burger')).toHaveLength(RECIPES.length)
    expect(items.filter((i) => i.kind === 'side')).toHaveLength(5)
    expect(items.filter((i) => i.kind === 'drink')).toHaveLength(5 * 3)
    expect(items.filter((i) => i.kind === 'dessert')).toHaveLength(2)
    expect(keys).toContain(sideKey('fries'))
    expect(keys).toContain(drinkKey('shakeChocolate', 'large'))
  })

  it('o preço padrão dá lucro sobre o custo de estoque (margem de pelo menos 35%)', () => {
    for (const item of menuItems()) {
      expect(item.basePrice, item.name).toBeGreaterThan(item.cost)
      expect((item.basePrice - item.cost) / item.basePrice, item.name).toBeGreaterThan(0.35)
    }
  })

  it('cada item do cardápio é liberado no nível do seu ingrediente mais avançado', () => {
    for (const item of menuItems().filter((i) => i.kind === 'burger')) {
      const recipe = RECIPES.find((r) => r.id === item.recipeId)!
      for (const ing of recipe.ingredients) expect(INGREDIENTS[ing].unlockLevel, `${recipe.name}: ${ing}`).toBeLessThanOrEqual(recipe.unlockLevel)
    }
  })

  it('o ajuste respeita os limites (mínimo e máximo)', () => {
    const key = recipeKey('simples')
    const { min, max } = priceLimits(key)
    expect(min).toBe(Math.round(basePrice(key) * PRICING.minFactor))
    expect(max).toBe(Math.round(basePrice(key) * PRICING.maxFactor))
    expect(clampPrice(key, 1)).toBe(min)
    expect(clampPrice(key, 999)).toBe(max)
    const p = testPlayer()
    expect(setPrice(p, key, 999).prices[key]).toBe(max)
    expect(setPrice(p, key, 0).prices[key]).toBe(min)
    expect(setPrice(p, key, 17).prices[key]).toBe(17)
  })

  it('preço desconhecido não altera nada', () => {
    const p = testPlayer()
    expect(setPrice(p, 'recipe:nao-existe', 10)).toBe(p)
    expect(setPrice(p, 'drink:soda:gigante', 10)).toBe(p)
  })

  it('preço mais caro afasta clientes e preço mais barato atrai', () => {
    const base = defaultPrices()
    const cheap = Object.fromEntries(Object.entries(base).map(([k, v]) => [k, Math.round(v * 0.7)]))
    const dear = Object.fromEntries(Object.entries(base).map(([k, v]) => [k, Math.round(v * 1.4)]))
    expect(menuPriceRatio(base)).toBeCloseTo(1)
    expect(demandFactorFromPrices(base)).toBeCloseTo(1)
    expect(demandFactorFromPrices(cheap)).toBeGreaterThan(1)
    expect(demandFactorFromPrices(dear)).toBeLessThan(1)
  })

  it('preço alto deixa o cliente menos paciente e reduz a gorjeta', () => {
    expect(patienceFactorFromPrice(1.4)).toBeLessThan(patienceFactorFromPrice(1))
    expect(patienceFactorFromPrice(0.7)).toBeGreaterThan(patienceFactorFromPrice(1))
    expect(tipFactorFromPrice(1.4)).toBeLessThan(tipFactorFromPrice(1))
    expect(tipFactorFromPrice(0.7)).toBeGreaterThan(tipFactorFromPrice(1))
  })

  it('os fatores ficam dentro dos limites mesmo em preços absurdos', () => {
    expect(patienceFactorFromPrice(50)).toBe(PRICING.patienceMin)
    expect(patienceFactorFromPrice(-50)).toBe(PRICING.patienceMax)
    expect(tipFactorFromPrice(50)).toBe(PRICING.tipMin)
    expect(tipFactorFromPrice(-50)).toBe(PRICING.tipMax)
    expect(demandFactorFromPrices(Object.fromEntries(Object.keys(defaultPrices()).map((k) => [k, 1e6])))).toBe(PRICING.demandMin)
  })

  it('a razão de preço do pedido compara com o padrão', () => {
    const prices = { ...defaultPrices(), [recipeKey('simples')]: 28 }
    expect(orderPriceRatio(order('simples'), prices)).toBeCloseTo(2)
    expect(orderPriceRatio(order('classico'), prices)).toBeCloseTo(1)
  })
})
