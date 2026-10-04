/** Liberações que não vêm direto de um catálogo (aparecem na lista do "LEVEL UP!"). */
export interface ExtraUnlock {
  level: number
  kind: 'ingredient' | 'equipment'
  id: string
  name: string
  detail?: string
}

export const EXTRA_UNLOCKS: readonly ExtraUnlock[] = [
  { level: 13, kind: 'ingredient', id: 'doublePatty', name: 'Carne dupla', detail: 'Libera o Smash Duplo' },
]

/** Estoque de presente por item liberado já está em `UNLOCK_GIFT_UNITS` (stock.ts). */
export const MAX_UNLOCKS_PER_LEVEL = 5
