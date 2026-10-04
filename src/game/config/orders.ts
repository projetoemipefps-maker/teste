export interface ComboConfig {
  id: string
  fries: boolean
  drink: boolean
  /** Chance relativa de o pedido ser deste tipo. */
  weight: number
  unlockLevel: number
}

export const COMBOS: readonly ComboConfig[] = [
  { id: 'solo', fries: false, drink: false, weight: 3, unlockLevel: 1 },
  { id: 'com-batata', fries: true, drink: false, weight: 2, unlockLevel: 1 },
  { id: 'com-bebida', fries: false, drink: true, weight: 2, unlockLevel: 1 },
  { id: 'combo', fries: true, drink: true, weight: 3, unlockLevel: 1 },
]
