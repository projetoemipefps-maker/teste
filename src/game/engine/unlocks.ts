import {
  COOKABLES,
  CUSTOMER_TYPES,
  CUSTOMER_TYPE_IDS,
  DESSERTS,
  DESSERT_IDS,
  DRINK_CONFIG,
  DRINK_KINDS,
  EXTRA_UNLOCKS,
  FRYER_BASKET_LEVELS,
  GRILL,
  INGREDIENTS,
  INGREDIENT_IDS,
  OVEN_SLOT_LEVELS,
  RECIPES,
  SIDE_IDS,
  STOCK_IDS,
  STOCK_ITEMS,
  type CustomerTypeConfig,
  type DessertId,
  type DrinkKind,
  type IngredientId,
  type Recipe,
  type SideId,
  type StockId,
} from '../config'

export type UnlockKind = 'ingredient' | 'side' | 'drink' | 'dessert' | 'recipe' | 'customer' | 'equipment'

export interface UnlockEntry {
  level: number
  kind: UnlockKind
  id: string
  name: string
  detail?: string
}

const KIND_ORDER: readonly UnlockKind[] = ['recipe', 'ingredient', 'side', 'drink', 'dessert', 'customer', 'equipment']

/** Tudo que o jogador libera ao subir de nível (gerado dos catálogos da config). Nível 1 é o que já vem de início. */
export function allUnlocks(): UnlockEntry[] {
  const out: UnlockEntry[] = []
  for (const id of INGREDIENT_IDS) {
    const ing = INGREDIENTS[id]
    if (ing.role === 'closing' || ing.unlockLevel <= 1) continue
    out.push({ level: ing.unlockLevel, kind: 'ingredient', id, name: ing.name })
  }
  for (const id of SIDE_IDS) {
    const c = COOKABLES[id]
    if (c.unlockLevel > 1) out.push({ level: c.unlockLevel, kind: 'side', id, name: c.name })
  }
  for (const id of DRINK_KINDS) {
    const d = DRINK_CONFIG[id]
    if (d.unlockLevel > 1) out.push({ level: d.unlockLevel, kind: 'drink', id, name: d.name })
  }
  for (const id of DESSERT_IDS) {
    const d = DESSERTS[id]
    if (d.unlockLevel > 1) out.push({ level: d.unlockLevel, kind: 'dessert', id, name: d.name })
  }
  for (const r of RECIPES) {
    if (r.unlockLevel > 1) out.push({ level: r.unlockLevel, kind: 'recipe', id: r.id, name: r.name, ...(r.signature && { detail: 'Lanche assinatura!' }) })
  }
  for (const id of CUSTOMER_TYPE_IDS) {
    const c = CUSTOMER_TYPES[id]
    if (c.unlockLevel > 1) out.push({ level: c.unlockLevel, kind: 'customer', id, name: c.name, detail: c.description })
  }
  GRILL.slotLevels.forEach((level, i) => {
    if (level > 1) out.push({ level, kind: 'equipment', id: `grill-${i + 1}`, name: `Espaço ${i + 1} na chapa` })
  })
  FRYER_BASKET_LEVELS.forEach((level, i) => {
    if (level > 1 && i >= 2) out.push({ level, kind: 'equipment', id: `fryer-${i + 1}`, name: `Cesto ${i + 1} na fritadeira` })
  })
  for (const e of EXTRA_UNLOCKS) out.push({ level: e.level, kind: e.kind, id: e.id, name: e.name, ...(e.detail && { detail: e.detail }) })
  return out.sort((a, b) => a.level - b.level || KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind))
}

const ALL = allUnlocks()

export const unlocksAtLevel = (level: number): UnlockEntry[] => ALL.filter((u) => u.level === level)

/** O que foi liberado ao ir de `from` (exclusive) até `to` (inclusive). */
export const unlocksBetween = (from: number, to: number): UnlockEntry[] => ALL.filter((u) => u.level > from && u.level <= to)

const count = (levels: readonly number[], level: number) => levels.filter((l) => l <= level).length
export const grillSlotCount = (level: number): number => count(GRILL.slotLevels, level)
export const fryerBasketCount = (level: number): number => count(FRYER_BASKET_LEVELS, level)
export const ovenSlotCount = (level: number): number => count(OVEN_SLOT_LEVELS, level)

export const unlockedRecipes = (level: number): Recipe[] => RECIPES.filter((r) => r.unlockLevel <= level)
export const isRecipeUnlocked = (recipe: Recipe, level: number): boolean => recipe.unlockLevel <= level
export const unlockedSides = (level: number): SideId[] => SIDE_IDS.filter((id) => COOKABLES[id].unlockLevel <= level)
export const unlockedDrinkKinds = (level: number): DrinkKind[] => DRINK_KINDS.filter((id) => DRINK_CONFIG[id].unlockLevel <= level)
export const unlockedDesserts = (level: number): DessertId[] => DESSERT_IDS.filter((id) => DESSERTS[id].unlockLevel <= level)
export const unlockedCustomerTypes = (level: number): CustomerTypeConfig[] =>
  CUSTOMER_TYPE_IDS.map((id) => CUSTOMER_TYPES[id]).filter((c) => c.unlockLevel <= level)
export const isIngredientUnlocked = (id: IngredientId, level: number): boolean => INGREDIENTS[id].unlockLevel <= level
export const isStockUnlocked = (id: StockId, level: number): boolean => STOCK_ITEMS[id].unlockLevel <= level
export const unlockedStockIds = (level: number): StockId[] => STOCK_IDS.filter((id) => isStockUnlocked(id, level))
