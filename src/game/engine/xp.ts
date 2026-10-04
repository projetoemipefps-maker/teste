import { PROGRESSION } from '../config'

/** XP necessário para sair do nível `level` para o próximo: tabela rápida no começo e curva depois. */
export function xpToNext(level: number): number {
  const early = PROGRESSION.earlyXp[level - 1]
  if (early !== undefined) return early
  return Math.round(PROGRESSION.xpBase * Math.pow(level, PROGRESSION.xpExponent))
}

/** XP de um atendimento: nota, itens extras entregues e o tipo de cliente (`xpFactor`). */
export function xpForServe(stars: number, extrasDelivered: number, xpFactor = 1): number {
  const base = PROGRESSION.xpByStars[Math.min(5, Math.max(1, stars)) - 1] ?? 0
  return Math.round((base + PROGRESSION.xpPerExtraItem * extrasDelivered) * xpFactor)
}

export interface XpResult {
  level: number
  xp: number
  levelsGained: number
}

export function addXp(level: number, xp: number, gain: number): XpResult {
  let l = level
  let x = xp + gain
  let gained = 0
  while (l < PROGRESSION.maxLevel && x >= xpToNext(l)) {
    x -= xpToNext(l)
    l += 1
    gained += 1
  }
  if (l >= PROGRESSION.maxLevel) x = 0
  return { level: l, xp: x, levelsGained: gained }
}

/** Progresso da barra de XP (0–1). */
export function xpProgress(level: number, xp: number): number {
  if (level >= PROGRESSION.maxLevel) return 1
  return Math.min(1, xp / xpToNext(level))
}

/** XP total necessário para chegar ao nível `level` partindo do 1. */
export function totalXpForLevel(level: number): number {
  let sum = 0
  for (let l = 1; l < level; l++) sum += xpToNext(l)
  return sum
}
