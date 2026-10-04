import { describe, expect, it } from 'vitest'
import { ECONOMY, RECIPES } from '../config'
import { computePayment, recipePrice } from './payment'

const simples = RECIPES.find((r) => r.id === 'simples')!

describe('pagamento', () => {
  it('preço = custo dos ingredientes × markup', () => {
    // pão 2 + hambúrguer 5 + pão 2 = 9 × 1.6 = 14.4 → 14
    expect(recipePrice(simples)).toBe(Math.round(9 * ECONOMY.priceMarkup))
  })

  it('certo: preço cheio + gorjeta proporcional à paciência', () => {
    const price = recipePrice(simples)
    const full = computePayment(simples, 1, true)
    expect(full.base).toBe(price)
    expect(full.tip).toBe(Math.round(price * ECONOMY.tipMaxFraction))
    expect(full.total).toBe(full.base + full.tip)
    expect(computePayment(simples, 0, true).tip).toBe(0)
    expect(computePayment(simples, 0.5, true).tip).toBeLessThan(full.tip)
  })

  it('errado: paga fração do preço e sem gorjeta', () => {
    const wrong = computePayment(simples, 1, false)
    expect(wrong.tip).toBe(0)
    expect(wrong.total).toBe(Math.round(recipePrice(simples) * ECONOMY.wrongPayFraction))
    expect(wrong.total).toBeLessThan(computePayment(simples, 0, true).total)
  })

  it('limita a razão de paciência entre 0 e 1', () => {
    expect(computePayment(simples, 5, true)).toEqual(computePayment(simples, 1, true))
    expect(computePayment(simples, -3, true)).toEqual(computePayment(simples, 0, true))
  })
})
