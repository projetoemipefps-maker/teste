import { describe, expect, it } from 'vitest'
import { DRINKS, ECONOMY, RECIPES } from '../config'
import { computeTip, drinkPrice, orderPrice, perfectPattyBonus, recipePrice, wrongItemPay } from './payment'

const simples = RECIPES.find((r) => r.id === 'simples')!

describe('preços e gorjeta', () => {
  it('preço do lanche = custo dos ingredientes × markup', () => {
    // pão 2 + hambúrguer 5 + pão 2 = 9 × 1.6 = 14.4 → 14
    expect(recipePrice(simples)).toBe(Math.round(9 * ECONOMY.priceMarkup))
  })

  it('o preço do pedido soma lanche, batata e bebida', () => {
    const base = recipePrice(simples)
    expect(orderPrice({ recipeId: 'simples', fries: false, drink: null })).toBe(base)
    expect(orderPrice({ recipeId: 'simples', fries: true, drink: null })).toBe(base + ECONOMY.friesPrice)
    expect(orderPrice({ recipeId: 'simples', fries: true, drink: 'large' })).toBe(
      base + ECONOMY.friesPrice + DRINKS.cups.large.price,
    )
  })

  it('copos maiores custam mais', () => {
    expect(drinkPrice('large')).toBeGreaterThan(drinkPrice('medium'))
    expect(drinkPrice('medium')).toBeGreaterThan(drinkPrice('small'))
  })

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
