import { ECONOMY, PROGRESSION } from '../config'
import type { PlayerState } from '../engine'

/** Versão atual do formato do save. Some 1 a cada mudança e adicione a migração `vN → vN+1` abaixo. */
export const SAVE_VERSION = 1

export interface Settings {
  reduceMotion: boolean
}

export interface SaveData {
  hasSave: boolean
  player: PlayerState
  settings: Settings
}

export type Migration = (data: Record<string, unknown>) => Record<string, unknown>

/** `MIGRATIONS[n]` converte um save da versão n para a versão n+1. */
export const MIGRATIONS: Record<number, Migration> = {}

export function defaultPlayer(): PlayerState {
  return {
    money: ECONOMY.startingMoney,
    xp: 0,
    level: PROGRESSION.startingLevel,
    day: PROGRESSION.startingDay,
    reputation: PROGRESSION.startingReputation,
  }
}

export function defaultSave(): SaveData {
  return { hasSave: false, player: defaultPlayer(), settings: { reduceMotion: false } }
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

function num(v: unknown, fallback: number, min: number, max: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback
}

/** Garante um save válido: completa campos que faltam e descarta valores absurdos. Nunca lança erro. */
export function sanitizeSave(raw: unknown): SaveData {
  const def = defaultSave()
  if (!isRecord(raw)) return def
  const p = isRecord(raw.player) ? raw.player : {}
  const s = isRecord(raw.settings) ? raw.settings : {}
  return {
    hasSave: raw.hasSave === true,
    player: {
      money: Math.floor(num(p.money, def.player.money, 0, Number.MAX_SAFE_INTEGER)),
      xp: num(p.xp, def.player.xp, 0, Number.MAX_SAFE_INTEGER),
      level: Math.floor(num(p.level, def.player.level, 1, PROGRESSION.maxLevel)),
      day: Math.floor(num(p.day, def.player.day, 1, Number.MAX_SAFE_INTEGER)),
      reputation: num(p.reputation, def.player.reputation, 0, PROGRESSION.maxReputation),
    },
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
