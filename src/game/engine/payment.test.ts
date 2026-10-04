import { describe, expect, it } from 'vitest'
import { DRINK_CONFIG, ECONOMY, RECIPES } from '../config'
import { computeTip, perfectPattyBonus, wrongItemPay } from './payment'
import { defaultPrices, drinkKey, itemPrice, orderPrice, recipeKey, sideKey } from './pricing'
import { order } from './testing'

const prices = defaultPrices()

describe('preços do pedido', () => {
  it('o preço do pedido soma lanches, acompanhamentos, bebidas e sobremesas', () => {
    const base = itemPrice(prices, recipeKey('simples'))
    expect(orderPrice(order('simples'), prices)).toBe(base)
    expect(orderPrice(order('simples', { sides: ['fries'] }), prices)).toBe(base + itemPrice(prices, sideKey('fries')))
    expect(orderPrice(order('simples', { sides: ['fries'], drinks: [{ kind: 'soda', size: 'large' }] }), prices)).toBe(
      base + itemPrice(prices, sideKey('fries')) + DRINK_CONFIG.soda.basePrice.large,
    )
    expect(orderPrice(order('simples', { desserts: ['brownie'] }), prices)).toBe(base + 9)
  })

  it('um pedido de família soma todos os lanches', () => {
    const family = { burgers: ['simples', 'classico', 'simples'], sides: [], drinks: [], desserts: [] }
    expect(orderPrice(family, prices)).toBe(2 * 14 + 18)
  })

  it('usa os preços ajustados pelo jogador', () => {
    const custom = { ...prices, [recipeKey('simples')]: 20, [sideKey('fries')]: 10, [drinkKey('soda', 'small')]: 7 }
    expect(orderPrice(order('simples', { sides: ['fries'], drinks: [{ kind: 'soda', size: 'small' }] }), custom)).toBe(37)
  })

  it('copos maiores custam mais por padrão, em todas as bebidas', () => {
    for (const cfg of Object.values(DRINK_CONFIG)) {
      expect(cfg.basePrice.large).toBeGreaterThan(cfg.basePrice.medium)
      expect(cfg.basePrice.medium).toBeGreaterThan(cfg.basePrice.small)
    }
  })

  it('todo item vendido tem preço padrão positivo', () => {
    for (const r of RECIPES) expect(itemPrice(prices, recipeKey(r.id))).toBe(r.basePrice)
    expect(Object.values(prices).every((p) => p > 0)).toBe(true)
  })
})

describe('gorjeta e bônus', () => {
  it('item errado paga só uma fração', () => {
    expect(wrongItemPay(20)).toBe(Math.round(20 * ECONOMY.wrongPayFraction))
  })

  it('a gorjeta cresce com a nota e com a rapidez', () => {
    expect(computeTip(40, 1, 1)).toBe(0)
    expect(computeTip(40, 2, 1)).toBe(0)
    expect(computeTip(40, 5, 1)).toBeGreaterThan(computeTip(40, 4, 1))
    expect(computeTip(40, 4, 1)).toBeGreaterThan(computeTip(40, 3, 1))
    expect(computeTip(40, 5, 1)).toBeGreaterThan(computeTip(40, 5, 0))
    expect(computeTip(40, 5, 0)).toBeGreaterThan(0)
  })

  it('preço mais alto reduz a gorjeta, preço mais baixo aumenta', () => {
    expect(computeTip(100, 5, 1, 1.4)).toBeLessThan(computeTip(100, 5, 1, 1))
    expect(computeTip(100, 5, 1, 0.7)).toBeGreaterThan(computeTip(100, 5, 1, 1))
  })

  it('limita nota e razão de paciência', () => {
    expect(computeTip(40, 9, 5)).toBe(computeTip(40, 5, 1))
    expect(computeTip(40, 0, -3)).toBe(computeTip(40, 1, 0))
  })

  it('bônus de carne no ponto é proporcional às proteínas perfeitas', () => {
    expect(perfectPattyBonus(20, 0)).toBe(0)
    expect(perfectPattyBonus(20, 1)).toBe(Math.round(20 * ECONOMY.perfectPattyBonusFraction))
    expect(perfectPattyBonus(20, 1)).toBeGreaterThan(perfectPattyBonus(20, 0.5))
  })
})
