import { describe, expect, it } from 'vitest'
import { DRINKS, ECONOMY, RECIPES } from '../config'
import { computeTip, perfectPattyBonus, wrongItemPay } from './payment'
import { FRIES_KEY, defaultPrices, drinkKey, itemPrice, orderPrice, recipeKey } from './pricing'

const prices = defaultPrices()

describe('preços do pedido', () => {
  it('o preço do pedido soma lanche, batata e bebida', () => {
    const base = itemPrice(prices, recipeKey('simples'))
    expect(orderPrice({ recipeId: 'simples', fries: false, drink: null }, prices)).toBe(base)
    expect(orderPrice({ recipeId: 'simples', fries: true, drink: null }, prices)).toBe(base + ECONOMY.friesBasePrice)
    expect(orderPrice({ recipeId: 'simples', fries: true, drink: 'large' }, prices)).toBe(
      base + ECONOMY.friesBasePrice + DRINKS.cups.large.basePrice,
    )
  })

  it('usa os preços ajustados pelo jogador', () => {
    const custom = { ...prices, [recipeKey('simples')]: 20, [FRIES_KEY]: 10, [drinkKey('small')]: 7 }
    expect(orderPrice({ recipeId: 'simples', fries: true, drink: 'small' }, custom)).toBe(37)
  })

  it('copos maiores custam mais por padrão', () => {
    expect(itemPrice(prices, drinkKey('large'))).toBeGreaterThan(itemPrice(prices, drinkKey('medium')))
    expect(itemPrice(prices, drinkKey('medium'))).toBeGreaterThan(itemPrice(prices, drinkKey('small')))
  })

  it('todo lanche e item vendidos têm preço padrão positivo', () => {
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
    expect(computeTip(40, 5, 0)).toBeGreaterThan(0) // piso de rapidez
  })

  it('preço mais alto reduz a gorjeta, preço mais baixo aumenta', () => {
    expect(computeTip(100, 5, 1, 1.4)).toBeLessThan(computeTip(100, 5, 1, 1))
    expect(computeTip(100, 5, 1, 0.7)).toBeGreaterThan(computeTip(100, 5, 1, 1))
  })

  it('limita nota e razão de paciência', () => {
    expect(computeTip(40, 9, 5)).toBe(computeTip(40, 5, 1))
    expect(computeTip(40, 0, -3)).toBe(computeTip(40, 1, 0))
  })

  it('bônus de carne no ponto é proporcional às carnes perfeitas', () => {
    expect(perfectPattyBonus(20, 0)).toBe(0)
    expect(perfectPattyBonus(20, 1)).toBe(Math.round(20 * ECONOMY.perfectPattyBonusFraction))
    expect(perfectPattyBonus(20, 1)).toBeGreaterThan(perfectPattyBonus(20, 0.5))
  })
})
