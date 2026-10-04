import { CUSTOMERS, SHIFT } from '../config'
import { firstFreeSlot, rollCustomer } from './customers'
import { applyReputation, reputationDelta } from './rating'
import { randomRange } from './rng'
import type { Customer, GameEvent, PlayerState, SessionState, StepResult } from './types'

/** Avança o turno `dt` segundos: paciência, saída de clientes, chegadas e fim do turno. Função pura. */
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
    reputation = applyReputation(reputation, reputationDelta('lost', 0))
    lost += 1
    events.push({ type: 'customerLost', slot: c.slot, customerId: c.id })
    return { ...c, patience: 0, status: 'leaving', mood: 'angry', leaveTimer: CUSTOMERS.leaveDuration }
  })

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
