import {
  LOAN,
  MAX_STOCK,
  PROGRESSION,
  ECONOMY,
  REPUTATION,
  STOCK_IDS,
  STOCK_ITEMS,
} from '../config'
import {
  clampPrice,
  computeReputation,
  createPlayer,
  menuItems,
  type LoanState,
  type PlayerCore,
  type PlayerState,
  type Prices,
  type Review,
  type Stock,
  type StockAges,
} from '../engine'

/** Versão atual do formato do save. Some 1 a cada mudança e adicione a migração `vN → vN+1` abaixo. */
export const SAVE_VERSION = 2

export interface Settings {
  reduceMotion: boolean
}

export interface SaveData {
  hasSave: boolean
  player: PlayerState
  settings: Settings
}

export type Migration = (data: Record<string, unknown>) => Record<string, unknown>

/**
 * `MIGRATIONS[n]` converte um save da versão n para a versão n+1.
 * v1 → v2 (Etapa 3): o jogador ganha estoque, preços, avaliações, empréstimo etc. Os campos novos recebem
 * os valores iniciais; dinheiro, XP, nível e dia são mantidos. A reputação passa a ser calculada pelas avaliações.
 */
export const MIGRATIONS: Record<number, Migration> = {
  1: (data) => {
    const player = typeof data.player === 'object' && data.player !== null ? (data.player as Record<string, unknown>) : {}
    return { ...data, player: { ...createPlayer(), ...player, reputation: PROGRESSION.startingReputation } }
  },
}

export function defaultPlayer(): PlayerState {
  return createPlayer()
}

export function defaultSave(): SaveData {
  return { hasSave: false, player: createPlayer(), settings: { reduceMotion: false } }
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

function num(v: unknown, fallback: number, min: number, max: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback
}

function sanitizeReviews(raw: unknown): Review[] {
  if (!Array.isArray(raw)) return []
  const out: Review[] = []
  for (const r of raw) {
    if (!isRecord(r) || typeof r.text !== 'string' || typeof r.name !== 'string' || typeof r.id !== 'string') continue
    out.push({
      id: r.id.slice(0, 40),
      day: Math.floor(num(r.day, 1, 1, Number.MAX_SAFE_INTEGER)),
      stars: Math.round(num(r.stars, 3, 1, 5)),
      text: r.text.slice(0, 120),
      name: r.name.slice(0, 30),
    })
  }
  return out.slice(0, REPUTATION.keepReviews)
}

function sanitizeCore(raw: unknown): PlayerCore {
  const def = createPlayer()
  const p = isRecord(raw) ? raw : {}
  const rawStock = isRecord(p.stock) ? p.stock : {}
  const rawAge = isRecord(p.stockAge) ? p.stockAge : {}
  const rawPrices = isRecord(p.prices) ? p.prices : {}
  const rawLoan = isRecord(p.loan) ? p.loan : {}

  const stock = Object.fromEntries(
    STOCK_IDS.map((id) => [id, Math.floor(num(rawStock[id], def.stock[id], 0, MAX_STOCK))]),
  ) as Stock
  const stockAge: StockAges = {}
  for (const id of STOCK_IDS) {
    const limit = STOCK_ITEMS[id].spoilDays
    if (limit !== undefined) stockAge[id] = num(rawAge[id], 0, 0, limit)
  }
  const prices: Prices = {}
  for (const item of menuItems()) prices[item.key] = clampPrice(item.key, num(rawPrices[item.key], item.basePrice, 0, 1e6))
  const loan: LoanState = {
    taken: rawLoan.taken === true,
    installmentsLeft: Math.floor(num(rawLoan.installmentsLeft, 0, 0, LOAN.installments)),
    installment: Math.floor(num(rawLoan.installment, 0, 0, 1e6)),
  }
  const reviews = sanitizeReviews(p.reviews)

  return {
    money: Math.floor(num(p.money, def.money, -1e9, Number.MAX_SAFE_INTEGER)),
    xp: num(p.xp, def.xp, 0, Number.MAX_SAFE_INTEGER),
    level: Math.floor(num(p.level, def.level, 1, PROGRESSION.maxLevel)),
    day: Math.floor(num(p.day, def.day, 1, Number.MAX_SAFE_INTEGER)),
    reputation: computeReputation(reviews),
    stock,
    stockAge,
    prices,
    reviews,
    loan,
    debtDays: Math.floor(num(p.debtDays, 0, 0, ECONOMY.bankruptcyDays)),
    todayPurchases: Math.floor(num(p.todayPurchases, 0, 0, Number.MAX_SAFE_INTEGER)),
    bankrupt: p.bankrupt === true,
  }
}

/** Garante um save válido: completa campos que faltam e descarta valores absurdos. Nunca lança erro. */
export function sanitizeSave(raw: unknown): SaveData {
  const def = defaultSave()
  if (!isRecord(raw)) return def
  const s = isRecord(raw.settings) ? raw.settings : {}
  const p = isRecord(raw.player) ? raw.player : {}
  const core = sanitizeCore(p)
  // Dia em andamento só é válido se o estado de abertura estiver íntegro.
  const open = p.phase === 'open' && isRecord(p.dayStart)
  return {
    hasSave: raw.hasSave === true,
    player: { ...core, phase: open ? 'open' : 'prep', dayStart: open ? sanitizeCore(p.dayStart) : null },
    settings: { reduceMotion: typeof s.reduceMotion === 'boolean' ? s.reduceMotion : def.settings.reduceMotion },
  }
}

/** Aplica as migrações em cadeia até a versão atual e então sanitiza. Saves futuros ou corrompidos viram o padrão/são sanitizados. */
export function migrateSave(
  persisted: unknown,
  fromVersion: number,
  migrations: Record<number, Migration> = MIGRATIONS,
  currentVersion: number = SAVE_VERSION,
): SaveData {
  if (!isRecord(persisted)) return defaultSave()
  let data: Record<string, unknown> = persisted
  for (let v = fromVersion; v < currentVersion; v++) {
    const migrate = migrations[v]
    if (!migrate) return sanitizeSave(data)
    data = migrate(data)
  }
  return sanitizeSave(data)
}
