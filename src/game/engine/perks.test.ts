import { describe, expect, it } from 'vitest'
import { COOKABLES, DECOR, DECOR_IDS, DRINKS, DRINK_CONFIG, ECONOMY, GRILL, SHIFT, STOCK_ITEMS, TRAY, UPGRADES, UPGRADE_IDS, VENUES } from '../config'
import { closeDay, effectiveDayMultiplier, expectedCustomers } from './index'
import { rollCustomer } from './customers'
import { cupFillRatio, cupQuality, pourCup } from './drinks'
import { alarmRinging, createPatty, pattyHint, placeRawPatty } from './grill'
import { grillAlert } from './alerts'
import { takeCookable, placeCookable } from './cookers'
import { evaluateService } from './serve'
import { addToBurger, createSession, discardBurger, sendBurgerToTray, swapBench } from './session'
import { ageStock, daysUntilSpoil, filledStock, purchaseStock, roomFor, startingStock } from './stock'
import { step } from './tick'
import { order, testCustomer, testPerks, testPlayer, testSession } from './testing'
import { basePerks, computePerks, emptyDecor, emptyUpgrades } from './upgrades'
import type { Cup, GrillPatty, SessionState, Tray } from './types'

const player = testPlayer
const perksWith = (overrides: Parameters<typeof testPerks>[0]) => testPerks(overrides)

describe('chapa mais quente e alarme', () => {
  const heatAfter = (speed: number, seconds: number) => {
    let s = placeRawPatty(testSession(1, { perks: perksWith({ grillSpeed: speed }) }), 0).session
    s = { ...s, spawnTimer: 999 }
    const dt = SHIFT.maxDeltaSeconds
    for (let t = 0; t < seconds - 1e-9; t += dt) s = step(s, player(), dt).session
    return s.grill[0]!.sides[0]
  }

  it('com cozimento mais rápido a carne esquenta mais por segundo', () => {
    expect(heatAfter(1, 4)).toBeCloseTo(4, 1)
    expect(heatAfter(1.4, 4)).toBeCloseTo(5.6, 1)
  })

  it('os tempos da carne continuam os mesmos (só passam mais depressa): crua, ponto, passada, queimada', () => {
    const t = GRILL.kinds.patty
    const raw = createPatty('patty')
    expect(pattyHint({ ...raw, sides: [t.done, t.done], flips: 1 })).toBe('take')
    expect(pattyHint({ ...raw, sides: [t.overdone, t.done], flips: 1 })).toBe('overdone')
  })

  const perfect = (hot: number): GrillPatty => ({ kind: 'patty', sides: [hot, GRILL.kinds.patty.done], down: 0, flips: 1 })

  it('o alarme toca nos últimos segundos do ponto e só com a melhoria', () => {
    const ring = { grillAlarm: 2, grillSpeed: 1 }
    const overdone = GRILL.kinds.patty.overdone
    expect(alarmRinging(perfect(overdone - 2.5), ring)).toBe(false)
    expect(alarmRinging(perfect(overdone - 1.9), ring)).toBe(true)
    expect(alarmRinging(perfect(overdone - 1.9), { grillAlarm: 0, grillSpeed: 1 })).toBe(false)
    // já passou do ponto: não é mais alarme, é "passou"
    expect(alarmRinging({ ...perfect(overdone), sides: [overdone, 7] }, ring)).toBe(false)
    // crua não toca (o aviso certo é o de virar)
    expect(alarmRinging({ kind: 'patty', sides: [overdone - 1, 1], down: 0, flips: 1 }, ring)).toBe(false)
  })

  it('a chapa mais quente adianta o alarme na mesma proporção (segundos de relógio)', () => {
    const overdone = GRILL.kinds.patty.overdone
    const p = perfect(overdone - 3)
    expect(alarmRinging(p, { grillAlarm: 2, grillSpeed: 1 })).toBe(false)
    expect(alarmRinging(p, { grillAlarm: 2, grillSpeed: 2 })).toBe(true)
  })

  it('a dica da carne vira "alarm" e a aba da chapa pede atenção', () => {
    const overdone = GRILL.kinds.patty.overdone
    const p = perfect(overdone - 1)
    expect(pattyHint(p)).toBe('take')
    expect(pattyHint(p, { grillAlarm: 2, grillSpeed: 1 })).toBe('alarm')
    const withAlarm = { ...testSession(1, { perks: perksWith({ grillAlarm: 2 }) }), grill: [p, null, null, null] }
    expect(grillAlert(withAlarm)).toBe('warn')
    expect(grillAlert({ ...withAlarm, perks: perksWith({ grillAlarm: 0 }) })).toBe('ready')
  })

  it('o tick avisa uma única vez quando o alarme começa', () => {
    const overdone = GRILL.kinds.patty.overdone
    let s: SessionState = { ...testSession(1, { perks: perksWith({ grillAlarm: 2 }) }), spawnTimer: 999, grill: [perfect(overdone - 2.2), null, null, null] }
    const events: string[] = []
    for (let i = 0; i < 20; i++) {
      const r = step(s, player(), 0.1)
      s = r.session
      events.push(...r.events.map((e) => e.type))
    }
    expect(events.filter((e) => e === 'pattyAlarm')).toHaveLength(1)
    const quiet = { ...s, perks: perksWith({ grillAlarm: 0 }), grill: [perfect(overdone - 2.2), null, null, null] }
    expect(step(quiet, player(), 0.5).events.some((e) => e.type === 'pattyAlarm')).toBe(false)
  })
})

describe('fritadeira e estufa melhoradas', () => {
  const cookTime = (speed: number, station: 'fryer' | 'oven') => {
    let s = testSession(1, { perks: perksWith({ fryerSpeed: speed }) })
    s = placeCookable(s, station, 0, station === 'fryer' ? 'fries' : 'brownie').session
    s = { ...s, spawnTimer: 999 }
    for (let t = 0; t < 4 - 1e-9; t += SHIFT.maxDeltaSeconds) s = step(s, player(), SHIFT.maxDeltaSeconds).session
    return (station === 'fryer' ? s.fryer : s.oven)[0]!.cook
  }

  it('a fritadeira cozinha mais rápido com a melhoria; o forno não muda', () => {
    expect(cookTime(1, 'fryer')).toBeCloseTo(4, 1)
    expect(cookTime(1.5, 'fryer')).toBeCloseTo(6, 1)
    expect(cookTime(1.5, 'oven')).toBeCloseTo(4, 1)
  })

  it('a estufa maior guarda mais porções prontas', () => {
    const full = (size: number) => {
      const s = testSession(1, { perks: perksWith({ warmerSize: size }) })
      const warmer = Array.from({ length: 3 }, () => ({ kind: 'fries' as const, age: 0 }))
      return { ...s, warmer, fryer: [{ kind: 'fries' as const, cook: COOKABLES.fries.readySeconds }, null, null] }
    }
    expect(takeCookable(full(3), 'fryer', 0).session.warmer).toHaveLength(3) // estufa cheia: continua no óleo
    expect(takeCookable(full(3), 'fryer', 0).events).toEqual([])
    expect(takeCookable(full(4), 'fryer', 0).session.warmer).toHaveLength(4)
  })
})

describe('máquina de bebidas automática', () => {
  const cup = (size: Cup['size'] = 'large'): Cup => ({ kind: 'soda', size, fill: 0 })

  it('sem a melhoria é manual: passa do ponto e derrama', () => {
    let c = cup()
    for (let i = 0; i < 60; i++) c = pourCup(c, 0.1).cup
    expect(cupQuality(c)).toBe('spilled')
  })

  it('automática: para sozinha no ponto certo, sem derramar, por mais que o botão fique apertado', () => {
    const auto = { drinkAuto: true, drinkSpeed: 1 }
    let c = cup()
    let finished = false
    for (let i = 0; i < 100; i++) {
      const r = pourCup(c, 0.1, auto)
      c = r.cup
      finished = finished || r.finished
      expect(r.startedSpilling).toBe(false)
    }
    expect(finished).toBe(true)
    expect(cupFillRatio(c)).toBe(1)
    expect(cupQuality(c)).toBe('good')
  })

  it('automática e mais rápida enche no mesmo ponto em menos tempo', () => {
    const seconds = (speed: number) => {
      let c = cup('medium')
      let t = 0
      while (!pourCup(c, 0.05, { drinkAuto: true, drinkSpeed: speed }).finished && t < 60) {
        c = pourCup(c, 0.05, { drinkAuto: true, drinkSpeed: speed }).cup
        t += 0.05
      }
      return t
    }
    expect(seconds(1.6)).toBeLessThan(seconds(1))
    expect(seconds(1)).toBeCloseTo(DRINKS.cups.medium.capacity / DRINK_CONFIG.soda.fillRate, 0)
  })

  it('o tick solta o botão quando a máquina automática termina', () => {
    let s: SessionState = { ...testSession(1, { perks: perksWith({ drinkAuto: true }) }), spawnTimer: 999, cup: cup('small'), pouring: true }
    for (let i = 0; i < 40; i++) s = step(s, player(), 0.1).session
    expect(s.pouring).toBe(false)
    expect(s.cup!.fill).toBe(DRINKS.cups.small.capacity)
    // apertar de novo com o copo cheio não faz nada
    const again = step({ ...s, pouring: true }, player(), 0.1).session
    expect(again.cup!.fill).toBe(DRINKS.cups.small.capacity)
    expect(again.pouring).toBe(false)
  })
})

describe('bancada com dois pratos', () => {
  const two = () => testSession(1, { perks: perksWith({ benches: 2 }) })
  const build = (s: SessionState, ids: Parameters<typeof addToBurger>[1][]) => ids.reduce((acc, id) => addToBurger(acc, id).session, s)

  it('sem a melhoria não troca de prato', () => {
    const s = build(testSession(), ['bunBottom'])
    expect(swapBench(s).session).toBe(s)
    expect(swapBench(s).events).toEqual([])
  })

  it('troca o lanche da frente pelo guardado (e guarda quando o outro prato está vazio)', () => {
    let s = build(two(), ['bunBottom', 'cheese'])
    s = swapBench(s).session
    expect(s.burger).toEqual([])
    expect(s.spareBurger?.ingredients).toEqual(['bunBottom', 'cheese'])
    s = build(s, ['briocheBottom'])
    s = swapBench(s).session
    expect(s.burger).toEqual(['bunBottom', 'cheese'])
    expect(s.spareBurger?.ingredients).toEqual(['briocheBottom'])
    s = swapBench(s).session
    expect(s.burger).toEqual(['briocheBottom'])
  })

  it('os dois pratos andam juntos: as carnes acompanham o lanche de cada prato', () => {
    let s = two()
    s = { ...s, held: [{ id: 'patty', quality: 'perfect' }] }
    s = build(s, ['bunBottom'])
    s = { ...s, burger: [...s.burger, 'patty'], burgerPatties: ['overdone'] }
    s = swapBench(s).session
    expect(s.burgerPatties).toEqual([])
    expect(s.spareBurger!.patties).toEqual(['overdone'])
    expect(swapBench(s).session.burgerPatties).toEqual(['overdone'])
  })

  it('com os dois pratos vazios, trocar não faz nada', () => {
    const s = two()
    expect(swapBench(s).session).toBe(s)
  })

  it('descartar joga fora só o lanche da frente', () => {
    let s = build(two(), ['bunBottom'])
    s = swapBench(s).session
    s = build(s, ['briocheBottom'])
    s = discardBurger(s).session
    expect(s.burger).toEqual([])
    expect(s.spareBurger?.ingredients).toEqual(['bunBottom'])
  })

  it('o lanche fechado vai para a bandeja, esteja no prato da frente ou no de trás', () => {
    const closed = ['bunBottom', 'bunTop'] as const
    let s = build(two(), [...closed])
    // fechou e o jogador trocou de prato antes de ele ir para a bandeja
    s = swapBench(s).session
    expect(s.burger).toEqual([])
    const sent = sendBurgerToTray(s).session
    expect(sent.tray.burgers).toHaveLength(1)
    expect(sent.tray.burgers[0]!.ingredients).toEqual([...closed])
    expect(sent.spareBurger).toBeNull()
    // se os dois estiverem fechados, a frente vai primeiro
    const both = { ...build(two(), [...closed]), spareBurger: { ingredients: ['briocheBottom', 'briocheTop'] as never, patties: [] } }
    const first = sendBurgerToTray(both).session
    expect(first.tray.burgers[0]!.ingredients).toEqual([...closed])
    expect(first.spareBurger).not.toBeNull()
    // depois da frente, o de trás (também fechado) vai
    expect(sendBurgerToTray(first).session.tray.burgers).toHaveLength(2)
  })

  it('bandeja cheia: nada vai para a bandeja', () => {
    const full: Tray = { burgers: Array.from({ length: TRAY.burgers }, () => ({ ingredients: ['bunBottom', 'bunTop'], patties: [] })), sides: [], drinks: [], desserts: [] }
    const s = { ...build(two(), ['bunBottom', 'bunTop']), tray: full }
    expect(sendBurgerToTray(s).session).toBe(s)
  })
})

describe('balcão maior', () => {
  it('a sessão tem um lugar por vaga comprada e os clientes ocupam todos', () => {
    expect(createSession(1).slots).toHaveLength(3)
    const s0 = testSession(5, { perks: perksWith({ seats: 6 }) })
    expect(s0.slots).toHaveLength(6)
    let s: SessionState = { ...s0, spawnTimer: 0 }
    let peak = 0
    for (let i = 0; i < 4000; i++) {
      s = step({ ...s, spawnTimer: Math.min(s.spawnTimer, 0.5) }, { ...player(), reputation: 5 }, 0.1).session
      peak = Math.max(peak, s.slots.filter(Boolean).length)
      if (s.ended) break
    }
    expect(peak).toBeGreaterThan(3)
    expect(peak).toBeLessThanOrEqual(6)
  })
})

describe('geladeira', () => {
  it('uma geladeira maior deixa comprar acima do limite normal', () => {
    const base = player({ money: 1e6, stock: { ...startingStock(), patty: 290 } })
    expect(purchaseStock(base, { patty: 50 }).stock.patty).toBe(300)
    const bigger = { ...base, upgrades: { ...emptyUpgrades(), fridgeCapacity: 2 } }
    expect(purchaseStock(bigger, { patty: 50 }).stock.patty).toBe(340)
    expect(roomFor(bigger.stock, 'patty', computePerks(bigger).stockCap)).toBe(550 - 290)
    const maxed = { ...base, upgrades: { ...emptyUpgrades(), fridgeCapacity: 4 } }
    expect(purchaseStock({ ...maxed, stock: { ...maxed.stock, patty: 990 } }, { patty: 50 }).stock.patty).toBe(1000)
  })

  const lettuce = (id: 'lettuce' | 'tomato' = 'lettuce') => STOCK_ITEMS[id].spoilDays!

  it('ingredientes frescos duram mais dias', () => {
    const days = lettuce()
    let stock = { ...filledStock(0), lettuce: 10 }
    let ages = {}
    for (let d = 1; d < days; d++) {
      const aged = ageStock(stock, ages)
      expect(aged.spoiled).toEqual([])
      stock = aged.stock
      ages = aged.stockAge
    }
    expect(ageStock(stock, ages).spoiled).toEqual([{ id: 'lettuce', qty: 10 }])
    // com +1 dia, o mesmo estoque ainda está bom nesse dia
    expect(ageStock(stock, ages, 1).spoiled).toEqual([])
  })

  it('o aviso "estraga em N dias" soma o bônus', () => {
    const stock = { ...filledStock(0), lettuce: 5 }
    const base = daysUntilSpoil('lettuce', stock, {})
    expect(daysUntilSpoil('lettuce', stock, {}, 2)).toBe(base! + 2)
  })

  it('o fechamento do dia usa a refrigeração do jogador', () => {
    const days = lettuce()
    const ages = { lettuce: days - 1 }
    const p0 = player({ stock: { ...filledStock(0), lettuce: 8 }, stockAge: ages })
    const s = testSession(1, { stock: p0.stock })
    expect(closeDay(p0, s).summary.spoiled.map((x) => x.id)).toContain('lettuce')
    const p1 = { ...p0, upgrades: { ...emptyUpgrades(), fridgeFresh: 1 } }
    expect(closeDay(p1, s).summary.spoiled.map((x) => x.id)).not.toContain('lettuce')
  })
})

describe('caixa e decoração: pagamentos, gorjetas e paciência', () => {
  const burgerTray = (): Tray => ({ burgers: [{ ingredients: ['bunBottom', 'patty', 'bunTop'], patties: ['perfect'] }], sides: [], drinks: [], desserts: [] })
  const evaluate = (perks: Parameters<typeof evaluateService>[3]) => evaluateService(testCustomer(order('simples')), burgerTray(), player().prices, perks)

  it('pagamentos maiores aumentam o valor dos itens (e só ele)', () => {
    const base = evaluate(basePerks())
    const better = evaluate({ payBonus: 0.5, tipBonus: 0 })
    expect(better.itemsPaid).toBe(Math.round(base.itemsPaid * 1.5))
    expect(better.tip).toBe(base.tip)
  })

  it('gorjetas maiores aumentam a gorjeta e o bônus de carne no ponto', () => {
    const base = evaluate(basePerks())
    expect(base.tip).toBeGreaterThan(0)
    expect(base.bonus).toBeGreaterThan(0)
    const better = evaluate({ payBonus: 0, tipBonus: 1 })
    expect(better.itemsPaid).toBe(base.itemsPaid)
    expect(better.tip).toBe(base.tip * 2)
    expect(better.bonus).toBe(base.bonus * 2)
    expect(better.total).toBe(better.itemsPaid + better.tip + better.bonus)
  })

  it('a gorjeta da decoração e a do caixa se somam', () => {
    const decorOnly = computePerks({ upgrades: emptyUpgrades(), decor: { ...emptyDecor(), neon: 3 }, venue: 'stall' })
    const both = computePerks({ upgrades: { ...emptyUpgrades(), registerTips: 2 }, decor: { ...emptyDecor(), neon: 3 }, venue: 'stall' })
    expect(both.tipBonus).toBeGreaterThan(decorOnly.tipBonus)
    expect(evaluate(both).tip).toBeGreaterThanOrEqual(evaluate(decorOnly).tip)
  })

  it('decoração de paciência deixa o cliente esperar mais', () => {
    const context = { prices: player().prices, reputation: 3 }
    const [plain] = rollCustomer(77, 1, 1, 0, [], context)
    const [cosy] = rollCustomer(77, 1, 1, 0, [], { ...context, patienceBonus: 0.1 })
    expect(cosy.patienceMax).toBeCloseTo(plain.patienceMax * 1.1)
    expect(cosy.patience).toBe(cosy.patienceMax)
  })

  it('o tick aplica a paciência da decoração nos clientes que chegam', () => {
    const arrive = (patienceBonus: number) => {
      let s: SessionState = { ...testSession(9, { perks: perksWith({ patienceBonus }) }), spawnTimer: 0 }
      s = step(s, player(), 0.1).session
      return s.slots.find(Boolean)!.patienceMax
    }
    expect(arrive(0.2)).toBeCloseTo(arrive(0) * 1.2)
  })

  it('a reputação da decoração traz mais clientes na previsão do dia', () => {
    const base = player({ reputation: 3 })
    const pretty = { ...base, decor: { ...emptyDecor(), wall: 3, plants: 2 } }
    expect(expectedCustomers(pretty)).toBeGreaterThan(expectedCustomers(base))
  })
})

describe('fase da hamburgueria', () => {
  it('fases maiores atraem mais clientes e lugares extras também', () => {
    const stall = player({ venue: 'stall' })
    const craft = player({ venue: 'craft' })
    expect(effectiveDayMultiplier(craft)).toBeCloseTo(effectiveDayMultiplier(stall) * VENUES.craft.demandFactor)
    expect(expectedCustomers(craft)).toBeGreaterThan(expectedCustomers(stall))
    const seats = { ...stall, upgrades: { ...emptyUpgrades(), counterSeats: 3 } }
    expect(expectedCustomers(seats)).toBeGreaterThan(expectedCustomers(stall))
  })

  it('os custos fixos do dia crescem com a fase e o resumo mostra o valor cobrado', () => {
    const fixedTotal = ECONOMY.fixedCosts.reduce((sum, c) => sum + c.amount, 0)
    const s = testSession(1)
    const stall = closeDay(player({ venue: 'stall', money: 1000 }), s)
    expect(stall.summary.fixedCosts.reduce((sum, c) => sum + c.amount, 0)).toBe(fixedTotal)
    const chain = closeDay(player({ venue: 'chain', money: 1000 }), s)
    const charged = chain.summary.fixedCosts.reduce((sum, c) => sum + c.amount, 0)
    expect(charged).toBeGreaterThan(fixedTotal * 2.5)
    expect(chain.player.money).toBe(1000 - charged)
    expect(chain.summary.expenses).toBe(charged)
  })
})

describe('dia completo com tudo melhorado', () => {
  const maxed = () => {
    const upgrades = Object.fromEntries(UPGRADE_IDS.map((id) => [id, UPGRADES[id].levels.length])) as ReturnType<typeof emptyUpgrades>
    const decor = Object.fromEntries(DECOR_IDS.map((id) => [id, DECOR[id].tiers.length])) as ReturnType<typeof emptyDecor>
    return player({ level: 50, venue: 'chain', upgrades, decor, reputation: 4 })
  }

  const playDay = (seed: number) => {
    const p = maxed()
    let s: SessionState = createSession(seed, { level: p.level, stock: filledStock(99), dayMultiplier: effectiveDayMultiplier(p), perks: computePerks(p) })
    let pl = p
    let peak = 0
    for (let i = 0; i < 20_000 && !s.ended; i++) {
      const r = step(s, pl, SHIFT.maxDeltaSeconds)
      s = r.session
      pl = r.player
      peak = Math.max(peak, s.slots.filter(Boolean).length)
    }
    return { s, peak }
  }

  it('termina sem erros, respeita os lugares e é determinístico', () => {
    const a = playDay(11)
    expect(a.s.ended).toBe(true)
    expect(a.s.slots).toHaveLength(6)
    expect(a.peak).toBeLessThanOrEqual(6)
    expect(a.peak).toBeGreaterThan(3)
    expect(Number.isFinite(a.s.elapsed)).toBe(true)
    const b = playDay(11)
    expect(b.s.stats).toEqual(a.s.stats)
    expect(b.s.rngState).toBe(a.s.rngState)
  })

  it('com tudo melhorado chegam mais clientes do que no começo do jogo', () => {
    expect(expectedCustomers(maxed())).toBeGreaterThan(expectedCustomers(player({ level: 50, reputation: 4 })) * 1.4)
  })
})
