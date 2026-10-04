import { CUSTOMERS, FRYER, SHIFT } from '../config'
import { firstFreeSlot, rollCustomer } from './customers'
import { pourCup } from './drinks'
import { cookPatty, pattyStage } from './grill'
import { applyReputation, reputationLost } from './rating'
import { randomRange } from './rng'
import type { Customer, FriesPortion, FryBasket, GameEvent, GrillPatty, PlayerState, SessionState, StepResult } from './types'

const burntBefore = (p: GrillPatty) => pattyStage(p) === 'burnt'

/** Avança o turno `dt` segundos: cozimento, paciência, saída de clientes, chegadas e fim do turno. Função pura. */
export function step(session: SessionState, player: PlayerState, dtRaw: number): StepResult {
  if (session.ended || dtRaw <= 0) return { session, player, events: [] }
  const dt = Math.min(dtRaw, SHIFT.maxDeltaSeconds)
  const events: GameEvent[] = []
  let reputation = player.reputation
  let lost = session.stats.lost
  let { rngState, nextCustomerId, spawnTimer, selectedSlot } = session

  const slots: (Customer | null)[] = session.slots.map((c) => {
    if (!c) return null
    if (c.status === 'leaving') {
      const leaveTimer = c.leaveTimer - dt
      return leaveTimer <= 0 ? null : { ...c, leaveTimer }
    }
    const patience = c.patience - dt
    if (patience > 0) return { ...c, patience }
    reputation = applyReputation(reputation, reputationLost())
    lost += 1
    events.push({ type: 'customerLost', slot: c.slot, customerId: c.id })
    return { ...c, patience: 0, status: 'leaving', mood: 'angry', leaveTimer: CUSTOMERS.leaveDuration }
  })

  // Cozinha: chapa, fritadeira, estufa e máquina de refrigerante.
  const grill = session.grill.map((p, slot): GrillPatty | null => {
    if (!p) return null
    const next = cookPatty(p, dt)
    if (!burntBefore(p) && burntBefore(next)) events.push({ type: 'pattyBurnt', slot })
    return next
  })
  const fryer = session.fryer.map((b, basket): FryBasket | null => {
    if (!b) return null
    const cook = b.cook + dt
    if (b.cook < FRYER.readySeconds && cook >= FRYER.readySeconds) events.push({ type: 'friesReady', basket })
    if (b.cook < FRYER.burntSeconds && cook >= FRYER.burntSeconds) events.push({ type: 'friesBurnt', basket })
    return { cook }
  })
  const warmer: FriesPortion[] = session.warmer.map((f) => ({ age: f.age + dt }))
  let cup = session.cup
  if (cup && session.pouring) {
    const poured = pourCup(cup, dt)
    cup = poured.cup
    if (poured.startedSpilling) events.push({ type: 'cupSpilled' })
  }

  const elapsed = session.elapsed + dt
  const ended = elapsed >= SHIFT.durationSeconds

  spawnTimer -= dt
  if (!ended && spawnTimer <= 0) {
    const free = firstFreeSlot(slots)
    if (free >= 0) {
      const [customer, s1] = rollCustomer(
        rngState,
        player.level,
        nextCustomerId,
        free,
        slots.flatMap((c) => (c ? [c.variant] : [])),
      )
      const [wait, s2] = randomRange(s1, CUSTOMERS.spawnIntervalMin, CUSTOMERS.spawnIntervalMax)
      slots[free] = customer
      events.push({ type: 'customerArrived', slot: free, customerId: customer.id })
      nextCustomerId += 1
      rngState = s2
      spawnTimer = wait
    } else {
      spawnTimer = 0 // balcão cheio: o próximo chega assim que abrir uma vaga
    }
  }

  // Seleciona automaticamente o primeiro cliente quando nada está selecionado.
  if (selectedSlot !== null && slots[selectedSlot]?.status !== 'waiting') selectedSlot = null
  if (selectedSlot === null) {
    const idx = slots.findIndex((c) => c?.status === 'waiting')
    if (idx >= 0) selectedSlot = idx
  }

  if (ended) events.push({ type: 'shiftEnded' })

  return {
    session: {
      ...session,
      slots,
      grill,
      fryer,
      warmer,
      cup,
      pouring: ended ? false : session.pouring,
      elapsed,
      ended,
      spawnTimer,
      nextCustomerId,
      rngState,
      selectedSlot,
      stats: { ...session.stats, lost },
    },
    player: reputation === player.reputation ? player : { ...player, reputation },
    events,
  }
}
