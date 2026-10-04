import {
  COUNTER,
  DECOR,
  DECOR_IDS,
  EQUIPMENT,
  EQUIPMENT_IDS,
  FIRST_VENUE,
  MAX_EQUIPMENT_TIER,
  REPUTATION,
  SHOP,
  UPGRADES,
  UPGRADE_IDS,
  VENUES,
  VENUE_IDS,
  type DecorId,
  type DecorTier,
  type EquipmentId,
  type UpgradeId,
  type UpgradeLevel,
  type VenueConfig,
  type VenueId,
} from '../config'
import type { PlayerCore, PlayerState } from './types'

/** Nível comprado de cada melhoria (0 = nenhuma). */
export type UpgradeLevels = Record<UpgradeId, number>
/** Visual comprado de cada decoração (0 = nenhum; 1..n = o visual da lista). */
export type DecorLevels = Record<DecorId, number>

export const emptyUpgrades = (): UpgradeLevels => Object.fromEntries(UPGRADE_IDS.map((id) => [id, 0])) as UpgradeLevels
export const emptyDecor = (): DecorLevels => Object.fromEntries(DECOR_IDS.map((id) => [id, 0])) as DecorLevels

type Progress = Pick<PlayerCore, 'upgrades' | 'decor' | 'venue'>

/** Efeitos de tudo que o jogador comprou (melhorias, decoração e fase). A sessão do dia guarda uma cópia. */
export interface Perks {
  grillSlots: number
  /** Multiplica a velocidade com que a carne esquenta (1 = normal). */
  grillSpeed: number
  /** Segundos de aviso antes de a carne passar do ponto (0 = sem alarme). */
  grillAlarm: number
  fryerBaskets: number
  fryerSpeed: number
  warmerSize: number
  /** A máquina de bebidas para sozinha no ponto certo. */
  drinkAuto: boolean
  drinkSpeed: number
  /** Pratos de montagem (1 ou 2). */
  benches: number
  /** Lugares no balcão. */
  seats: number
  /** Quanto cabe no estoque de cada item. */
  stockCap: number
  /** Dias extras até o fresco estragar. */
  spoilBonus: number
  /** Pagamentos dos itens (fração extra). */
  payBonus: number
  /** Gorjetas (caixa + decoração). */
  tipBonus: number
  /** Paciência dos clientes (decoração). */
  patienceBonus: number
  /** Estrelas somadas à reputação (decoração). */
  reputationBonus: number
  /** Multiplica a chegada de clientes (fase da hamburgueria e lugares no balcão). */
  demandFactor: number
  /** Multiplica os custos fixos do dia. */
  fixedCostFactor: number
  venue: VenueId
}

// ---------- melhorias ----------

export const upgradeMax = (id: UpgradeId): number => UPGRADES[id].levels.length

export const upgradeLevel = (p: Pick<PlayerCore, 'upgrades'>, id: UpgradeId): number =>
  Math.min(upgradeMax(id), Math.max(0, Math.floor(p.upgrades[id] ?? 0)))

/** Valor do efeito no nível dado (nível 0 = o valor base). */
export function upgradeValue(id: UpgradeId, level: number): number {
  const cfg = UPGRADES[id]
  return level <= 0 ? cfg.base : cfg.levels[Math.min(level, cfg.levels.length) - 1]!.value
}

/** Valor atual de uma melhoria do jogador. */
export const currentValue = (p: Pick<PlayerCore, 'upgrades'>, id: UpgradeId): number => upgradeValue(id, upgradeLevel(p, id))

/** Texto do efeito atual ("Cozimento 10% mais rápido"). */
export const currentEffect = (p: Pick<PlayerCore, 'upgrades'>, id: UpgradeId): string => UPGRADES[id].effect(currentValue(p, id))

export function decorTotals(decor: DecorLevels): { patience: number; tip: number; reputation: number } {
  const totals = { patience: 0, tip: 0, reputation: 0 }
  for (const id of DECOR_IDS) {
    const cfg = DECOR[id]
    const tier = Math.min(cfg.tiers.length, Math.max(0, Math.floor(decor[id] ?? 0)))
    if (tier > 0) totals[cfg.bonusKind] += cfg.tiers[tier - 1]!.bonus
  }
  return totals
}

export function computePerks(p: Progress): Perks {
  const v = (id: UpgradeId) => currentValue(p, id)
  const decor = decorTotals(p.decor)
  const venue = VENUES[p.venue] ?? VENUES[FIRST_VENUE]
  const drink = v('drinkAuto')
  const seats = v('counterSeats')
  return {
    grillSlots: v('grillSlots'),
    grillSpeed: 1 + v('grillSpeed'),
    grillAlarm: v('grillAlarm'),
    fryerBaskets: v('fryerBaskets'),
    fryerSpeed: 1 + v('fryerSpeed'),
    warmerSize: v('warmerSize'),
    drinkAuto: drink >= 0,
    drinkSpeed: 1 + Math.max(0, drink),
    benches: v('benchDouble'),
    seats,
    stockCap: v('fridgeCapacity'),
    spoilBonus: v('fridgeFresh'),
    payBonus: v('registerPay'),
    tipBonus: v('registerTips') + decor.tip,
    patienceBonus: decor.patience,
    reputationBonus: decor.reputation,
    demandFactor: venue.demandFactor * (1 + COUNTER.demandPerExtraSeat * (seats - UPGRADES.counterSeats.base)),
    fixedCostFactor: venue.fixedCostFactor,
    venue: venue.id,
  }
}

/** Efeitos de um jogador que não comprou nada (o começo do jogo). */
export const basePerks = (): Perks => computePerks({ upgrades: emptyUpgrades(), decor: emptyDecor(), venue: FIRST_VENUE })

/** Reputação com o bônus da decoração (limitada às 5 estrelas); é a que vale para demanda e paciência. */
export const effectiveReputation = (reputation: number, perks: Pick<Perks, 'reputationBonus'>): number =>
  Math.min(REPUTATION.maxStars, reputation + perks.reputationBonus)

// ---------- aparência dos equipamentos ----------

export function equipmentProgress(p: Pick<PlayerCore, 'upgrades'>, id: EquipmentId): { done: number; total: number } {
  let done = 0
  let total = 0
  for (const u of EQUIPMENT[id].upgrades) {
    done += upgradeLevel(p, u)
    total += upgradeMax(u)
  }
  return { done, total }
}

/** Aparência do equipamento: 0 = simples; cada terço das melhorias compradas sobe um degrau, até o máximo. */
export function equipmentTier(p: Pick<PlayerCore, 'upgrades'>, id: EquipmentId): number {
  const { done, total } = equipmentProgress(p, id)
  if (done <= 0 || total <= 0) return 0
  return Math.min(MAX_EQUIPMENT_TIER, Math.ceil((done / total) * MAX_EQUIPMENT_TIER))
}

export const equipmentTiers = (p: Pick<PlayerCore, 'upgrades'>): Record<EquipmentId, number> =>
  Object.fromEntries(EQUIPMENT_IDS.map((id) => [id, equipmentTier(p, id)])) as Record<EquipmentId, number>

// ---------- loja ----------

/** O que impede uma compra (na ordem em que aparece para o jogador). */
export type Blocker = 'closed' | 'maxed' | 'level' | 'venue' | 'money'

export const shopUnlocked = (level: number): boolean => level >= SHOP.unlockLevel

type ShopPlayer = Pick<PlayerState, 'level' | 'money' | 'phase' | 'venue'>

/** A loja só funciona com o nível mínimo e entre um dia e outro. */
const shopClosed = (p: ShopPlayer): boolean => !shopUnlocked(p.level) || p.phase !== 'prep'

const venueOrder = (id: VenueId): number => VENUES[id].order

function blockerFor(p: ShopPlayer, next: { cost: number; minLevel: number; minVenue: number } | null): Blocker | null {
  if (shopClosed(p)) return 'closed'
  if (!next) return 'maxed'
  if (p.level < next.minLevel) return 'level'
  if (venueOrder(p.venue) < next.minVenue) return 'venue'
  if (p.money < next.cost) return 'money'
  return null
}

export interface UpgradeOffer {
  id: UpgradeId
  level: number
  max: number
  next: UpgradeLevel | null
  blocker: Blocker | null
}

export function upgradeOffer(p: ShopPlayer & Pick<PlayerCore, 'upgrades'>, id: UpgradeId): UpgradeOffer {
  const level = upgradeLevel(p, id)
  const next = UPGRADES[id].levels[level] ?? null
  return { id, level, max: upgradeMax(id), next, blocker: blockerFor(p, next) }
}

/** Compra o próximo nível da melhoria, se o jogador pode (nível, fase e dinheiro). */
export function buyUpgrade(player: PlayerState, id: UpgradeId): PlayerState {
  const offer = upgradeOffer(player, id)
  if (offer.blocker || !offer.next) return player
  return { ...player, money: player.money - offer.next.cost, upgrades: { ...player.upgrades, [id]: offer.level + 1 } }
}

export interface DecorOffer {
  id: DecorId
  tier: number
  max: number
  next: DecorTier | null
  blocker: Blocker | null
}

export const decorTier = (p: Pick<PlayerCore, 'decor'>, id: DecorId): number =>
  Math.min(DECOR[id].tiers.length, Math.max(0, Math.floor(p.decor[id] ?? 0)))

export function decorOffer(p: ShopPlayer & Pick<PlayerCore, 'decor'>, id: DecorId): DecorOffer {
  const tier = decorTier(p, id)
  const next = DECOR[id].tiers[tier] ?? null
  return { id, tier, max: DECOR[id].tiers.length, next, blocker: blockerFor(p, next) }
}

/** Compra o próximo visual da decoração (o novo substitui o anterior). */
export function buyDecor(player: PlayerState, id: DecorId): PlayerState {
  const offer = decorOffer(player, id)
  if (offer.blocker || !offer.next) return player
  return { ...player, money: player.money - offer.next.cost, decor: { ...player.decor, [id]: offer.tier + 1 } }
}

export interface VenueOffer {
  current: VenueConfig
  next: VenueConfig | null
  blocker: Blocker | null
}

export function venueOffer(p: ShopPlayer): VenueOffer {
  const current = VENUES[p.venue]
  const next = VENUE_IDS.map((id) => VENUES[id]).find((v) => v.order === current.order + 1) ?? null
  return { current, next, blocker: blockerFor(p, next && { cost: next.cost, minLevel: next.minLevel, minVenue: 1 }) }
}

/** Compra a expansão para a próxima fase da hamburgueria (nível mínimo e dinheiro). */
export function expandVenue(player: PlayerState): PlayerState {
  const offer = venueOffer(player)
  if (offer.blocker || !offer.next) return player
  return { ...player, money: player.money - offer.next.cost, venue: offer.next.id }
}

/** Itens da loja (melhorias, decoração e expansão) que o jogador pode comprar agora. */
export function affordableCount(p: ShopPlayer & Pick<PlayerCore, 'upgrades' | 'decor'>): number {
  if (shopClosed(p)) return 0
  const upgrades = UPGRADE_IDS.filter((id) => upgradeOffer(p, id).blocker === null).length
  const decor = DECOR_IDS.filter((id) => decorOffer(p, id).blocker === null).length
  return upgrades + decor + (venueOffer(p).blocker === null ? 1 : 0)
}
