import { beforeEach, describe, expect, it } from 'vitest'
import { SHIFT, DEMAND, ECONOMY } from '../config'
import { useGameStore } from './gameStore'

// O store usa localStorage (persist); no ambiente de teste (node) ele simplesmente não grava.
const state = () => useGameStore.getState()

function runUntilEnd() {
  for (let i = 0; i < (SHIFT.durationSeconds + DEMAND.closingGraceSeconds) * 12; i++) {
    state().tick(0.1)
    if (state().screen === 'summary') break
  }
}

describe('fluxo do dia no store', () => {
  beforeEach(() => {
    state().newGame()
  })

  it('novo jogo começa na preparação do dia 1, com caixa e estoque iniciais', () => {
    expect(state().screen).toBe('prep')
    expect(state().player).toMatchObject({ day: 1, money: ECONOMY.startingMoney, phase: 'prep' })
  })

  it('abrir a lanchonete vai para a cozinha e guarda o estado de abertura', () => {
    state().openShop()
    expect(state().screen).toBe('kitchen')
    expect(state().player.phase).toBe('open')
    expect(state().player.dayStart?.day).toBe(1)
    expect(state().session.stock).toEqual(state().player.stock)
  })

  it('o dia fecha uma única vez, mesmo com ticks extras depois do fim', () => {
    state().openShop()
    runUntilEnd()
    expect(state().screen).toBe('summary')
    const afterClose = state().player
    expect(afterClose.day).toBe(2)
    for (let i = 0; i < 50; i++) state().tick(0.1) // ticks atrasados não podem fechar de novo
    expect(state().player).toEqual(afterClose)
    expect(state().summary?.day).toBe(1)
  })

  it('o resumo desconta os custos fixos uma vez e volta para a preparação do dia seguinte', () => {
    state().openShop()
    const before = state().player.money
    runUntilEnd()
    const fixed = ECONOMY.fixedCosts.reduce((s, c) => s + c.amount, 0)
    expect(state().summary?.fixedCosts.reduce((s, c) => s + c.amount, 0)).toBe(fixed)
    expect(state().player.money).toBeLessThanOrEqual(before - fixed + 1_000) // ganhos só podem vir de entregas (nenhuma aqui)
    state().afterSummary()
    expect(state().screen).toBe('prep')
    expect(state().player.phase).toBe('prep')
  })

  it('recarregar no meio do dia recomeça o dia sem manter ganhos nem consumo', () => {
    state().openShop()
    const opened = state().player
    // simula ganhos e consumo durante o dia
    useGameStore.setState({ player: { ...state().player, money: opened.money + 999, xp: 77 } })
    state().goTo('title')
    state().continueGame()
    expect(state().screen).toBe('prep')
    expect(state().player.money).toBe(opened.money)
    expect(state().player.xp).toBe(opened.xp)
    expect(state().player.phase).toBe('prep')
    expect(state().notice).toMatch(/interrompido/)
  })

  it('comprar estoque e ajustar preços na preparação', () => {
    const before = state().player
    state().buyStock({ patty: 10 })
    expect(state().player.stock.patty).toBe(before.stock.patty + 10)
    expect(state().player.money).toBeLessThan(before.money)
    state().setPrice('recipe:simples', 17)
    expect(state().player.prices['recipe:simples']).toBe(17)
  })

  it('falência leva à tela de falência e dá para recomeçar', () => {
    useGameStore.setState({ player: { ...state().player, bankrupt: true } })
    state().goTo('title')
    state().continueGame()
    expect(state().screen).toBe('bankrupt')
    state().newGame()
    expect(state().screen).toBe('prep')
    expect(state().player.bankrupt).toBe(false)
  })

  it('o empréstimo só é concedido uma vez e só no vermelho', () => {
    state().takeLoan() // caixa positivo: nada acontece
    expect(state().player.loan.taken).toBe(false)
    useGameStore.setState({ player: { ...state().player, money: -50 } })
    state().takeLoan()
    expect(state().player.loan.taken).toBe(true)
    const money = state().player.money
    useGameStore.setState({ player: { ...state().player, money: -1 } })
    state().takeLoan()
    expect(state().player.money).toBe(-1)
    expect(money).toBeGreaterThan(0)
  })
})
