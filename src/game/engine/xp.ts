import { PROGRESSION, type Recipe } from '../config'

/** XP necessário para sair do nível `level` para o próximo. */
export function xpToNext(level: number): number {
  return Math.round(PROGRESSION.xpBase * Math.pow(PROGRESSION.xpGrowth, level - 1))
}

export function xpForServe(recipe: Recipe, correct: boolean): number {
  if (!correct) return PROGRESSION.xpPerWrongServe
  return PROGRESSION.xpPerCorrectServe + PROGRESSION.xpPerIngredient * recipe.ingredients.length
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
