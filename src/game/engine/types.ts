import type { IngredientId } from '../config'

export type Mood = 'neutral' | 'happy' | 'angry'

export interface Customer {
  id: number
  slot: number
  recipeId: string
  variant: number
  patienceMax: number
  patience: number
  status: 'waiting' | 'leaving'
  mood: Mood
  /** Segundos restantes até liberar a vaga, quando `status === 'leaving'`. */
  leaveTimer: number
}

export interface ShiftStats {
  served: number
  wrong: number
  lost: number
  earned: number
}

/** Estado de um turno em andamento (não vai para o save). */
export interface SessionState {
  slots: (Customer | null)[]
  burger: IngredientId[]
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

export type GameEvent =
  | { type: 'customerArrived'; slot: number; customerId: number }
  | { type: 'ingredientAdded'; ingredient: IngredientId }
  | { type: 'burgerDiscarded' }
  | {
      type: 'customerServed'
      slot: number
      customerId: number
      correct: boolean
      base: number
      tip: number
      total: number
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
