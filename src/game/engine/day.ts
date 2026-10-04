import { CUSTOMER_RULES, ECONOMY, LOAN, STOCK_IDS } from '../config'
import { ageStock, type SpoilReport } from './stock'
import type { PlayerCore, PlayerState, SessionState } from './types'

const coreOf = ({ phase, dayStart, ...core }: PlayerState): PlayerCore => core

/** Abre a lanchonete: guarda o estado de abertura (se a página recarregar, o dia recomeça dele). */
export function openDay(player: PlayerState): PlayerState {
  return { ...player, phase: 'open', dayStart: coreOf(player) }
}

/** Volta ao estado de abertura do dia interrompido; sem dia em andamento, só garante a fase de preparação. */
export function restoreDayStart(player: PlayerState): PlayerState {
  if (player.phase !== 'open' || !player.dayStart) return { ...player, phase: 'prep', dayStart: null }
  return { ...player.dayStart, phase: 'prep', dayStart: null }
}

export const canTakeLoan = (player: PlayerState): boolean => player.money < 0 && !player.loan.taken

export const loanTotal = (): number => Math.round(LOAN.amount * (1 + LOAN.interestRate))
export const loanInstallment = (): number => Math.ceil(loanTotal() / LOAN.installments)

/** Empréstimo com juros: entra dinheiro agora e as parcelas saem no fechamento de cada dia. Só uma vez. */
export function takeLoan(player: PlayerState): PlayerState {
  if (!canTakeLoan(player)) return player
  return {
    ...player,
    money: player.money + LOAN.amount,
    loan: { taken: true, installmentsLeft: LOAN.installments, installment: loanInstallment() },
  }
}

export interface DaySummary {
  day: number
  served: number
  lost: number
  revenue: number
  tips: number
  purchases: number
  fixedCosts: { id: string; name: string; amount: number }[]
  loanPayment: number
  /** Compras + custos fixos + parcela do empréstimo. */
  expenses: number
  /** Faturamento + gorjetas − gastos (variação do caixa no dia, sem contar a entrada do empréstimo). */
  netProfit: number
  /** Nota média dos atendimentos (null se ninguém foi atendido). */
  avgStars: number | null
  xpGained: number
  bestSeller: { recipeId: string; count: number } | null
  spoiled: SpoilReport[]
  moneyAfter: number
  debtDays: number
  bankrupt: boolean
  reputation: number
  /** Nível ao abrir o dia (para o resumo comemorar se subiu). */
  level: number
  /** Movimento extra de amanhã por influenciadores bem atendidos hoje (0 = nenhum; 0.12 = +12%). */
  nextDayBoost: number
}

/** Fecha o dia: cobra custos fixos e parcela, envelhece o estoque, confere a falência e monta o resumo. */
export function closeDay(player: PlayerState, session: SessionState): { player: PlayerState; summary: DaySummary } {
  const { stats } = session
  const fixedCosts = ECONOMY.fixedCosts.map((c) => ({ id: c.id, name: c.name, amount: c.amount }))
  const fixedTotal = fixedCosts.reduce((sum, c) => sum + c.amount, 0)
  const loanPayment = player.loan.installmentsLeft > 0 ? player.loan.installment : 0
  const money = player.money - fixedTotal - loanPayment

  const aged = ageStock(session.stock, player.stockAge)
  const debtDays = money < 0 ? player.debtDays + 1 : 0
  const bankrupt = debtDays >= ECONOMY.bankruptcyDays
  const expenses = player.todayPurchases + fixedTotal + loanPayment
  const boost = Math.min(CUSTOMER_RULES.influencerBoost.max, stats.influencerHappy * CUSTOMER_RULES.influencerBoost.perCustomer)

  const entries = Object.entries(stats.soldByRecipe)
  const best = entries.reduce<[string, number] | null>((acc, e) => (!acc || e[1] > acc[1] ? e : acc), null)

  const next: PlayerState = {
    ...player,
    money,
    day: player.day + 1,
    stock: aged.stock,
    stockAge: aged.stockAge,
    loan:
      loanPayment > 0 ? { ...player.loan, installmentsLeft: player.loan.installmentsLeft - 1 } : player.loan,
    debtDays,
    bankrupt,
    todayPurchases: 0,
    dayBoost: 1 + boost,
    phase: 'prep',
    dayStart: null,
  }

  return {
    player: next,
    summary: {
      day: player.day,
      served: stats.served,
      lost: stats.lost,
      revenue: stats.revenue,
      tips: stats.tips,
      purchases: player.todayPurchases,
      fixedCosts,
      loanPayment,
      expenses,
      netProfit: stats.revenue + stats.tips - expenses,
      avgStars: stats.served > 0 ? stats.starsTotal / stats.served : null,
      xpGained: stats.xpGained,
      bestSeller: best ? { recipeId: best[0], count: best[1] } : null,
      spoiled: aged.spoiled,
      moneyAfter: money,
      debtDays,
      bankrupt,
      reputation: player.reputation,
      level: player.level,
      nextDayBoost: boost,
    },
  }
}

/** Itens do estoque que estão no vermelho (acabaram), para avisos. */
export const emptyStockIds = (player: PlayerState) => STOCK_IDS.filter((id) => player.stock[id] <= 0)
