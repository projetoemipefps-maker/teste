import { describe, expect, it } from 'vitest'
import { INGREDIENT_STOCK, MAX_STOCK, RECIPES, STOCK_IDS, STOCK_ITEMS } from '../config'
import { chooseCup, discardCup } from './drinks'
import { placeFries } from './fryer'
import { placeRawPatty } from './grill'
import { addPattyToBurger, addToBurger, canAddToBurger, createSession } from './session'
import {
  ageStock,
  cartCost,
  clampCart,
  daysUntilSpoil,
  filledStock,
  friesCost,
  purchaseStock,
  recipeCost,
  startingStock,
} from './stock'
import { testPlayer } from './testing'

const sessionWith = (stock: Partial<Record<(typeof STOCK_IDS)[number], number>>) =>
  createSession(1, { stock: { ...filledStock(0), ...stock } })

describe('consumo de estoque', () => {
  it('montar o lanche gasta estoque; o pão de cima não gasta nada', () => {
    let s = sessionWith({ bun: 2, cheese: 1, lettuce: 1 })
    s = addToBurger(s, 'bunBottom').session
    expect(s.stock.bun).toBe(1)
    s = addToBurger(s, 'cheese').session
    expect(s.stock.cheese).toBe(0)
    s = addToBurger(s, 'bunTop').session
    expect(s.stock.bun).toBe(1)
  })

  it('sem estoque o ingrediente fica indisponível e não é adicionado', () => {
    const s = sessionWith({ bun: 1, cheese: 0, lettuce: 5 })
    const open = addToBurger(s, 'bunBottom').session
    expect(canAddToBurger(open, 'cheese')).toBe(false)
    expect(addToBurger(open, 'cheese').session).toBe(open)
    expect(canAddToBurger(open, 'lettuce')).toBe(true)
    expect(canAddToBurger(open, 'bunTop')).toBe(true)
    expect(canAddToBurger(sessionWith({ bun: 0 }), 'bunBottom')).toBe(false)
  })

  it('a carne gasta estoque ao ir para a chapa, não ao entrar no lanche', () => {
    const s = sessionWith({ patty: 1 })
    const grilled = placeRawPatty(s, 0).session
    expect(grilled.stock.patty).toBe(0)
    expect(placeRawPatty(grilled, 1).session).toBe(grilled) // acabou
    const held = { ...grilled, burger: ['bunBottom' as const], held: ['perfect' as const] }
    expect(addPattyToBurger(held, 0).session.stock.patty).toBe(0)
  })

  it('a batata gasta estoque ao ir para o óleo e não vai sem estoque', () => {
    const fried = placeFries(sessionWith({ potato: 1 }), 0).session
    expect(fried.stock.potato).toBe(0)
    const empty = sessionWith({ potato: 0 })
    expect(placeFries(empty, 0).session).toBe(empty)
  })

  it('o copo gasta refrigerante conforme o tamanho e não vai sem estoque', () => {
    const s = chooseCup(sessionWith({ soda: 5 }), 'large').session
    expect(s.stock.soda).toBe(2)
    const poor = sessionWith({ soda: 1 })
    expect(chooseCup(poor, 'medium').session).toBe(poor)
  })

  it('trocar um copo ainda vazio devolve o refrigerante; jogar fora também', () => {
    let s = chooseCup(sessionWith({ soda: 3 }), 'large').session
    expect(s.stock.soda).toBe(0)
    s = chooseCup(s, 'small').session
    expect(s.stock.soda).toBe(2)
    expect(discardCup(s).session.stock.soda).toBe(3)
    // copo já servido: desperdiça
    const used = { ...s, cup: { size: 'small' as const, fill: 50 } }
    expect(discardCup(used).session.stock.soda).toBe(s.stock.soda)
  })

  it('escolher o mesmo tamanho com o copo vazio não gasta de novo', () => {
    const s = chooseCup(sessionWith({ soda: 3 }), 'small').session
    expect(chooseCup(s, 'small').session).toBe(s)
  })
})

describe('compra de estoque', () => {
  it('o custo do carrinho soma custo unitário × quantidade', () => {
    expect(cartCost({ bun: 10, patty: 10 })).toBe(10 * STOCK_ITEMS.bun.unitCost + 10 * STOCK_ITEMS.patty.unitCost)
    expect(cartCost({})).toBe(0)
  })

  it('comprar desconta o caixa, soma ao estoque e registra o gasto do dia', () => {
    const p = testPlayer({ money: 500 })
    const bought = purchaseStock(p, { bun: 10, lettuce: 50 })
    expect(bought.stock.bun).toBe(p.stock.bun + 10)
    expect(bought.stock.lettuce).toBe(p.stock.lettuce + 50)
    expect(bought.money).toBe(500 - cartCost({ bun: 10, lettuce: 50 }))
    expect(bought.todayPurchases).toBe(cartCost({ bun: 10, lettuce: 50 }))
  })

  it('sem dinheiro suficiente não compra nada', () => {
    const p = testPlayer({ money: 10 })
    expect(purchaseStock(p, { patty: 50 })).toBe(p)
    expect(purchaseStock(p, {})).toBe(p)
  })

  it('não passa da capacidade do estoque', () => {
    const p = testPlayer({ money: 1e6, stock: { ...startingStock(), patty: MAX_STOCK - 5 } })
    expect(purchaseStock(p, { patty: 50 }).stock.patty).toBe(MAX_STOCK)
    expect(clampCart(p.stock, { patty: 50, bun: -3 })).toEqual({ patty: 5 })
  })

  it('comprar fresco com estoque velho rejuvenesce a idade média', () => {
    const p = testPlayer({ money: 500, stock: { ...startingStock(), lettuce: 10 }, stockAge: { lettuce: 2 } })
    const bought = purchaseStock(p, { lettuce: 10 })
    expect(bought.stockAge.lettuce).toBeCloseTo(1)
  })

  it('o custo de um lanche vem do estoque dos ingredientes', () => {
    const simples = RECIPES.find((r) => r.id === 'simples')!
    expect(recipeCost(simples)).toBe(STOCK_ITEMS.bun.unitCost + STOCK_ITEMS.patty.unitCost)
    expect(friesCost()).toBe(STOCK_ITEMS.potato.unitCost)
    for (const r of RECIPES) {
      for (const ing of r.ingredients) expect(ing in INGREDIENT_STOCK).toBe(true)
    }
  })
})

describe('ingredientes frescos', () => {
  it('envelhecem um dia por vez e estragam no limite', () => {
    const limit = STOCK_ITEMS.lettuce.spoilDays!
    let stock = { ...startingStock(), lettuce: 8 }
    let ages = {}
    let spoiledAt = -1
    for (let day = 1; day <= limit; day++) {
      const r = ageStock(stock, ages)
      stock = r.stock
      ages = r.stockAge
      if (r.spoiled.some((s) => s.id === 'lettuce')) spoiledAt = day
    }
    expect(spoiledAt).toBe(limit)
    expect(stock.lettuce).toBe(0)
  })

  it('o estoque que não estraga nunca perde nada', () => {
    let stock = { ...startingStock(), patty: 20, bun: 20 }
    let ages = {}
    for (let i = 0; i < 20; i++) ({ stock, stockAge: ages } = ageStock(stock, ages))
    expect(stock.patty).toBe(20)
    expect(stock.bun).toBe(20)
  })

  it('o relatório diz o que estragou e quanto', () => {
    const limit = STOCK_ITEMS.tomato.spoilDays!
    const r = ageStock({ ...startingStock(), tomato: 7 }, { tomato: limit - 1 })
    expect(r.spoiled).toContainEqual({ id: 'tomato', qty: 7 })
  })

  it('sem estoque, a idade zera', () => {
    const r = ageStock({ ...startingStock(), lettuce: 0 }, { lettuce: 2 })
    expect(r.stockAge.lettuce).toBe(0)
  })

  it('avisa quantos dias faltam para estragar', () => {
    const limit = STOCK_ITEMS.lettuce.spoilDays!
    const stock = { ...startingStock(), lettuce: 4 }
    expect(daysUntilSpoil('lettuce', stock, {})).toBe(limit - 1)
    expect(daysUntilSpoil('lettuce', stock, { lettuce: limit - 1 })).toBe(0)
    expect(daysUntilSpoil('patty', stock, {})).toBeNull()
    expect(daysUntilSpoil('lettuce', { ...stock, lettuce: 0 }, {})).toBeNull()
  })
})
