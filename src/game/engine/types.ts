import type { CupSize, IngredientId } from '../config'

export type { CupSize }

export type Mood = 'neutral' | 'happy' | 'angry'

/** O que o cliente pediu: um lanche e, opcionalmente, batata e bebida. */
export interface OrderItems {
  recipeId: string
  fries: boolean
  drink: CupSize | null
}

export interface Customer {
  id: number
  slot: number
  order: OrderItems
  variant: number
  patienceMax: number
  patience: number
  status: 'waiting' | 'leaving'
  mood: Mood
  /** Segundos restantes até liberar a vaga, quando `status === 'leaving'`. */
  leaveTimer: number
}

/** Ponto da carne que vai para o lanche (queimada vai direto para o lixo). */
export type PattyQuality = 'raw' | 'perfect' | 'overdone'
export type PattyStage = PattyQuality | 'burnt'

/** Carne na chapa: segundos de cada lado em contato com a chapa. */
export interface GrillPatty {
  sides: [number, number]
  /** Lado que está na chapa agora. */
  down: 0 | 1
  flips: number
}

export type FriesStage = 'cooking' | 'ready' | 'burnt'
export interface FryBasket {
  cook: number
}
/** Porção pronta na estufa. */
export interface FriesPortion {
  age: number
}
export type FriesQuality = 'fresh' | 'stale'

export interface Cup {
  size: CupSize
  /** Quanto já foi servido, em ml. */
  fill: number
}
export type DrinkQuality = 'good' | 'low' | 'spilled'

export interface TrayBurger {
  ingredients: IngredientId[]
  /** Ponto de cada carne, na ordem em que aparecem no lanche. */
  patties: PattyQuality[]
}
export interface TrayFries {
  quality: FriesQuality
}
export interface TrayDrink {
  size: CupSize
  quality: DrinkQuality
}
export interface Tray {
  burger: TrayBurger | null
  fries: TrayFries | null
  drink: TrayDrink | null
}
export type TrayItem = keyof Tray

export interface ShiftStats {
  served: number
  lost: number
  earned: number
  /** Soma das notas dos atendimentos (para a média). */
  starsTotal: number
}

/** Estado de um turno em andamento (não vai para o save). */
export interface SessionState {
  slots: (Customer | null)[]
  /** Lanche sendo montado e o ponto de cada carne nele. */
  burger: IngredientId[]
  burgerPatties: PattyQuality[]
  tray: Tray
  grill: (GrillPatty | null)[]
  /** Carnes prontas esperando no prato. */
  held: PattyQuality[]
  fryer: (FryBasket | null)[]
  warmer: FriesPortion[]
  cup: Cup | null
  pouring: boolean
  selectedSlot: number | null
  elapsed: number
  spawnTimer: number
  nextCustomerId: number
  rngState: number
  ended: boolean
  stats: ShiftStats
}

/** Progresso do jogador (vai para o save). */
export interface PlayerState {
  money: number
  xp: number
  level: number
  day: number
  /** Reputação em estrelas, de 0 a 5 (fracionária). */
  reputation: number
}

export type ServiceNote =
  | 'burgerMissing'
  | 'burgerWrong'
  | 'pattyRaw'
  | 'pattyOverdone'
  | 'pattyPerfect'
  | 'friesMissing'
  | 'friesStale'
  | 'drinkMissing'
  | 'drinkWrongSize'
  | 'drinkLow'
  | 'drinkSpilled'
  | 'fast'
  | 'slow'

export type GameEvent =
  | { type: 'customerArrived'; slot: number; customerId: number }
  | { type: 'ingredientAdded'; ingredient: IngredientId }
  | { type: 'burgerDiscarded' }
  | { type: 'trayPlaced'; item: TrayItem }
  | { type: 'trayDiscarded'; item: TrayItem }
  | { type: 'pattyPlaced'; slot: number }
  | { type: 'pattyFlipped'; slot: number }
  | { type: 'pattyBurnt'; slot: number }
  | { type: 'pattyTaken'; slot: number; quality: PattyQuality }
  | { type: 'pattyTrashed'; slot: number }
  | { type: 'friesPlaced'; basket: number }
  | { type: 'friesReady'; basket: number }
  | { type: 'friesBurnt'; basket: number }
  | { type: 'friesTaken'; basket: number }
  | { type: 'friesTrashed'; basket: number }
  | { type: 'cupSpilled' }
  | {
      type: 'customerServed'
      slot: number
      customerId: number
      stars: number
      burgerCorrect: boolean
      itemsPaid: number
      tip: number
      bonus: number
      total: number
      notes: ServiceNote[]
      xp: number
    }
  | { type: 'customerLost'; slot: number; customerId: number }
  | { type: 'leveledUp'; level: number }
  | { type: 'shiftEnded' }

export interface StepResult {
  session: SessionState
  player: PlayerState
  events: GameEvent[]
}

export interface ActionResult {
  session: SessionState
  events: GameEvent[]
}
