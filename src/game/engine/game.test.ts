import { describe, expect, it } from 'vitest'
import {
  COOKABLES,
  CUSTOMER_RULES,
  CUSTOMER_TYPES,
  CUSTOMERS,
  DEMAND,
  DRINK_CONFIG,
  DRINKS,
  GRILL,
  PROGRESSION,
  RECIPES,
  SHIFT,
  TRAY,
  UNLOCK_GIFT_UNITS,
} from '../config'
import { isClosing } from './clock'
import { changeMind, customerMood, getRecipe, patienceFor, patienceRatio, rollCustomer } from './customers'
import { defaultPrices, recipeKey } from './pricing'
import { nextRandom, randomInt } from './rng'
import { canServe, serveOrder } from './serve'
import {
  addPattyToBurger,
  addToBurger,
  canAddToBurger,
  closingIngredient,
  discardBurger,
  discardTrayItem,
  selectSlot,
  sendBurgerToTray,
  trayIsEmpty,
} from './session'
import { filledStock } from './stock'
import { step } from './tick'
import { order, testCustomer, testPlayer, testSession } from './testing'
import { xpToNext } from './xp'
import type { Customer, CustomerTypeId, OrderItems, PattyQuality, PlayerState, SessionState } from './types'

const player = (overrides: Partial<PlayerState> = {}): PlayerState => testPlayer(overrides)

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

function withCustomer(o: OrderItems, patienceRatioValue = 1, type: CustomerTypeId = 'normal', options = {}): SessionState {
  const s = testSession(1, options)
  return { ...s, slots: [testCustomer(o, patienceRatioValue, 0, type), null, null], selectedSlot: 0, nextCustomerId: 2, spawnTimer: 999 }
}

/** Monta o lanche da receita (proteína no ponto `quality`) e o coloca na bandeja. */
function withBurgerOnTray(session: SessionState, recipeId: string, quality: PattyQuality = 'perfect'): SessionState {
  let s = session
  for (const id of getRecipe(recipeId).ingredients) {
    if (id === 'patty' || id === 'chicken' || id === 'veggie') {
      s = { ...s, held: [{ id, quality }] }
      s = addPattyToBurger(s, 0).session
    } else s = addToBurger(s, id).session
  }
  return sendBurgerToTray(s).session
}

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
    const s = withCustomer(order())
    const deselected = selectSlot(s, 0)
    expect(deselected.selectedSlot).toBeNull()
    expect(selectSlot(deselected, 0).selectedSlot).toBe(0)
    expect(selectSlot(s, 1)).toBe(s)
  })

  it('a proteína não entra pela bancada de ingredientes: só vinda do prato', () => {
    const s = addToBurger(testSession(), 'bunBottom').session
    for (const p of ['patty', 'chicken', 'veggie'] as const) {
      expect(canAddToBurger(s, p)).toBe(false)
      expect(addToBurger(s, p).events).toEqual([])
    }
  })

  it('ingrediente inválido não gera evento', () => {
    const r = addToBurger(testSession(), 'lettuce')
    expect(r.events).toEqual([])
    expect(r.session.burger).toEqual([])
  })

  it('só os ingredientes liberados no nível podem ser usados', () => {
    const early = testSession(1, { level: 1 })
    const open = addToBurger(early, 'bunBottom').session
    expect(canAddToBurger(open, 'bacon')).toBe(false)
    expect(canAddToBurger({ ...open, level: 4 }, 'bacon')).toBe(true)
    expect(canAddToBurger(early, 'briocheBottom')).toBe(false)
    expect(canAddToBurger({ ...early, level: 9 }, 'briocheBottom')).toBe(true)
  })

  it('o pão de cima usado é o que combina com o de baixo', () => {
    let s = addToBurger(testSession(), 'briocheBottom').session
    expect(closingIngredient(s)).toBe('briocheTop')
    expect(canAddToBurger(s, 'bunTop')).toBe(false)
    expect(canAddToBurger(s, 'briocheTop')).toBe(true)
    s = addToBurger(s, 'briocheTop').session
    expect(s.burger).toEqual(['briocheBottom', 'briocheTop'])
  })

  it('descartar limpa o lanche e as proteínas usadas', () => {
    let s: SessionState = { ...testSession(), held: [{ id: 'patty', quality: 'perfect' }] }
    s = addToBurger(s, 'bunBottom').session
    s = addPattyToBurger(s, 0).session
    const d = discardBurger(s).session
    expect(d.burger).toEqual([])
    expect(d.burgerPatties).toEqual([])
    expect(discardBurger(testSession()).events).toEqual([])
  })

  it('o lanche fechado vai para a bandeja com o ponto das proteínas', () => {
    const s = withBurgerOnTray(testSession(), 'duplo', 'perfect')
    expect(s.burger).toEqual([])
    expect(s.burgerPatties).toEqual([])
    expect(s.tray.burgers[0]!.ingredients).toEqual([...getRecipe('duplo').ingredients])
    expect(s.tray.burgers[0]!.patties).toEqual(['perfect', 'perfect'])
  })

  it('lanche aberto não vai para a bandeja', () => {
    const s = addToBurger(testSession(), 'bunBottom').session
    expect(sendBurgerToTray(s).session).toBe(s)
  })

  it('a bandeja comporta vários lanches, até o limite', () => {
    let s = testSession()
    for (let i = 0; i < TRAY.burgers; i++) s = withBurgerOnTray(s, 'simples')
    expect(s.tray.burgers).toHaveLength(TRAY.burgers)
    const opened = addToBurger(s, 'bunBottom').session
    expect(canAddToBurger(opened, 'bunTop')).toBe(false) // bandeja cheia: não fecha mais
  })

  it('tirar da bandeja remove o último item da categoria', () => {
    const s = withBurgerOnTray(withBurgerOnTray(testSession(), 'simples'), 'classico')
    const r = discardTrayItem(s, 'burgers')
    expect(r.session.tray.burgers).toHaveLength(1)
    expect(r.session.tray.burgers[0]!.ingredients).toEqual([...getRecipe('simples').ingredients])
    expect(trayIsEmpty(discardTrayItem(r.session, 'burgers').session)).toBe(true)
    expect(discardTrayItem(testSession(), 'sides').events).toEqual([])
  })
})

describe('entrega', () => {
  it('pedido perfeito: cliente feliz, 5 estrelas, paga, XP e reputação sobem', () => {
    const s = withBurgerOnTray(withCustomer(order('classico')), 'classico')
    const r = serveOrder(s, player())
    const c = r.session.slots[0]!
    expect(c.status).toBe('leaving')
    expect(c.mood).toBe('happy')
    expect(r.events[0]).toMatchObject({ type: 'customerServed', stars: 5, burgerCorrect: true, customerType: 'normal' })
    expect(r.player.money).toBeGreaterThan(player().money)
    expect(r.player.xp).toBeGreaterThan(0)
    expect(r.player.reputation).toBeGreaterThan(PROGRESSION.startingReputation)
    expect(r.session.tray).toEqual({ burgers: [], sides: [], drinks: [], desserts: [] })
    expect(r.session.selectedSlot).toBeNull()
    expect(r.session.stats).toMatchObject({ served: 1, starsTotal: 5 })
  })

  it('lanche errado: cliente bravo, nota baixa, paga pouco e perde reputação', () => {
    const s = withBurgerOnTray(withCustomer(order('classico')), 'simples')
    const r = serveOrder(s, player())
    expect(r.session.slots[0]!.mood).toBe('angry')
    expect(r.events[0]).toMatchObject({ burgerCorrect: false })
    expect((r.events[0] as { stars: number }).stars).toBeLessThanOrEqual(2)
    expect(r.player.reputation).toBeLessThan(PROGRESSION.startingReputation)
  })

  it('pedido com combo: a bandeja completa rende mais que só o lanche', () => {
    const o = order('simples', { sides: ['fries'], drinks: [{ kind: 'soda', size: 'small' }] })
    const onlyBurger = serveOrder(withBurgerOnTray(withCustomer(o), 'simples'), player())
    const full = withBurgerOnTray(withCustomer(o), 'simples')
    const fullTray = {
      ...full,
      tray: { ...full.tray, sides: [{ id: 'fries' as const, quality: 'fresh' as const }], drinks: [{ kind: 'soda' as const, size: 'small' as const, quality: 'good' as const }] },
    }
    const r = serveOrder(fullTray, player())
    expect(r.player.money).toBeGreaterThan(onlyBurger.player.money)
    expect((r.events[0] as { stars: number }).stars).toBe(5)
    expect((onlyBurger.events[0] as { stars: number }).stars).toBeLessThan(5)
  })

  it('carne no ponto rende mais que carne passada', () => {
    const perfect = serveOrder(withBurgerOnTray(withCustomer(order()), 'simples', 'perfect'), player())
    const overdone = serveOrder(withBurgerOnTray(withCustomer(order()), 'simples', 'overdone'), player())
    expect(perfect.player.money).toBeGreaterThan(overdone.player.money)
  })

  it('mais rápido rende mais gorjeta', () => {
    const fast = serveOrder(withBurgerOnTray(withCustomer(order(), 1), 'simples'), player())
    const slow = serveOrder(withBurgerOnTray(withCustomer(order(), 0.35), 'simples'), player())
    expect(fast.player.money).toBeGreaterThan(slow.player.money)
  })

  it('não entrega com a bandeja vazia nem sem cliente selecionado', () => {
    const empty = withCustomer(order())
    expect(canServe(empty)).toBe(false)
    expect(serveOrder(empty, player()).session).toBe(empty)
    const noSelection = { ...withBurgerOnTray(withCustomer(order()), 'simples'), selectedSlot: null }
    expect(canServe(noSelection)).toBe(false)
  })

  it('cada entrega vira uma avaliação e mexe na reputação', () => {
    const r = serveOrder(withBurgerOnTray(withCustomer(order('classico')), 'classico'), player())
    expect(r.player.reviews).toHaveLength(1)
    expect(r.player.reviews[0]!.stars).toBe(5)
    expect(r.player.reputation).toBeGreaterThan(3)
    expect(r.events[0]).toMatchObject({ review: { stars: 5 } })
    expect(r.session.stats).toMatchObject({ served: 1, soldByRecipe: { classico: 1 } })
    expect(r.session.stats.revenue).toBeGreaterThan(0)
    expect(r.session.stats.tips).toBeGreaterThan(0)
  })

  it('preço mais alto rende mais por pedido, mas menos gorjeta', () => {
    const baseTray = withBurgerOnTray(withCustomer(order('simples')), 'simples')
    const dearPrices = { ...defaultPrices(), [recipeKey('simples')]: 22 }
    const dearSession = { ...baseTray, slots: [{ ...testCustomer(order('simples'), 1), priceRatio: 22 / 14 }, null, null] as typeof baseTray.slots }
    const normal = serveOrder(baseTray, player())
    const dear = serveOrder(dearSession, { ...player(), prices: dearPrices })
    expect(dear.session.stats.revenue).toBeGreaterThan(normal.session.stats.revenue)
    expect(dear.session.stats.tips).toBeLessThan(normal.session.stats.tips)
  })
})

describe('XP e subida de nível ao entregar', () => {
  const perfectServe = (p: PlayerState, session = withCustomer(order('simples'))) =>
    serveOrder(withBurgerOnTray(session, 'simples'), p)

  it('um pedido perfeito já faz subir de nível logo no começo', () => {
    const r = perfectServe(player())
    expect(r.player.level).toBeGreaterThanOrEqual(2)
    const up = r.events.find((e) => e.type === 'leveledUp')
    expect(up).toMatchObject({ type: 'leveledUp', from: 1, level: r.player.level })
  })

  it('sobe de nível com o XP que sobra e informa o que foi liberado', () => {
    const r = perfectServe(player({ xp: xpToNext(1) - 1 }))
    const up = r.events.find((e) => e.type === 'leveledUp')!
    expect(up.type === 'leveledUp' && up.unlocks.some((u) => u.id === 'cheddar')).toBe(true) // nível 2: cheddar
  })

  it('o nível da sessão acompanha, e itens novos ganham estoque de presente', () => {
    const base = testSession(1, { level: 1, stock: { ...filledStock(0), bun: 5, patty: 5 } })
    const s = withCustomer(order('simples'), 1, 'normal', {})
    const prepared: SessionState = { ...s, level: 1, stock: base.stock }
    const r = perfectServe(player({ xp: xpToNext(1) - 1 }), prepared)
    expect(r.session.level).toBeGreaterThanOrEqual(2)
    expect(r.session.stock.cheddar).toBe(UNLOCK_GIFT_UNITS)
  })

  it('ganhar vários níveis de uma vez junta tudo o que foi liberado', () => {
    const r = perfectServe(player({ xp: 100000 }))
    const ups = r.events.filter((e) => e.type === 'leveledUp')
    expect(ups).toHaveLength(1)
    const up = ups[0]!
    expect(up.type === 'leveledUp' && up.level - up.from).toBeGreaterThan(1)
  })

  it('subir de nível libera o forno, mas não mexe na chapa nem na fritadeira (esses vêm da loja)', () => {
    const base = withCustomer(order('simples'), 1, 'normal', { level: 1 })
    const prepared: SessionState = { ...base, level: 11 }
    const r = perfectServe(player({ level: 11, xp: xpToNext(11) - 1 }), { ...prepared, grill: [null, null], fryer: [null, null], oven: [] })
    expect(r.session.level).toBe(12)
    expect(r.session.oven).toHaveLength(2)
    expect(r.session.grill).toHaveLength(2)
    expect(r.session.fryer).toHaveLength(2)
  })

  it('o tipo de cliente multiplica o XP (apressado dá mais)', () => {
    const xpFor = (type: CustomerTypeId) => {
      const s = withCustomer(order('simples'), 1, type)
      return (serveOrder(withBurgerOnTray(s, 'simples'), player()).events[0] as { xp: number }).xp
    }
    expect(xpFor('hurried')).toBeGreaterThan(xpFor('normal'))
    expect(xpFor('critic')).toBeGreaterThan(xpFor('normal'))
  })
})

describe('passagem do tempo', () => {
  it('a paciência diminui e o dt é limitado', () => {
    const s = withCustomer(order())
    const r = step(s, player(), 5)
    expect(s.slots[0]!.patience - r.session.slots[0]!.patience).toBeCloseTo(SHIFT.maxDeltaSeconds)
  })

  it('paciência zerada: cliente vai embora sem pagar e a reputação cai', () => {
    const r = run(withCustomer(order(), 0.001), player(), 0.5)
    expect(r.events.some((e) => e.type === 'customerLost')).toBe(true)
    expect(r.player.money).toBe(player().money)
    expect(r.player.reviews[0]).toMatchObject({ stars: 1 })
    expect(r.player.reputation).toBeLessThan(PROGRESSION.startingReputation)
    expect(r.session.stats.lost).toBe(1)
  })

  it('o cliente que saiu libera a vaga depois do tempo de saída', () => {
    const r = run(withCustomer(order(), 0.001), player(), CUSTOMERS.leaveDuration + 0.5)
    expect(r.session.slots[0]).toBeNull()
  })

  it('a expressão muda com a paciência: neutro, impaciente, e a reação ao sair', () => {
    const c = testCustomer(order(), 1)
    expect(customerMood(c)).toBe('neutral')
    expect(customerMood({ ...c, patience: c.patienceMax * (CUSTOMERS.impatientRatio - 0.05) })).toBe('impatient')
    expect(customerMood({ ...c, status: 'leaving', mood: 'happy' })).toBe('happy')
    expect(customerMood({ ...c, status: 'leaving', mood: 'angry' })).toBe('angry')
  })

  it('pedidos maiores dão mais paciência', () => {
    const base = patienceFor(order('simples'))
    expect(patienceFor(order('simples', { sides: ['fries'], drinks: [{ kind: 'soda', size: 'small' }], desserts: ['iceCream'] }))).toBeGreaterThan(base)
    expect(patienceFor(order('simples', { burgers: ['simples', 'simples'] }))).toBeGreaterThan(base)
  })

  it('primeiro cliente chega após o atraso inicial e é selecionado sozinho', () => {
    const r = run(testSession(42), player(), CUSTOMERS.firstSpawnDelay + 0.5)
    expect(r.session.slots.filter(Boolean)).toHaveLength(1)
    expect(r.session.selectedSlot).not.toBeNull()
    expect(r.events.some((e) => e.type === 'customerArrived')).toBe(true)
  })

  it('nunca passa do limite de clientes no balcão', () => {
    let s = testSession(5)
    let pl = player()
    for (let t = 0; t < SHIFT.durationSeconds - 1; t += 0.1) {
      const r = step(s, { ...pl, reputation: 5 }, 0.1)
      s = r.session
      pl = r.player
      expect(s.slots.filter(Boolean).length).toBeLessThanOrEqual(CUSTOMERS.maxSlots)
    }
  })

  it('o turno termina e depois não avança mais', () => {
    const r = run(testSession(9), player(), SHIFT.durationSeconds + DEMAND.closingGraceSeconds + 1)
    expect(r.session.ended).toBe(true)
    expect(r.events.filter((e) => e.type === 'shiftEnded')).toHaveLength(1)
    expect(step(r.session, r.player, 1).session).toBe(r.session)
  })

  it('mesma seed, mesmo resultado', () => {
    const a = run(testSession(77), player(), 60)
    const b = run(testSession(77), player(), 60)
    expect(a.session).toEqual(b.session)
    expect(a.events).toEqual(b.events)
  })

  it('os pedidos sorteados só usam receitas liberadas', () => {
    const r = run(testSession(3, { level: 8 }), player({ level: 8 }), 90)
    for (const c of r.session.slots) if (c) for (const id of c.order.burgers) expect(getRecipe(id).unlockLevel).toBeLessThanOrEqual(8)
  })

  it('a proteína queima sozinha na chapa e dispara o evento uma vez', () => {
    const s = { ...testSession(), spawnTimer: 999, grill: [{ kind: 'patty' as const, sides: [0, 0] as [number, number], down: 0 as const, flips: 0 }, null] }
    const r = run(s, player(), 20)
    expect(r.events.filter((e) => e.type === 'pattyBurnt')).toHaveLength(1)
  })

  it('razão de paciência fica entre 0 e 1', () => {
    const c = testCustomer(order())
    expect(patienceRatio(c)).toBe(1)
    expect(patienceRatio({ ...c, patience: -3 })).toBe(0)
  })
})

describe('chegada de clientes', () => {
  it('depois do horário de fechar não chegam mais clientes e o dia nunca passa da tolerância', () => {
    let s = testSession(21)
    let p = player()
    let arrivalsAfterClose = 0
    let ended = false
    for (let t = 0; t < SHIFT.durationSeconds + DEMAND.closingGraceSeconds + 5 && !ended; t += 0.1) {
      const r = step(s, p, 0.1)
      if (isClosing(r.session.elapsed)) arrivalsAfterClose += r.events.filter((e) => e.type === 'customerArrived').length
      s = r.session
      p = r.player
      ended = s.ended
    }
    expect(arrivalsAfterClose).toBe(0)
    expect(ended).toBe(true)
    expect(s.elapsed).toBeLessThanOrEqual(SHIFT.durationSeconds + DEMAND.closingGraceSeconds + 0.2)
  })

  it('o dia acaba ao fim da tolerância mesmo com clientes esperando', () => {
    const base = withCustomer(order(), 1)
    const waiting = { ...base, elapsed: SHIFT.durationSeconds + DEMAND.closingGraceSeconds - 0.05, spawnTimer: 999 }
    const long = { ...waiting, slots: [{ ...waiting.slots[0]!, patience: 999, patienceMax: 999 }, null, null] }
    expect(step(long, player(), 0.1).session.ended).toBe(true)
  })

  it('num dia inteiro sem atender, chega uma quantidade razoável de clientes', () => {
    const r = run(testSession(33), player(), SHIFT.durationSeconds)
    const arrivals = r.events.filter((e) => e.type === 'customerArrived').length
    expect(arrivals).toBeGreaterThanOrEqual(15)
    expect(arrivals).toBeLessThanOrEqual(70)
  })

  it('no almoço e no jantar chegam mais clientes que no fim de tarde', () => {
    const count = (fromHour: number, toHour: number) => {
      const per = SHIFT.durationSeconds / (SHIFT.closeHour - SHIFT.openHour)
      let total = 0
      for (let seed = 1; seed <= 12; seed++) {
        let s = { ...testSession(seed), spawnTimer: 0 }
        s = { ...s, elapsed: (fromHour - SHIFT.openHour) * per }
        let p = player()
        const end = (toHour - SHIFT.openHour) * per
        while (s.elapsed < end) {
          const r = step({ ...s, slots: [null, null, null] }, p, 0.1)
          total += r.events.filter((e) => e.type === 'customerArrived').length
          s = r.session
          p = r.player
        }
      }
      return total
    }
    const afternoon = count(15, 17)
    expect(count(12, 14)).toBeGreaterThan(afternoon * 1.8)
    expect(count(19, 21)).toBeGreaterThan(afternoon * 1.8)
  })

  it('com o nível, os clientes chegam em maior número', () => {
    const arrivals = (level: number) => run(testSession(33, { level }), player({ level }), 120).events.filter((e) => e.type === 'customerArrived').length
    // sem atender, o balcão enche; conta só as chegadas, que dependem da taxa
    let low = 0
    let high = 0
    for (const seed of [1, 2, 3, 4]) {
      const go = (level: number) => {
        let s = { ...testSession(seed, { level }), spawnTimer: 0 }
        let p = player({ level })
        let n = 0
        for (let t = 0; t < 120; t += 0.1) {
          const r = step({ ...s, slots: [null, null, null] }, p, 0.1)
          n += r.events.filter((e) => e.type === 'customerArrived').length
          s = r.session
          p = r.player
        }
        return n
      }
      low += go(1)
      high += go(40)
    }
    expect(high).toBeGreaterThan(low * 1.4)
    expect(arrivals(1)).toBeGreaterThan(0)
  })

  it('reputação alta e preço baixo deixam o cliente mais paciente; preço alto, menos', () => {
    const prices = defaultPrices()
    const dear = { ...prices, [recipeKey('simples')]: 30 }
    const patienceOf = (rep: number, p: typeof prices) => {
      for (let seed = 1; seed < 800; seed++) {
        const [c] = rollCustomer(seed, 1, 1, 0, [], { prices: p, reputation: rep })
        if (c.type === 'normal' && c.order.burgers.length === 1 && c.order.burgers[0] === 'simples' && c.order.sides.length + c.order.drinks.length === 0) return c.patienceMax
      }
      throw new Error('sem pedido simples')
    }
    expect(patienceOf(5, prices)).toBeGreaterThan(patienceOf(3, prices))
    expect(patienceOf(1, prices)).toBeLessThan(patienceOf(3, prices))
    expect(patienceOf(3, dear)).toBeLessThan(patienceOf(3, prices))
  })
})

describe('balanceamento', () => {
  it('todo pedido simples dá tempo de ser feito dentro da paciência mínima', () => {
    const slowest = Math.max(
      2 * GRILL.kinds.patty.done,
      COOKABLES.fries.readySeconds,
      DRINKS.cups.large.capacity / DRINK_CONFIG.soda.fillRate,
    )
    const minPatience = Math.min(
      ...RECIPES.filter((r) => r.unlockLevel <= 1).map((r) => patienceFor(order(r.id)) * CUSTOMER_TYPES.normal.patienceFactor),
    )
    expect(slowest + 10).toBeLessThan(minPatience)
  })

  it('o cliente apressado ainda tem tempo de receber o lanche mais simples', () => {
    const hurried = patienceFor(order('simples')) * CUSTOMER_TYPES.hurried.patienceFactor
    expect(hurried).toBeGreaterThan(2 * GRILL.kinds.patty.done + 3)
  })

  it('a janela de "no ponto" é maior que o tempo de reação do jogador', () => {
    for (const t of Object.values(GRILL.kinds)) expect(t.overdone - t.done).toBeGreaterThanOrEqual(3)
    for (const c of Object.values(COOKABLES)) expect(c.burntSeconds - c.readySeconds).toBeGreaterThanOrEqual(3)
    const window = (DRINKS.cups.small.capacity * (1 - DRINKS.minFillRatio)) / DRINK_CONFIG.shakeChocolate.fillRate
    expect(window).toBeGreaterThanOrEqual(0.4)
  })
})

describe('tipos de cliente no tick', () => {
  const customersOf = (level: number, seeds: number) => {
    const out: Customer[] = []
    for (let seed = 1; seed <= seeds; seed++) out.push(rollCustomer(seed, level, seed, 0, [], { prices: defaultPrices(), reputation: 3 })[0])
    return out
  }

  it('no nível 1 só aparecem clientes normais; os outros tipos entram com o nível', () => {
    expect(new Set(customersOf(1, 200).map((c) => c.type))).toEqual(new Set(['normal']))
    const late = new Set(customersOf(30, 600).map((c) => c.type))
    for (const type of Object.keys(CUSTOMER_TYPES)) expect(late.has(type as CustomerTypeId), type).toBe(true)
  })

  it('o crítico é raro', () => {
    const list = customersOf(30, 1500)
    const critics = list.filter((c) => c.type === 'critic').length
    expect(critics).toBeGreaterThan(0)
    expect(critics / list.length).toBeLessThan(0.1)
  })

  it('o apressado tem bem menos paciência que o normal, e a família mais', () => {
    const avg = (type: CustomerTypeId) => {
      const cs = customersOf(30, 1200).filter((c) => c.type === type)
      return cs.reduce((s, c) => s + c.patienceMax / patienceFor(c.order), 0) / cs.length
    }
    expect(avg('hurried')).toBeLessThan(avg('normal') * 0.7)
    expect(avg('family')).toBeGreaterThan(avg('normal'))
  })

  it('a família traz um acompanhante desenhado; só o indeciso tem hora de mudar de ideia', () => {
    const list = customersOf(30, 800)
    for (const c of list) {
      expect(c.companion !== null).toBe(c.type === 'family')
      expect(c.mindChangeAt !== null).toBe(c.type === 'indecisive')
    }
  })

  it('o indeciso muda de ideia no meio do pedido, uma única vez, e ganha paciência', () => {
    const c = { ...testCustomer(order('classico'), 1, 0, 'indecisive'), mindChangeAt: 0.6 }
    const s: SessionState = { ...testSession(), slots: [c, null, null], selectedSlot: 0, spawnTimer: 999 }
    const r = run(s, player(), c.patienceMax) // até quase o fim
    const changed = r.events.filter((e) => e.type === 'customerChangedMind')
    expect(changed).toHaveLength(1)
    const after = r.session.slots[0] ?? r.session.slots.find(Boolean)
    expect(after?.changedMind).toBe(true)
    expect(after?.order.burgers[0]).not.toBe('classico')
  })

  it('changeMind troca um lanche por outro diferente e dá paciência extra', () => {
    const c = testCustomer(order('classico', { burgers: ['classico', 'simples'] }), 0.5, 0, 'indecisive')
    const [changed] = changeMind(c, 30, 123)
    expect(changed.order.burgers).toHaveLength(2)
    expect(changed.order.burgers).not.toEqual(c.order.burgers)
    expect(changed.patience).toBe(c.patience + CUSTOMER_RULES.changeMindPatienceBonus)
    expect(changed.changedMind).toBe(true)
  })

  it('o crítico bem servido dá muita reputação; mal servido, derruba', () => {
    const perfect = serveOrder(withBurgerOnTray(withCustomer(order('simples'), 1, 'critic'), 'simples'), player())
    const normal = serveOrder(withBurgerOnTray(withCustomer(order('simples'), 1, 'normal'), 'simples'), player())
    expect(perfect.player.reputation).toBeGreaterThan(normal.player.reputation)
    const off = serveOrder(withBurgerOnTray(withCustomer(order('simples'), 0.2, 'critic'), 'simples'), player())
    const offNormal = serveOrder(withBurgerOnTray(withCustomer(order('simples'), 0.2, 'normal'), 'simples'), player())
    expect(off.player.reputation).toBeLessThan(offNormal.player.reputation)
    expect(perfect.player.reviews[0]).toMatchObject({ weight: CUSTOMER_TYPES.critic.reviewWeight, type: 'critic' })
  })

  it('o influenciador bem atendido conta para o movimento de amanhã; mal atendido, não', () => {
    const good = serveOrder(withBurgerOnTray(withCustomer(order('simples'), 1, 'influencer'), 'simples'), player())
    expect(good.session.stats.influencerHappy).toBe(1)
    const bad = serveOrder(withBurgerOnTray(withCustomer(order('simples'), 1, 'influencer'), 'classico'), player())
    expect(bad.session.stats.influencerHappy).toBe(0)
    const normal = serveOrder(withBurgerOnTray(withCustomer(order('simples'), 1, 'normal'), 'simples'), player())
    expect(normal.session.stats.influencerHappy).toBe(0)
  })
})
