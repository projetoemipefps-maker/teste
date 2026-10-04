import { describe, expect, it } from 'vitest'
import { CUSTOMERS, PROGRESSION, RECIPES, SHIFT, ECONOMY } from '../config'
import { addToBurger, createSession, discardBurger, selectSlot } from './session'
import { serveOrder, canServe } from './serve'
import { step } from './tick'
import { getRecipe, patienceFor, patienceRatio } from './customers'
import { nextRandom, randomInt } from './rng'
import { recipePrice } from './payment'
import type { PlayerState, SessionState, Customer } from './types'

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

function withCustomer(recipeId: string, patienceRatioValue = 1): SessionState {
  const recipe = getRecipe(recipeId)
  const max = patienceFor(recipe)
  const c: Customer = {
    id: 1,
    slot: 0,
    recipeId,
    variant: 0,
    patienceMax: max,
    patience: max * patienceRatioValue,
    status: 'waiting',
    mood: 'neutral',
    leaveTimer: 0,
  }
  const s = createSession(1)
  return { ...s, slots: [c, null, null], selectedSlot: 0, nextCustomerId: 2, spawnTimer: 999 }
}

function build(session: SessionState, ids: readonly string[]) {
  let s = session
  for (const id of ids) s = addToBurger(s, id as never).session
  return s
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

describe('seleção e bancada', () => {
  it('seleciona e desmarca o cliente; ignora vaga vazia', () => {
    const s = withCustomer('simples')
    const deselected = selectSlot(s, 0)
    expect(deselected.selectedSlot).toBeNull()
    expect(selectSlot(deselected, 0).selectedSlot).toBe(0)
    expect(selectSlot(s, 1)).toBe(s)
  })

  it('descartar limpa o lanche', () => {
    const s = build(withCustomer('simples'), ['bunBottom', 'patty'])
    expect(discardBurger(s).session.burger).toEqual([])
    expect(discardBurger(createSession(1)).events).toEqual([])
  })

  it('ingrediente inválido não gera evento', () => {
    const r = addToBurger(createSession(1), 'patty')
    expect(r.events).toEqual([])
    expect(r.session.burger).toEqual([])
  })
})

describe('entrega', () => {
  it('lanche certo: cliente feliz, paga com gorjeta, ganha XP e reputação', () => {
    const recipe = getRecipe('classico')
    const s = build(withCustomer('classico'), recipe.ingredients)
    const r = serveOrder(s, player())
    const c = r.session.slots[0]!
    expect(c.status).toBe('leaving')
    expect(c.mood).toBe('happy')
    expect(r.player.money).toBe(recipePrice(recipe) + Math.round(recipePrice(recipe) * ECONOMY.tipMaxFraction))
    expect(r.player.xp).toBeGreaterThan(0)
    expect(r.player.reputation).toBeGreaterThan(PROGRESSION.startingReputation)
    expect(r.session.burger).toEqual([])
    expect(r.session.selectedSlot).toBeNull()
    expect(r.session.stats).toMatchObject({ served: 1, wrong: 0 })
    expect(r.events[0]).toMatchObject({ type: 'customerServed', correct: true })
  })

  it('lanche errado: cliente bravo, paga menos e perde reputação', () => {
    const s = build(withCustomer('classico'), ['bunBottom', 'patty', 'bunTop'])
    const r = serveOrder(s, player())
    expect(r.session.slots[0]!.mood).toBe('angry')
    expect(r.player.money).toBe(Math.round(recipePrice(getRecipe('classico')) * ECONOMY.wrongPayFraction))
    expect(r.player.reputation).toBeLessThan(PROGRESSION.startingReputation)
    expect(r.session.stats).toMatchObject({ served: 0, wrong: 1 })
  })

  it('lanche incompleto também conta como errado', () => {
    const s = build(withCustomer('simples'), ['bunBottom', 'patty'])
    expect(serveOrder(s, player()).events[0]).toMatchObject({ correct: false })
  })

  it('a gorjeta diminui com a paciência restante', () => {
    const recipe = getRecipe('simples')
    const fast = serveOrder(build(withCustomer('simples', 1), recipe.ingredients), player())
    const slow = serveOrder(build(withCustomer('simples', 0.2), recipe.ingredients), player())
    expect(fast.player.money).toBeGreaterThan(slow.player.money)
  })

  it('não entrega sem cliente selecionado ou sem lanche', () => {
    const noBurger = withCustomer('simples')
    expect(canServe(noBurger)).toBe(false)
    expect(serveOrder(noBurger, player()).session).toBe(noBurger)
    const noSelection = { ...build(withCustomer('simples'), ['bunBottom']), selectedSlot: null }
    expect(canServe(noSelection)).toBe(false)
  })

  it('sobe de nível quando junta XP suficiente', () => {
    const recipe = getRecipe('x-salada')
    const s = build(withCustomer('x-salada'), recipe.ingredients)
    const r = serveOrder(s, { ...player(), xp: PROGRESSION.xpBase - 1 })
    expect(r.player.level).toBe(2)
    expect(r.events.some((e) => e.type === 'leveledUp')).toBe(true)
  })
})

describe('passagem do tempo', () => {
  it('a paciência diminui e o dt é limitado', () => {
    const s = withCustomer('simples')
    const r = step(s, player(), 5)
    const lost = s.slots[0]!.patience - r.session.slots[0]!.patience
    expect(lost).toBeCloseTo(SHIFT.maxDeltaSeconds)
  })

  it('paciência zerada: cliente vai embora sem pagar e a reputação cai', () => {
    const s = withCustomer('simples', 0.001)
    const r = run(s, player(), 0.5)
    expect(r.events.some((e) => e.type === 'customerLost')).toBe(true)
    expect(r.player.money).toBe(0)
    expect(r.player.reputation).toBeLessThan(PROGRESSION.startingReputation)
    expect(r.session.stats.lost).toBe(1)
  })

  it('o cliente que saiu libera a vaga depois do tempo de saída', () => {
    const s = withCustomer('simples', 0.001)
    const r = run(s, player(), CUSTOMERS.leaveDuration + 0.5)
    expect(r.session.slots[0]).toBeNull()
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
    for (const c of r.session.slots) if (c) expect(RECIPES.some((x) => x.id === c.recipeId)).toBe(true)
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
    const c = withCustomer('simples').slots[0]!
    expect(patienceRatio(c)).toBe(1)
    expect(patienceRatio({ ...c, patience: -3 })).toBe(0)
  })
})
