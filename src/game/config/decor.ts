export const DECOR_IDS = ['floor', 'wall', 'neon', 'lighting', 'tables', 'plants', 'jukebox', 'tv'] as const
export type DecorId = (typeof DECOR_IDS)[number]

/** O que cada decoração melhora: paciência dos clientes, gorjetas ou reputação. */
export type DecorBonusKind = 'patience' | 'tip' | 'reputation'

export interface DecorTier {
  name: string
  cost: number
  minLevel: number
  /** Fase da hamburgueria necessária (1 = barraquinha). */
  minVenue: number
  /** Paciência e gorjeta: fração (0.03 = +3%). Reputação: estrelas somadas. */
  bonus: number
}

export interface DecorConfig {
  id: DecorId
  name: string
  bonusKind: DecorBonusKind
  /** Visuais em ordem; comprar um substitui o anterior (o bônus não soma com o de antes). */
  tiers: readonly DecorTier[]
}

const T = (name: string, cost: number, minLevel: number, minVenue: number, bonus: number): DecorTier => ({ name, cost, minLevel, minVenue, bonus })

export const DECOR: Record<DecorId, DecorConfig> = {
  floor: {
    id: 'floor',
    name: 'Piso',
    bonusKind: 'patience',
    tiers: [T('Piso xadrez', 120, 3, 1, 0.02), T('Porcelanato', 450, 9, 2, 0.04), T('Madeira nobre', 1400, 20, 3, 0.07)],
  },
  wall: {
    id: 'wall',
    name: 'Parede',
    bonusKind: 'reputation',
    tiers: [T('Parede pintada', 100, 3, 1, 0.05), T('Tijolinho aparente', 400, 9, 2, 0.1), T('Painel de grafite', 1300, 20, 3, 0.15)],
  },
  neon: {
    id: 'neon',
    name: 'Letreiro neon',
    bonusKind: 'tip',
    tiers: [T('Letreiro simples', 150, 4, 1, 0.03), T('Neon Brasa Burger', 500, 10, 2, 0.06), T('Neon animado', 1600, 22, 3, 0.1)],
  },
  lighting: {
    id: 'lighting',
    name: 'Iluminação',
    bonusKind: 'patience',
    tiers: [T('Lâmpadas pendentes', 130, 3, 1, 0.02), T('Luminárias industriais', 420, 9, 2, 0.04), T('Lustres dourados', 1500, 21, 3, 0.07)],
  },
  tables: {
    id: 'tables',
    name: 'Mesas',
    bonusKind: 'tip',
    tiers: [T('Mesinhas de plástico', 200, 5, 1, 0.03), T('Mesas de madeira', 800, 13, 2, 0.06)],
  },
  plants: {
    id: 'plants',
    name: 'Plantas',
    bonusKind: 'reputation',
    tiers: [T('Vasinhos', 90, 3, 1, 0.05), T('Jardim vertical', 380, 11, 2, 0.1)],
  },
  jukebox: {
    id: 'jukebox',
    name: 'Jukebox',
    bonusKind: 'tip',
    tiers: [T('Jukebox retrô', 400, 6, 1, 0.04), T('Jukebox neon', 1500, 18, 2, 0.08)],
  },
  tv: {
    id: 'tv',
    name: 'TV',
    bonusKind: 'patience',
    tiers: [T('TV de parede', 350, 5, 1, 0.03), T('TV grande de esportes', 1200, 15, 2, 0.06)],
  },
}

export const BONUS_LABEL: Record<DecorBonusKind, string> = {
  patience: 'paciência',
  tip: 'gorjeta',
  reputation: 'reputação',
}
