import { WARMER_CAPACITY } from './cookables'
import { MAX_STOCK } from './stock'

/** Loja de melhorias: abre neste nível do jogador. */
export const SHOP = {
  unlockLevel: 3,
} as const

export const EQUIPMENT_IDS = ['grill', 'fryer', 'drinks', 'bench', 'counter', 'fridge', 'register'] as const
export type EquipmentId = (typeof EQUIPMENT_IDS)[number]

export const UPGRADE_IDS = [
  'grillSlots',
  'grillSpeed',
  'grillAlarm',
  'fryerBaskets',
  'fryerSpeed',
  'warmerSize',
  'drinkAuto',
  'benchDouble',
  'counterSeats',
  'fridgeCapacity',
  'fridgeFresh',
  'registerPay',
  'registerTips',
] as const
export type UpgradeId = (typeof UPGRADE_IDS)[number]

export interface UpgradeLevel {
  /** Preço (R$). */
  cost: number
  /** Nível do jogador necessário. */
  minLevel: number
  /** Fase da hamburgueria necessária (1 = barraquinha). */
  minVenue: number
  /** Valor do efeito neste nível (a unidade depende da melhoria; ver `effect`). */
  value: number
}

export interface UpgradeConfig {
  id: UpgradeId
  equipment: EquipmentId
  name: string
  /** Valor sem nenhuma melhoria. */
  base: number
  /** Texto do efeito para um valor (usado no card: "Cozimento 10% mais rápido"). */
  effect: (value: number) => string
  /** Cada item é um nível de melhoria, do primeiro ao último. */
  levels: readonly UpgradeLevel[]
}

const L = (cost: number, minLevel: number, minVenue: number, value: number): UpgradeLevel => ({ cost, minLevel, minVenue, value })
const pct = (v: number) => `${Math.round(v * 100)}%`
const seconds = (v: number) => `${String(v).replace('.', ',')} s`

export const UPGRADES: Record<UpgradeId, UpgradeConfig> = {
  grillSlots: {
    id: 'grillSlots',
    equipment: 'grill',
    name: 'Mais espaços na chapa',
    base: 2,
    effect: (v) => `${v} espaços na chapa`,
    levels: [L(250, 4, 1, 3), L(700, 10, 1, 4), L(1800, 20, 2, 5), L(4500, 32, 3, 6)],
  },
  grillSpeed: {
    id: 'grillSpeed',
    equipment: 'grill',
    name: 'Chapa mais quente',
    base: 0,
    effect: (v) => (v === 0 ? 'Cozimento normal' : `Cozimento ${pct(v)} mais rápido`),
    levels: [L(200, 3, 1, 0.1), L(500, 7, 1, 0.2), L(1100, 14, 2, 0.3), L(2400, 24, 3, 0.4)],
  },
  grillAlarm: {
    id: 'grillAlarm',
    equipment: 'grill',
    name: 'Alarme da chapa',
    base: 0,
    effect: (v) => (v === 0 ? 'Sem alarme' : `Avisa ${seconds(v)} antes de a carne passar do ponto`),
    levels: [L(150, 4, 1, 1), L(400, 9, 1, 2), L(900, 16, 2, 3)],
  },
  fryerBaskets: {
    id: 'fryerBaskets',
    equipment: 'fryer',
    name: 'Mais cestos',
    base: 2,
    effect: (v) => `${v} cestos na fritadeira`,
    levels: [L(350, 5, 1, 3), L(1200, 15, 2, 4)],
  },
  fryerSpeed: {
    id: 'fryerSpeed',
    equipment: 'fryer',
    name: 'Óleo mais quente',
    base: 0,
    effect: (v) => (v === 0 ? 'Fritura normal' : `Fritura ${pct(v)} mais rápida`),
    levels: [L(180, 3, 1, 0.12), L(450, 8, 1, 0.25), L(1000, 16, 2, 0.4)],
  },
  warmerSize: {
    id: 'warmerSize',
    equipment: 'fryer',
    name: 'Estufa maior',
    base: WARMER_CAPACITY,
    effect: (v) => `Estufa para ${v} porções`,
    levels: [L(120, 3, 1, 4), L(300, 7, 1, 5), L(700, 13, 2, 6)],
  },
  drinkAuto: {
    id: 'drinkAuto',
    equipment: 'drinks',
    name: 'Enchimento automático',
    base: -1,
    // -1 = manual; 0 = automático; acima de 0 = automático e mais rápido.
    effect: (v) => (v < 0 ? 'Enchimento manual' : v === 0 ? 'Para sozinho no ponto certo' : `Automático e ${pct(v)} mais rápido`),
    levels: [L(350, 3, 1, 0), L(900, 9, 1, 0.3), L(2200, 18, 2, 0.6)],
  },
  benchDouble: {
    id: 'benchDouble',
    equipment: 'bench',
    name: 'Segundo prato',
    base: 1,
    effect: (v) => (v <= 1 ? 'Monta 1 lanche por vez' : `Monta ${v} lanches ao mesmo tempo`),
    levels: [L(800, 6, 1, 2)],
  },
  counterSeats: {
    id: 'counterSeats',
    equipment: 'counter',
    name: 'Mais lugares no balcão',
    base: 3,
    effect: (v) => `${v} clientes ao mesmo tempo`,
    levels: [L(500, 5, 1, 4), L(1500, 12, 2, 5), L(4000, 24, 3, 6)],
  },
  fridgeCapacity: {
    id: 'fridgeCapacity',
    equipment: 'fridge',
    name: 'Geladeira maior',
    base: MAX_STOCK,
    effect: (v) => `Cabem ${v} de cada item`,
    levels: [L(200, 3, 1, 400), L(550, 8, 1, 550), L(1200, 15, 2, 750), L(2600, 25, 3, 1000)],
  },
  fridgeFresh: {
    id: 'fridgeFresh',
    equipment: 'fridge',
    name: 'Refrigeração melhor',
    base: 0,
    effect: (v) => (v === 0 ? 'Frescos duram o normal' : `Frescos duram +${v} ${v === 1 ? 'dia' : 'dias'}`),
    levels: [L(150, 3, 1, 1), L(400, 8, 1, 2), L(950, 16, 2, 3)],
  },
  registerPay: {
    id: 'registerPay',
    equipment: 'register',
    name: 'Caixa: pagamentos',
    base: 0,
    effect: (v) => (v === 0 ? 'Pagamentos normais' : `Pagamentos ${pct(v)} maiores`),
    levels: [L(300, 4, 1, 0.04), L(800, 10, 1, 0.08), L(1900, 18, 2, 0.12), L(4200, 28, 3, 0.16)],
  },
  registerTips: {
    id: 'registerTips',
    equipment: 'register',
    name: 'Caixa: gorjetas',
    base: 0,
    effect: (v) => (v === 0 ? 'Gorjetas normais' : `Gorjetas ${pct(v)} maiores`),
    levels: [L(250, 4, 1, 0.08), L(650, 10, 1, 0.16), L(1500, 18, 2, 0.25), L(3400, 28, 3, 0.35)],
  },
}

export interface EquipmentConfig {
  id: EquipmentId
  name: string
  /** Frase curta do que o equipamento faz. */
  description: string
  upgrades: readonly UpgradeId[]
}

export const EQUIPMENT: Record<EquipmentId, EquipmentConfig> = {
  grill: { id: 'grill', name: 'Chapa', description: 'Onde as carnes cozinham.', upgrades: ['grillSlots', 'grillSpeed', 'grillAlarm'] },
  fryer: { id: 'fryer', name: 'Fritadeira', description: 'Batatas, nuggets e anéis de cebola.', upgrades: ['fryerBaskets', 'fryerSpeed', 'warmerSize'] },
  drinks: { id: 'drinks', name: 'Máquina de bebidas', description: 'Refri, suco e milkshakes.', upgrades: ['drinkAuto'] },
  bench: { id: 'bench', name: 'Bancada', description: 'Onde os lanches são montados.', upgrades: ['benchDouble'] },
  counter: { id: 'counter', name: 'Balcão', description: 'Quantos clientes cabem na fila.', upgrades: ['counterSeats'] },
  fridge: { id: 'fridge', name: 'Geladeira', description: 'Estoque e frescor dos ingredientes.', upgrades: ['fridgeCapacity', 'fridgeFresh'] },
  register: { id: 'register', name: 'Caixa', description: 'Quanto cada cliente deixa na hora de pagar.', upgrades: ['registerPay', 'registerTips'] },
}

/** A aparência do equipamento vai de 0 (simples) até este valor (o máximo), conforme as melhorias compradas. */
export const MAX_EQUIPMENT_TIER = 3

/** Aumento da chegada de clientes por lugar extra no balcão (balcão maior atrai mais gente). */
export const COUNTER = {
  demandPerExtraSeat: 0.06,
} as const

/** Máquina de bebidas automática: para de encher neste ponto do copo (1 = copo cheio, no ponto certo). */
export const DRINK_AUTO_STOP_RATIO = 1
