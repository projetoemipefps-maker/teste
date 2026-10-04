import { describe, expect, it } from 'vitest'
import { CUSTOMERS, DRINKS, FRYER, GRILL, PROGRESSION, RECIPES, SHIFT } from '../config'
import {
  addPattyToBurger,
  addToBurger,
  canAddToBurger,
  createSession,
  discardBurger,
  discardTrayItem,
  selectSlot,
  sendBurgerToTray,
  trayIsEmpty,
} from './session'
import { canServe, serveOrder } from './serve'
import { step } from './tick'
import { getRecipe, patienceFor, patienceRatio } from './customers'
import { nextRandom, randomInt } from './rng'
import { grillAlert, fryerAlert } from './alerts'
import type { Customer, OrderItems, PattyQuality, PlayerState, SessionState } from './types'

const player = (): PlayerState => ({
  money: 0,
  xp: 0,
  level: PROGRESSION.startingLevel,
  day: 1,
  reputation: PROGRESSION.startingReputation,
})

/** Roda o motor por `seconds` em passos pequenos. */
function run(session: SessionState, p: PlayerState, seconds: number) {
  let s = session
  let pl = p
  const events = []
  const dt = 0.05
  for (let t = 0; t < seconds; t += dt) {
    const r = step(s, pl, dt)
    s = r.session
    pl = r.player
    events.push(...r.events)
  }
  return { session: s, player: pl, events }
}

function withCustomer(order: OrderItems, patienceRatioValue = 1): SessionState {
  const max = patienceFor(order)
  const c: Customer = {
    id: 1, slot: 0, order, variant: 0, patienceMax: max, patience: max * patienceRatioValue,
    status: 'waiting', mood: 'neutral', leaveTimer: 0,
  }
  const s = createSession(1)
  return { ...s, slots: [c, null, null], selectedSlot: 0, nextCustomerId: 2, spawnTimer: 999 }
}

/** Monta o lanche da receita com carnes `quality` e já o coloca na bandeja. */
function withBurgerOnTray(session: SessionState, recipeId: string, quality: PattyQuality = 'perfect'): SessionState {
  let s = session
  for (const id of getRecipe(recipeId).ingredients) {
    if (id === 'patty') {
      s = { ...s, held: [quality] }
      s = addPattyToBurger(s, 0).session
    } else s = addToBurger(s, id).session
  }
  return sendBurgerToTray(s).session
}

const solo = (recipeId = 'simples'): OrderItems => ({ recipeId, fries: false, drink: null })

describe('rng', () => {
  it('é determinístico e devolve valores em [0,1)', () => {
    const [a, s1] = nextRandom(123)
    const [b] = nextRandom(123)
    expect(a).toBe(b)
    expect(a).toBeGreaterThanOrEqual(0)
    expect(a).toBeLessThan(1)
    expect(nextRandom(s1)[0]).not.toBe(a)
  })

  it('randomInt respeita os limites', () => {
    let st = 7
    for (let i = 0; i < 200; i++) {
      const [v, n] = randomInt(st, 2, 5)
      st = n
      expect(v).toBeGreaterThanOrEqual(2)
      expect(v).toBeLessThanOrEqual(5)
    }
  })
})

describe('seleção e montagem', () => {
  it('seleciona e desmarca o cliente; ignora vaga vazia', () => {
    const s = withCustomer(solo())
    const deselected = selectSlot(s, 0)
    expect(deselected.selectedSlot).toBeNull()
    expect(selectSlot(deselected, 0).selectedSlot).toBe(0)
    expect(selectSlot(s, 1)).toBe(s)
  })

  it('a carne não entra pela bandeja de ingredientes: só vinda do prato', () => {
    const s = addToBurger(createSession(1), 'bunBottom').session
    expect(canAddToBurger(s, 'patty')).toBe(false)
    expect(addToBurger(s, 'patty').events).toEqual([])
  })

  it('ingrediente inválido não gera evento', () => {
    const r = addToBurger(createSession(1), 'lettuce')
    expect(r.events).toEqual([])
    expect(r.session.burger).toEqual([])
  })

  it('descartar limpa o lanche e as carnes usadas', () => {
    let s: SessionState = { ...createSession(1), held: ['perfect'] }
    s = addToBurger(s, 'bunBottom').session
    s = addPattyToBurger(s, 0).session
    const d = discardBurger(s).session
    expect(d.burger).toEqual([])
    expect(d.burgerPatties).toEqual([])
    expect(discardBurger(createSession(1)).events).toEqual([])
  })

  it('o lanche fechado vai para a bandeja com o ponto das carnes', () => {
    const s = withBurgerOnTray(createSession(1), 'duplo', 'perfect')
    expect(s.burger).toEqual([])
    expect(s.burgerPatties).toEqual([])
    expect(s.tray.burger!.ingredients).toEqual([...getRecipe('duplo').ingredients])
    expect(s.tray.burger!.patties).toEqual(['perfect', 'perfect'])
  })

  it('lanche aberto não vai para a bandeja', () => {
    const s = addToBurger(createSession(1), 'bunBottom').session
    expect(sendBurgerToTray(s).session).toBe(s)
  })

  it('com um lanche na bandeja, não dá para fechar outro', () => {
    const s = withBurgerOnTray(createSession(1), 'simples')
    const opened = addToBurger(s, 'bunBottom').session
    expect(canAddToBurger(opened, 'bunTop')).toBe(false)
    expect(trayIsEmpty(s)).toBe(false)
  })

  it('tirar o item da bandeja a deixa livre', () => {
    const s = withBurgerOnTray(createSession(1), 'simples')
    const r = discardTrayItem(s, 'burger')
    expect(r.session.tray.burger).toBeNull()
    expect(trayIsEmpty(r.session)).toBe(true)
    expect(discardTrayItem(r.session, 'burger').events).toEqual([])
  })
})

describe('entrega', () => {
  it('pedido perfeito: cliente feliz, 5 estrelas, paga, XP e reputação sobem', () => {
    const s = withBurgerOnTray(withCustomer(solo('classico')), 'classico')
    const r = serveOrder(s, player())
    const c = r.session.slots[0]!
    expect(c.status).toBe('leaving')
    expect(c.mood).toBe('happy')
    expect(r.events[0]).toMatchObject({ type: 'customerServed', stars: 5, burgerCorrect: true })
    expect(r.player.money).toBeGreaterThan(0)
    expect(r.player.xp).toBeGreaterThan(0)
    expect(r.player.reputation).toBeGreaterThan(PROGRESSION.startingReputation)
    expect(r.session.tray).toEqual({ burger: null, fries: null, drink: null })
    expect(r.session.selectedSlot).toBeNull()
    expect(r.session.stats).toMatchObject({ served: 1, starsTotal: 5 })
  })

  it('lanche errado: cliente bravo, nota baixa, paga pouco e perde reputação', () => {
    const s = withBurgerOnTray(withCustomer(solo('classico')), 'simples')
    const r = serveOrder(s, player())
    expect(r.session.slots[0]!.mood).toBe('angry')
    expect(r.events[0]).toMatchObject({ burgerCorrect: false })
    expect((r.events[0] as { stars: number }).stars).toBeLessThanOrEqual(2)
    expect(r.player.reputation).toBeLessThan(PROGRESSION.startingReputation)
  })

  it('pedido com combo: a bandeja completa rende mais que só o lanche', () => {
    const order: OrderItems = { recipeId: 'simples', fries: true, drink: 'small' }
    const onlyBurger = serveOrder(withBurgerOnTray(withCustomer(order), 'simples'), player())
    const full = withBurgerOnTray(withCustomer(order), 'simples')
    const fullTray = { ...full, tray: { ...full.tray, fries: { quality: 'fresh' as const }, drink: { size: 'small' as const, quality: 'good' as const } } }
    const r = serveOrder(fullTray, player())
    expect(r.player.money).toBeGreaterThan(onlyBurger.player.money)
    expect((r.events[0] as { stars: number }).stars).toBe(5)
    expect((onlyBurger.events[0] as { stars: number }).stars).toBeLessThan(5)
  })

  it('carne no ponto rende mais que carne passada', () => {
    const perfect = serveOrder(withBurgerOnTray(withCustomer(solo()), 'simples', 'perfect'), player())
    const overdone = serveOrder(withBurgerOnTray(withCustomer(solo()), 'simples', 'overdone'), player())
    expect(perfect.player.money).toBeGreaterThan(overdone.player.money)
  })

  it('mais rápido rende mais gorjeta', () => {
    const fast = serveOrder(withBurgerOnTray(withCustomer(solo(), 1), 'simples'), player())
    const slow = serveOrder(withBurgerOnTray(withCustomer(solo(), 0.35), 'simples'), player())
    expect(fast.player.money).toBeGreaterThan(slow.player.money)
  })

  it('não entrega com a bandeja vazia nem sem cliente selecionado', () => {
    const empty = withCustomer(solo())
    expect(canServe(empty)).toBe(false)
    expect(serveOrder(empty, player()).session).toBe(empty)
    const noSelection = { ...withBurgerOnTray(withCustomer(solo()), 'simples'), selectedSlot: null }
    expect(canServe(noSelection)).toBe(false)
  })

  it('sobe de nível quando junta XP suficiente', () => {
    const s = withBurgerOnTray(withCustomer(solo('x-salada')), 'x-salada')
    const r = serveOrder(s, { ...player(), xp: PROGRESSION.xpBase - 1 })
    expect(r.player.level).toBe(2)
    expect(r.events.some((e) => e.type === 'leveledUp')).toBe(true)
  })
})

describe('balanceamento', () => {
  it('todo pedido dá tempo de ser feito dentro da paciência mínima', () => {
    // A carne leva os dois lados no ponto; batata e bebida cozinham/enchem em paralelo; sobra folga para os toques.
    const slowest = Math.max(
      2 * GRILL.sideDoneSeconds,
      FRYER.readySeconds,
      DRINKS.cups.large.capacity / DRINKS.fillRate,
    )
    const minPatience = Math.min(...RECIPES.map((r) => patienceFor({ recipeId: r.id, fries: false, drink: null })))
    expect(slowest + 10).toBeLessThan(minPatience)
  })

  it('a janela de "no ponto" é maior que o tempo de reação do jogador', () => {
    expect(GRILL.sideOverdoneSeconds - GRILL.sideDoneSeconds).toBeGreaterThanOrEqual(3)
    expect(FRYER.burntSeconds - FRYER.readySeconds).toBeGreaterThanOrEqual(3)
    const window = (DRINKS.cups.small.capacity * (1 - DRINKS.minFillRatio)) / DRINKS.fillRate
    expect(window).toBeGreaterThanOrEqual(0.4)
  })
})

describe('passagem do tempo', () => {
  it('a paciência diminui e o dt é limitado', () => {
    const s = withCustomer(solo())
    const r = step(s, player(), 5)
    expect(s.slots[0]!.patience - r.session.slots[0]!.patience).toBeCloseTo(SHIFT.maxDeltaSeconds)
  })

  it('paciência zerada: cliente vai embora sem pagar e a reputação cai', () => {
    const r = run(withCustomer(solo(), 0.001), player(), 0.5)
    expect(r.events.some((e) => e.type === 'customerLost')).toBe(true)
    expect(r.player.money).toBe(0)
    expect(r.player.reputation).toBeLessThan(PROGRESSION.startingReputation)
    expect(r.session.stats.lost).toBe(1)
  })

  it('o cliente que saiu libera a vaga depois do tempo de saída', () => {
    const r = run(withCustomer(solo(), 0.001), player(), CUSTOMERS.leaveDuration + 0.5)
    expect(r.session.slots[0]).toBeNull()
  })

  it('pedidos com batata e bebida dão mais paciência', () => {
    expect(patienceFor({ recipeId: 'simples', fries: true, drink: 'small' })).toBeGreaterThan(patienceFor(solo()))
  })

  it('primeiro cliente chega após o atraso inicial e é selecionado sozinho', () => {
    const r = run(createSession(42), player(), CUSTOMERS.firstSpawnDelay + 0.5)
    expect(r.session.slots.filter(Boolean)).toHaveLength(1)
    expect(r.session.selectedSlot).not.toBeNull()
    expect(r.events.some((e) => e.type === 'customerArrived')).toBe(true)
  })

  it('nunca passa do limite de clientes no balcão', () => {
    let s = createSession(5)
    let pl = player()
    for (let t = 0; t < SHIFT.durationSeconds - 1; t += 0.1) {
      const r = step(s, { ...pl, reputation: 5 }, 0.1)
      s = r.session
      pl = r.player
      expect(s.slots.filter(Boolean).length).toBeLessThanOrEqual(CUSTOMERS.maxSlots)
    }
  })

  it('o turno termina no tempo configurado e depois não avança mais', () => {
    const r = run(createSession(9), player(), SHIFT.durationSeconds + 1)
    expect(r.session.ended).toBe(true)
    expect(r.events.filter((e) => e.type === 'shiftEnded')).toHaveLength(1)
    expect(step(r.session, r.player, 1).session).toBe(r.session)
  })

  it('mesma seed, mesmo resultado', () => {
    const a = run(createSession(77), player(), 60)
    const b = run(createSession(77), player(), 60)
    expect(a.session).toEqual(b.session)
    expect(a.events).toEqual(b.events)
  })

  it('os pedidos sorteados existem na config', () => {
    const r = run(createSession(3), player(), 90)
    for (const c of r.session.slots) if (c) expect(RECIPES.some((x) => x.id === c.order.recipeId)).toBe(true)
  })

  it('clientes no balcão não repetem a aparência', () => {
    let s = createSession(11)
    let pl = player()
    for (let t = 0; t < 40; t += 0.1) {
      const r = step(s, pl, 0.1)
      s = r.session
      pl = r.player
      const variants = s.slots.flatMap((c) => (c ? [c.variant] : []))
      expect(new Set(variants).size).toBe(variants.length)
    }
  })

  it('razão de paciência fica entre 0 e 1', () => {
    const c = withCustomer(solo()).slots[0]!
    expect(patienceRatio(c)).toBe(1)
    expect(patienceRatio({ ...c, patience: -3 })).toBe(0)
  })

  it('a carne queima sozinha na chapa e dispara o evento uma vez', () => {
    let s = { ...createSession(1), spawnTimer: 999 }
    s = { ...s, grill: [{ sides: [0, 0], down: 0, flips: 0 }, null] }
    const r = run(s, player(), 20)
    expect(r.events.filter((e) => e.type === 'pattyBurnt')).toHaveLength(1)
  })

  it('os avisos das abas refletem a chapa e a fritadeira', () => {
    const s = createSession(1)
    expect(grillAlert(s)).toBe('none')
    expect(grillAlert({ ...s, grill: [{ sides: [8, 8], down: 0, flips: 1 }, null] })).toBe('ready')
    expect(grillAlert({ ...s, grill: [{ sides: [8, 0], down: 0, flips: 0 }, null] })).toBe('warn')
    expect(fryerAlert({ ...s, fryer: [{ cook: 9 }, null] })).toBe('ready')
    expect(fryerAlert({ ...s, fryer: [{ cook: 20 }, null] })).toBe('warn')
    expect(fryerAlert({ ...s, fryer: [{ cook: 2 }, null] })).toBe('none')
  })
})
