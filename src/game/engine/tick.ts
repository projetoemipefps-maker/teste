import { COOKABLES, CUSTOMERS, DEMAND, SHIFT } from '../config'
import { isClosing } from './clock'
import { changeMind, firstFreeSlot, patienceRatio, rollCustomer } from './customers'
import { spawnInterval } from './demand'
import { pourCup } from './drinks'
import { alarmRinging, cookPatty, pattyStage } from './grill'
import { addReview } from './reputation'
import { makeLostReview } from './reviews'
import { nextRandom } from './rng'
import { effectiveReputation } from './upgrades'
import type { CookerItem, Customer, GameEvent, GrillPatty, PlayerState, SessionState, Station, StepResult, StoredItem } from './types'

const burntBefore = (p: GrillPatty) => pattyStage(p) === 'burnt'

/**
 * Avança o turno `dt` segundos: cozimento, paciência, saída de clientes, chegadas (conforme a hora, o dia,
 * a reputação e os preços) e fechamento. Função pura.
 */
export function step(session: SessionState, player: PlayerState, dtRaw: number): StepResult {
  if (session.ended || dtRaw <= 0) return { session, player, events: [] }
  const dt = Math.min(dtRaw, SHIFT.maxDeltaSeconds)
  const events: GameEvent[] = []
  let nextPlayer = player
  let lost = session.stats.lost
  let { rngState, nextCustomerId, spawnTimer, selectedSlot } = session

  const slots: (Customer | null)[] = session.slots.map((c) => {
    if (!c) return null
    if (c.status === 'leaving') {
      const leaveTimer = c.leaveTimer - dt
      return leaveTimer <= 0 ? null : { ...c, leaveTimer }
    }
    const patience = c.patience - dt
    if (patience > 0) {
      const waiting = { ...c, patience }
      // Indeciso: muda de ideia no meio do pedido.
      if (c.mindChangeAt !== null && !c.changedMind && patienceRatio(waiting) <= c.mindChangeAt) {
        const [changed, next] = changeMind(waiting, session.level, rngState)
        rngState = next
        events.push({ type: 'customerChangedMind', slot: c.slot, customerId: c.id })
        return changed
      }
      return waiting
    }
    const review = makeLostReview(c.id, player.day)
    nextPlayer = addReview(nextPlayer, review)
    lost += 1
    events.push({ type: 'customerLost', slot: c.slot, customerId: c.id, review })
    return { ...c, patience: 0, status: 'leaving', mood: 'angry', leaveTimer: CUSTOMERS.leaveDuration }
  })

  // Cozinha: chapa, fritadeira, estufa e máquina de refrigerante.
  const { perks } = session
  const grill = session.grill.map((p, slot): GrillPatty | null => {
    if (!p) return null
    const next = cookPatty(p, dt * perks.grillSpeed)
    if (!burntBefore(p) && burntBefore(next)) events.push({ type: 'pattyBurnt', slot })
    if (!alarmRinging(p, perks) && alarmRinging(next, perks)) events.push({ type: 'pattyAlarm', slot })
    return next
  })
  const cookItems = (items: (CookerItem | null)[], station: Station, speed: number): (CookerItem | null)[] =>
    items.map((b, index) => {
      if (!b) return null
      const cook = b.cook + dt * speed
      const c = COOKABLES[b.kind]
      if (b.cook < c.readySeconds && cook >= c.readySeconds) events.push({ type: 'cookReady', station, index })
      if (b.cook < c.burntSeconds && cook >= c.burntSeconds) events.push({ type: 'cookBurnt', station, index })
      return { ...b, cook }
    })
  const fryer = cookItems(session.fryer, 'fryer', perks.fryerSpeed)
  const oven = cookItems(session.oven, 'oven', 1)
  const age = (items: StoredItem[]): StoredItem[] => items.map((f) => ({ ...f, age: f.age + dt }))
  const warmer = age(session.warmer)
  const shelf = age(session.shelf)
  let cup = session.cup
  let pouring = session.pouring
  if (cup && pouring) {
    const poured = pourCup(cup, dt, perks)
    cup = poured.cup
    if (poured.startedSpilling) events.push({ type: 'cupSpilled' })
    if (poured.finished) pouring = false // máquina automática: parou no ponto certo
  }

  const elapsed = session.elapsed + dt
  const closing = isClosing(elapsed)

  spawnTimer -= dt
  if (!closing && spawnTimer <= 0) {
    const free = firstFreeSlot(slots)
    if (free >= 0) {
      const [customer, s1] = rollCustomer(
        rngState,
        session.level,
        nextCustomerId,
        free,
        slots.filter((c): c is Customer => c !== null),
        { prices: nextPlayer.prices, reputation: effectiveReputation(nextPlayer.reputation, perks), patienceBonus: perks.patienceBonus },
      )
      const [jitter, s2] = nextRandom(s1)
      slots[free] = customer
      events.push({ type: 'customerArrived', slot: free, customerId: customer.id })
      nextCustomerId += 1
      rngState = s2
      spawnTimer = spawnInterval(elapsed, session.dayMultiplier, effectiveReputation(nextPlayer.reputation, perks), nextPlayer.prices, jitter, session.level)
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

  // Depois de fechar, o dia acaba quando o balcão esvazia (ou ao fim da tolerância).
  const ended =
    (closing && slots.every((c) => c === null)) || elapsed >= SHIFT.durationSeconds + DEMAND.closingGraceSeconds
  if (ended) events.push({ type: 'shiftEnded' })

  return {
    session: {
      ...session,
      slots,
      grill,
      fryer,
      warmer,
      oven,
      shelf,
      cup,
      pouring: ended ? false : pouring,
      elapsed,
      ended,
      spawnTimer,
      nextCustomerId,
      rngState,
      selectedSlot,
      stats: { ...session.stats, lost },
    },
    player: nextPlayer,
    events,
  }
}
