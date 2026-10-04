import { describe, expect, it } from 'vitest'
import { COMBOS, DRINKS, ECONOMY, LOAN, RECIPES, STOCK_ITEMS, CUP_SIZES } from '../config'
import { expectedCustomers } from './demand'
import { menuItems } from './pricing'
import { canTakeLoan, closeDay, loanInstallment, loanTotal, openDay, restoreDayStart, takeLoan } from './day'
import { createSession } from './session'
import { filledStock, purchaseStock, startingStock } from './stock'
import { testPlayer } from './testing'
import type { SessionState } from './types'

const fixedTotal = ECONOMY.fixedCosts.reduce((s, c) => s + c.amount, 0)

function played(overrides: Partial<SessionState['stats']> = {}, stock = startingStock()): SessionState {
  return {
    ...createSession(1, { stock }),
    stats: { served: 10, lost: 2, revenue: 300, tips: 40, starsTotal: 40, xpGained: 90, soldByRecipe: { classico: 4, duplo: 6, simples: 1 }, ...overrides },
  }
}

describe('abrir e restaurar o dia', () => {
  it('abrir guarda o estado de abertura e marca o dia como em andamento', () => {
    const p = testPlayer({ money: 400 })
    const opened = openDay(p)
    expect(opened.phase).toBe('open')
    expect(opened.dayStart?.money).toBe(400)
    expect(opened.dayStart).not.toHaveProperty('phase')
  })

  it('recarregar no meio do dia volta ao estado de abertura (sem ganhar dinheiro de graça)', () => {
    const opened = openDay(testPlayer({ money: 400 }))
    const midDay = { ...opened, money: 900, stock: { ...opened.stock, patty: 0 }, xp: 99 }
    const restored = restoreDayStart(midDay)
    expect(restored.money).toBe(400)
    expect(restored.stock.patty).toBe(opened.stock.patty)
    expect(restored.xp).toBe(opened.xp)
    expect(restored.phase).toBe('prep')
    expect(restored.dayStart).toBeNull()
  })

  it('sem dia em andamento, restaurar só garante a fase de preparação', () => {
    const p = testPlayer()
    const r = restoreDayStart(p)
    expect(r.phase).toBe('prep')
    expect(r.money).toBe(p.money)
  })
})

describe('fechamento do dia', () => {
  it('desconta os custos fixos e soma 1 ao dia', () => {
    const p = openDay(testPlayer({ money: 500 }))
    const { player, summary } = closeDay(p, played())
    expect(player.money).toBe(500 - fixedTotal)
    expect(player.day).toBe(p.day + 1)
    expect(player.phase).toBe('prep')
    expect(player.dayStart).toBeNull()
    expect(summary.fixedCosts.map((c) => c.id)).toEqual(['rent', 'power', 'gas'])
    expect(summary.moneyAfter).toBe(player.money)
  })

  it('os custos fixos são aluguel, luz e gás', () => {
    expect(ECONOMY.fixedCosts.map((c) => c.name)).toEqual(['Aluguel', 'Luz', 'Gás'])
  })

  it('resume o dia: atendidos, perdidos, faturamento, gorjetas, gastos, lucro, nota média e XP', () => {
    let p = testPlayer({ money: 1000 })
    p = purchaseStock(p, { patty: 10 }) // gasto de estoque do dia
    const bought = p.todayPurchases
    const { summary } = closeDay(openDay(p), played())
    expect(summary).toMatchObject({ day: 1, served: 10, lost: 2, revenue: 300, tips: 40, xpGained: 90 })
    expect(summary.purchases).toBe(bought)
    expect(summary.expenses).toBe(bought + fixedTotal)
    expect(summary.netProfit).toBe(300 + 40 - (bought + fixedTotal))
    expect(summary.avgStars).toBe(4)
  })

  it('o lucro líquido é a variação do caixa no dia', () => {
    const before = testPlayer({ money: 1000 })
    const bought = purchaseStock(before, { bun: 10 })
    const opened = openDay(bought)
    // durante o dia o jogador recebeu faturamento + gorjetas
    const earned = 340
    const { player, summary } = closeDay({ ...opened, money: opened.money + earned }, played())
    expect(player.money - before.money).toBe(summary.netProfit)
  })

  it('o lanche mais vendido é o de maior contagem; sem vendas, não há', () => {
    expect(closeDay(openDay(testPlayer()), played()).summary.bestSeller).toEqual({ recipeId: 'duplo', count: 6 })
    expect(closeDay(openDay(testPlayer()), played({ soldByRecipe: {}, served: 0, starsTotal: 0 })).summary.bestSeller).toBeNull()
  })

  it('a nota média é nula quando ninguém foi atendido', () => {
    expect(closeDay(openDay(testPlayer()), played({ served: 0, starsTotal: 0 })).summary.avgStars).toBeNull()
  })

  it('o estoque que sobrou passa para o dia seguinte e o frescos envelhecem', () => {
    const stock = { ...startingStock(), patty: 3, lettuce: 5 }
    const { player } = closeDay(openDay(testPlayer()), played({}, stock))
    expect(player.stock.patty).toBe(3)
    expect(player.stock.lettuce).toBe(5)
    expect(player.stockAge.lettuce).toBe(1)
  })

  it('ingredientes parados estragam e entram no resumo', () => {
    const limit = STOCK_ITEMS.lettuce.spoilDays!
    let p = openDay(testPlayer({ stockAge: { lettuce: limit - 1 } }))
    const { player, summary } = closeDay(p, played({}, { ...startingStock(), lettuce: 6 }))
    expect(player.stock.lettuce).toBe(0)
    expect(summary.spoiled).toContainEqual({ id: 'lettuce', qty: 6 })
    p = player
  })

  it('zera o gasto de compras do dia', () => {
    const p = purchaseStock(testPlayer({ money: 1000 }), { patty: 5 })
    expect(closeDay(openDay(p), played()).player.todayPurchases).toBe(0)
  })
})

describe('caixa negativo, empréstimo e falência', () => {
  const closeWith = (money: number, overrides = {}) => closeDay(openDay(testPlayer({ money, ...overrides })), played())

  it('caixa positivo depois dos custos não conta dívida', () => {
    const { player, summary } = closeWith(1000, { debtDays: 2 })
    expect(player.debtDays).toBe(0)
    expect(summary.bankrupt).toBe(false)
  })

  it('caixa negativo depois dos custos soma um dia de dívida', () => {
    const { player, summary } = closeWith(fixedTotal - 50)
    expect(player.money).toBe(-50)
    expect(player.debtDays).toBe(1)
    expect(summary.debtDays).toBe(1)
    expect(player.bankrupt).toBe(false)
  })

  it('3 dias seguidos no vermelho = falência', () => {
    expect(closeWith(-500, { debtDays: 1 }).player.bankrupt).toBe(false)
    const { player, summary } = closeWith(-500, { debtDays: ECONOMY.bankruptcyDays - 1 })
    expect(player.bankrupt).toBe(true)
    expect(summary.bankrupt).toBe(true)
  })

  it('o empréstimo só é oferecido com o caixa negativo, e uma única vez', () => {
    expect(canTakeLoan(testPlayer({ money: 100 }))).toBe(false)
    expect(canTakeLoan(testPlayer({ money: -1 }))).toBe(true)
    const p = testPlayer({ money: -100 })
    const loaned = takeLoan(p)
    expect(loaned.money).toBe(-100 + LOAN.amount)
    expect(loaned.loan).toEqual({ taken: true, installmentsLeft: LOAN.installments, installment: loanInstallment() })
    expect(canTakeLoan({ ...loaned, money: -1 })).toBe(false)
    expect(takeLoan({ ...loaned, money: -1 }).money).toBe(-1)
    expect(takeLoan(testPlayer({ money: 100 }))).toEqual(testPlayer({ money: 100 }))
  })

  it('o empréstimo tem juros: paga-se mais do que se pegou', () => {
    expect(loanTotal()).toBe(Math.round(LOAN.amount * (1 + LOAN.interestRate)))
    expect(loanInstallment() * LOAN.installments).toBeGreaterThanOrEqual(loanTotal())
    expect(loanTotal()).toBeGreaterThan(LOAN.amount)
  })

  it('as parcelas saem no fechamento e acabam depois da última', () => {
    let p = openDay(takeLoan(testPlayer({ money: -10 })))
    p = { ...p, money: 10_000 }
    const first = closeDay(p, played())
    expect(first.summary.loanPayment).toBe(loanInstallment())
    expect(first.player.money).toBe(10_000 - fixedTotal - loanInstallment())
    expect(first.player.loan.installmentsLeft).toBe(LOAN.installments - 1)
    expect(first.summary.expenses).toBe(fixedTotal + loanInstallment())

    let cur = first.player
    for (let i = 1; i < LOAN.installments; i++) cur = closeDay({ ...openDay(cur), money: 10_000 }, played()).player
    expect(cur.loan.installmentsLeft).toBe(0)
    expect(closeDay({ ...openDay(cur), money: 10_000 }, played()).summary.loanPayment).toBe(0)
    expect(cur.loan.taken).toBe(true) // continua marcado: não dá para pedir de novo
  })

  it('o empréstimo ajuda a sair do vermelho e evitar a falência', () => {
    const broke = testPlayer({ money: -200, debtDays: 1 })
    const loaned = takeLoan(broke)
    expect(loaned.money).toBeGreaterThan(0)
    expect(closeDay(openDay({ ...loaned, money: 3000 }), played()).player.debtDays).toBe(0)
  })

  it('só os ingredientes frescos estragam (carne, pão, queijo, batata e refri não)', () => {
    const ages = { lettuce: 2, tomato: 2 }
    const { summary } = closeDay(openDay(testPlayer({ stockAge: ages })), played({}, filledStock(5)))
    expect(summary.spoiled.map((s) => s.id).sort()).toEqual(['lettuce', 'tomato'])
  })
})

describe('economia: balanceamento básico', () => {
  /** Lucro médio por pedido (preço − custo de estoque), ponderando lanches e combos pelo sorteio real. */
  function averageMarginPerOrder(): number {
    const items = menuItems()
    const margin = (key: string) => {
      const item = items.find((i) => i.key === key)!
      return item.basePrice - item.cost
    }
    const burger = RECIPES.reduce((s, r) => s + margin(`recipe:${r.id}`), 0) / RECIPES.length
    const drink = CUP_SIZES.reduce((s, c) => s + margin(`drink:${c}`), 0) / CUP_SIZES.length
    const totalWeight = COMBOS.reduce((s, c) => s + c.weight, 0)
    const pFries = COMBOS.filter((c) => c.fries).reduce((s, c) => s + c.weight, 0) / totalWeight
    const pDrink = COMBOS.filter((c) => c.drink).reduce((s, c) => s + c.weight, 0) / totalWeight
    return burger + pFries * margin('fries') + pDrink * drink
  }

  it('o ponto de equilíbrio (cobrir os custos fixos) exige bem menos pedidos que a clientela esperada', () => {
    const breakEven = fixedTotal / averageMarginPerOrder()
    const expected = expectedCustomers(testPlayer())
    expect(breakEven).toBeGreaterThan(5) // não é grátis ficar aberto
    expect(breakEven).toBeLessThan(expected * 0.6) // atendendo bem, dá lucro
  })

  it('o estoque inicial e o caixa inicial cobrem o primeiro dia de custos fixos', () => {
    const p = testPlayer()
    expect(p.money).toBeGreaterThan(fixedTotal)
    expect(p.stock.patty).toBeGreaterThan(5)
    expect(DRINKS.cups.small.sodaUnits).toBeGreaterThan(0)
  })
})
