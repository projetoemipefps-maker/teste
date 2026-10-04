import type { CupSize, IngredientId, StockId } from '../config'

export type { CupSize, StockId }

/** Quantidade de cada item do estoque. */
export type Stock = Record<StockId, number>
/** Dias parado de cada item fresco. */
export type StockAges = Partial<Record<StockId, number>>
/** Preços de venda: `recipe:<id>`, `fries`, `drink:<tamanho>`. */
export type Prices = Record<string, number>

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
  /** Preço do pedido em relação ao preço padrão (1 = padrão); afeta paciência e gorjeta. */
  priceRatio: number
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
  /** Valor pago pelos itens (faturamento). */
  revenue: number
  /** Gorjetas + bônus de carne no ponto. */
  tips: number
  /** Soma das notas dos atendimentos (para a média). */
  starsTotal: number
  xpGained: number
  /** Lanches entregues certos, por receita (para o "mais vendido"). */
  soldByRecipe: Record<string, number>
}

/** Estado de um turno em andamento (não vai para o save). */
export interface SessionState {
  /** Estoque do dia: começa igual ao do jogador e é gasto durante o turno. */
  stock: Stock
  /** Movimento do dia (a "previsão"), que multiplica a chegada de clientes. */
  dayMultiplier: number
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

export interface Review {
  id: string
  day: number
  stars: number
  text: string
  name: string
}

export interface LoanState {
  /** Já pediu o empréstimo (só dá para pedir uma vez). */
  taken: boolean
  installmentsLeft: number
  installment: number
}

/** Tudo o que o jogador acumula (vai para o save), sem o controle do dia em andamento. */
export interface PlayerCore {
  money: number
  xp: number
  level: number
  day: number
  /** Reputação em estrelas (0 a 5), calculada pelas avaliações recentes. */
  reputation: number
  stock: Stock
  stockAge: StockAges
  prices: Prices
  /** Avaliações, da mais recente para a mais antiga. */
  reviews: Review[]
  loan: LoanState
  /** Dias seguidos fechando com o caixa negativo. */
  debtDays: number
  /** Quanto foi gasto em estoque na preparação do dia atual. */
  todayPurchases: number
  bankrupt: boolean
}

export interface PlayerState extends PlayerCore {
  /** 'open' = o dia está em andamento (se a página recarregar, o dia recomeça de `dayStart`). */
  phase: 'prep' | 'open'
  dayStart: PlayerCore | null
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
      review: Review
    }
  | { type: 'customerLost'; slot: number; customerId: number; review: Review }
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
