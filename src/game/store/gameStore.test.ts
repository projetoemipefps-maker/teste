import { beforeEach, describe, expect, it } from 'vitest'
import { SHIFT, DEMAND, ECONOMY, PROGRESSION } from '../config'
import { order, testCustomer } from '../engine/testing'
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

/** Cliente esperando um "Simples" e um lanche perfeito já na bandeja: servir rende 18 XP no nível 1. */
function readyToServe(xp: number, level = 1) {
  useGameStore.setState({ player: { ...state().player, level } })
  state().openShop()
  const session = state().session
  useGameStore.setState({
    player: { ...state().player, xp },
    session: {
      ...session,
      slots: [testCustomer(order('simples')), null, null],
      selectedSlot: 0,
      tray: { ...session.tray, burgers: [{ ingredients: ['bunBottom', 'patty', 'bunTop'], patties: ['perfect'] }] },
    },
  })
}

describe('subir de nível no store', () => {
  beforeEach(() => {
    state().newGame()
  })

  it('XP suficiente na entrega abre a tela de nível novo, pausa o jogo e libera o desbloqueio', () => {
    readyToServe(PROGRESSION.earlyXp[0]! - 1)
    state().serve()
    expect(state().player.level).toBe(2)
    expect(state().levelUp).toMatchObject({ from: 1, level: 2 })
    expect(state().levelUp?.unlocks.length).toBeGreaterThan(0)
    expect(state().paused).toBe(true)
  })

  it('continuar fecha a tela e retoma o jogo', () => {
    readyToServe(PROGRESSION.earlyXp[0]! - 1)
    state().serve()
    state().dismissLevelUp()
    expect(state().levelUp).toBeNull()
    expect(state().paused).toBe(false)
  })

  it('sem XP suficiente não aparece tela de nível novo', () => {
    readyToServe(0, 10)
    state().serve()
    expect(state().levelUp).toBeNull()
    expect(state().player.level).toBe(10)
    expect(state().player.xp).toBeGreaterThan(0)
  })

  it('fechar a tela de nível novo não despausa se a montagem de referência estiver aberta', () => {
    readyToServe(PROGRESSION.earlyXp[0]! - 1)
    state().serve()
    useGameStore.setState({ referenceSlot: 0 })
    state().dismissLevelUp()
    expect(state().paused).toBe(true)
  })
})

describe('montagem de referência e livro de receitas', () => {
  beforeEach(() => {
    state().newGame()
  })

  it('abrir a referência pausa o dia e fechar retoma', () => {
    state().openShop()
    state().openReference(0)
    expect(state().referenceSlot).toBe(0)
    expect(state().paused).toBe(true)
    state().closeReference()
    expect(state().referenceSlot).toBeNull()
    expect(state().paused).toBe(false)
  })

  it('fechar a referência mantém a pausa se houver nível novo pendente', () => {
    state().openShop()
    state().openReference(0)
    useGameStore.setState({ levelUp: { from: 1, level: 2, unlocks: [] } })
    state().closeReference()
    expect(state().paused).toBe(true)
  })

  it('o livro de receitas volta para a tela de onde foi aberto', () => {
    expect(state().screen).toBe('prep')
    state().openRecipeBook()
    expect(state().screen).toBe('recipes')
    state().closeRecipeBook()
    expect(state().screen).toBe('prep')

    state().openShop()
    state().setPaused(true)
    state().openRecipeBook()
    expect(state().screen).toBe('recipes')
    state().closeRecipeBook()
    expect(state().screen).toBe('kitchen')
  })

  it('abrir o livro duas vezes seguidas não perde a tela de origem', () => {
    state().openRecipeBook()
    state().openRecipeBook()
    state().closeRecipeBook()
    expect(state().screen).toBe('prep')
  })
})
