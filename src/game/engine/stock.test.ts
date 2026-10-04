import { describe, expect, it } from 'vitest'
import { INGREDIENTS, MAX_STOCK, RECIPES, STOCK_IDS, STOCK_ITEMS, UNLOCK_GIFT_UNITS } from '../config'
import { placeCookable } from './cookers'
import { chooseCup } from './drinks'
import { placeRawPatty } from './grill'
import { addPattyToBurger, addToBurger, canAddToBurger } from './session'
import {
  ageStock,
  cartCost,
  clampCart,
  cookableCost,
  daysUntilSpoil,
  drinkCost,
  filledStock,
  purchaseStock,
  recipeCost,
  startingStock,
  unlockGifts,
} from './stock'
import { testPlayer, testSession } from './testing'
import { scoopIceCream } from './desserts'
import type { StockId } from './types'

const sessionWith = (stock: Partial<Record<StockId, number>>, level = 50) => testSession(1, { level, stock: { ...filledStock(0), ...stock } })

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

  it('cada tipo de pão gasta o seu estoque', () => {
    const s = addToBurger(sessionWith({ brioche: 2, bun: 2 }), 'briocheBottom').session
    expect(s.stock.brioche).toBe(1)
    expect(s.stock.bun).toBe(2)
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

  it('a proteína gasta estoque ao ir para a chapa, não ao entrar no lanche', () => {
    const grilled = placeRawPatty(sessionWith({ patty: 1 }), 0).session
    expect(grilled.stock.patty).toBe(0)
    expect(placeRawPatty(grilled, 1).session).toBe(grilled)
    const held = { ...grilled, burger: ['bunBottom' as const], held: [{ id: 'patty' as const, quality: 'perfect' as const }] }
    expect(addPattyToBurger(held, 0).session.stock.patty).toBe(0)
  })

  it('o acompanhamento gasta o estoque dele ao ir para o óleo', () => {
    const fried = placeCookable(sessionWith({ potato: 1, rusticPotato: 3 }), 'fryer', 0, 'fries').session
    expect(fried.stock.potato).toBe(0)
    const rustic = placeCookable(sessionWith({ potato: 1, rusticPotato: 3 }), 'fryer', 0, 'rustic').session
    expect(rustic.stock.rusticPotato).toBe(2)
    const empty = sessionWith({ potato: 0 })
    expect(placeCookable(empty, 'fryer', 0, 'fries').session).toBe(empty)
  })

  it('o brownie gasta estoque ao ir para o forno e o sorvete ao ser servido', () => {
    expect(placeCookable(sessionWith({ brownie: 2 }), 'oven', 0, 'brownie').session.stock.brownie).toBe(1)
    const scoop = scoopIceCream(sessionWith({ iceCream: 1 })).session
    expect(scoop.stock.iceCream).toBe(0)
    expect(scoop.tray.desserts).toEqual([{ id: 'iceCream' }])
    const none = sessionWith({ iceCream: 0 })
    expect(scoopIceCream(none).session).toBe(none)
  })

  it('o copo gasta a bebida certa conforme o tamanho', () => {
    const s = chooseCup(sessionWith({ soda: 5, juice: 5 }), 'juice', 'large').session
    expect(s.stock.juice).toBe(2)
    expect(s.stock.soda).toBe(5)
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
    expect(purchaseStock(p, { lettuce: 10 }).stockAge.lettuce).toBeCloseTo(1)
  })
})

describe('custos e estoque inicial', () => {
  it('o custo de um lanche vem do estoque dos ingredientes', () => {
    const simples = RECIPES.find((r) => r.id === 'simples')!
    expect(recipeCost(simples)).toBe(STOCK_ITEMS.bun.unitCost + STOCK_ITEMS.patty.unitCost)
    const supreme = RECIPES.find((r) => r.id === 'supreme')!
    // 2 carnes, pão australiano, cheddar, cheddar cremoso, bacon, cebola caramelizada, ovo, barbecue
    expect(recipeCost(supreme)).toBe(6 + 4 + 2 + 2 + 4 + 2 + 2 + 1 + 1)
  })

  it('cada ingrediente que gasta estoque aponta para um item de estoque que existe', () => {
    for (const ing of Object.values(INGREDIENTS)) if (ing.stock) expect(STOCK_IDS).toContain(ing.stock)
  })

  it('custo de acompanhamentos e bebidas', () => {
    expect(cookableCost('loaded')).toBe(STOCK_ITEMS.potato.unitCost + STOCK_ITEMS.cheddar.unitCost + STOCK_ITEMS.bacon.unitCost)
    expect(drinkCost('shakeChocolate', 'large')).toBeGreaterThan(drinkCost('soda', 'large'))
    expect(drinkCost('soda', 'large')).toBeGreaterThan(drinkCost('soda', 'small'))
  })

  it('no nível 1 só há estoque dos itens iniciais; níveis maiores ganham presente dos liberados', () => {
    const start = startingStock(1)
    expect(start.bun).toBe(STOCK_ITEMS.bun.startingStock)
    expect(start.bacon).toBe(0)
    expect(start.juice).toBe(0)
    const mid = startingStock(6)
    expect(mid.cheddar).toBe(UNLOCK_GIFT_UNITS)
    expect(mid.bacon).toBe(UNLOCK_GIFT_UNITS)
    expect(mid.creamyCheddar).toBe(0) // nível 14
  })

  it('liberar itens dá estoque de presente só dos itens novos', () => {
    const s = unlockGifts(filledStock(0), 1, 4)
    expect(s.cheddar).toBe(UNLOCK_GIFT_UNITS) // nível 2
    expect(s.onion).toBe(UNLOCK_GIFT_UNITS) // nível 3
    expect(s.bacon).toBe(UNLOCK_GIFT_UNITS) // nível 4
    expect(s.pickles).toBe(0) // nível 6
    expect(s.bun).toBe(0)
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
    expect(ageStock({ ...startingStock(), lettuce: 0 }, { lettuce: 2 }).stockAge.lettuce).toBe(0)
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
