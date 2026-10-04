import type {
  CookableId,
  CupSize,
  CustomerTypeId,
  DecorId,
  DessertId,
  DrinkKind,
  IngredientId,
  ProteinId,
  SideId,
  StockId,
  UpgradeId,
  VenueId,
} from '../config'
import type { UnlockEntry } from './unlocks'
import type { DecorLevels, Perks, UpgradeLevels } from './upgrades'

export type { CupSize, CustomerTypeId, DecorId, DessertId, DrinkKind, ProteinId, SideId, StockId, CookableId, UpgradeId, VenueId }

/** Quantidade de cada item do estoque. */
export type Stock = Record<StockId, number>
/** Dias parado de cada item fresco. */
export type StockAges = Partial<Record<StockId, number>>
/** Preços de venda: `recipe:<id>`, `side:<id>`, `drink:<tipo>:<tamanho>`, `dessert:<id>`. */
export type Prices = Record<string, number>

export interface DrinkOrder {
  kind: DrinkKind
  size: CupSize
}

/** O que o cliente pediu: lanches e, opcionalmente, acompanhamentos, bebidas e sobremesas. */
export interface OrderItems {
  burgers: string[]
  sides: SideId[]
  drinks: DrinkOrder[]
  desserts: DessertId[]
}

/** Expressão do cliente: ao sair é feliz, neutro ou bravo; esperando, neutro ou impaciente. */
export type Mood = 'neutral' | 'happy' | 'impatient' | 'angry'

/** Partes do visual do cliente (índices nas tabelas de /src/art/customers/parts.ts). */
export interface CustomerLook {
  skin: number
  hairStyle: number
  hairColor: number
  outfit: number
  outfitColor: number
  accessory: number
}

export interface Customer {
  id: number
  slot: number
  type: CustomerTypeId
  order: OrderItems
  /** Preço do pedido em relação ao preço padrão (1 = padrão); afeta paciência e gorjeta. */
  priceRatio: number
  look: CustomerLook
  /** Segunda pessoa da família (desenhada ao lado). */
  companion: CustomerLook | null
  patienceMax: number
  patience: number
  status: 'waiting' | 'leaving'
  /** Reação ao sair (feliz, neutro ou bravo); esperando fica neutro (use `customerMood`). */
  mood: Mood
  /** Segundos restantes até liberar a vaga, quando `status === 'leaving'`. */
  leaveTimer: number
  /** Indeciso: muda de ideia quando a paciência restante cai abaixo deste valor (0–1); null = não muda. */
  mindChangeAt: number | null
  changedMind: boolean
}

/** Ponto da carne que vai para o lanche (queimada vai direto para o lixo). */
export type PattyQuality = 'raw' | 'perfect' | 'overdone'
export type PattyStage = PattyQuality | 'burnt'

/** Proteína na chapa: segundos de cada lado em contato com a chapa. */
export interface GrillPatty {
  kind: ProteinId
  sides: [number, number]
  /** Lado que está na chapa agora. */
  down: 0 | 1
  flips: number
}

/** Proteína pronta no prato, esperando entrar no lanche. */
export interface HeldProtein {
  id: ProteinId
  quality: PattyQuality
}

export type CookStage = 'cooking' | 'ready' | 'burnt'
/** Item na fritadeira ou no forno. */
export interface CookerItem {
  kind: CookableId
  cook: number
}
/** Item pronto guardado na estufa ou na vitrine. */
export interface StoredItem {
  kind: CookableId
  age: number
}
export type StoredQuality = 'fresh' | 'stale'
export type Station = 'fryer' | 'oven'

export interface Cup {
  kind: DrinkKind
  size: CupSize
  /** Quanto já foi servido, em ml. */
  fill: number
}
export type DrinkQuality = 'good' | 'low' | 'spilled'

export interface TrayBurger {
  ingredients: IngredientId[]
  /** Ponto de cada proteína, na ordem em que aparecem no lanche. */
  patties: PattyQuality[]
}
export interface TraySide {
  id: SideId
  quality: StoredQuality
}
export interface TrayDrink {
  kind: DrinkKind
  size: CupSize
  quality: DrinkQuality
}
export interface TrayDessert {
  id: DessertId
}
export interface Tray {
  burgers: TrayBurger[]
  sides: TraySide[]
  drinks: TrayDrink[]
  desserts: TrayDessert[]
}
export type TrayCategory = keyof Tray

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
  /** Influenciadores bem atendidos (aumentam o movimento do dia seguinte). */
  influencerHappy: number
}

/** Lanche guardado no segundo prato da bancada (só com a melhoria "Segundo prato"). */
export interface SpareBurger {
  ingredients: IngredientId[]
  patties: PattyQuality[]
}

/** Estado de um turno em andamento (não vai para o save). */
export interface SessionState {
  /** Nível do jogador (libera ingredientes, receitas e vagas); sobe durante o dia. */
  level: number
  /** Efeitos das melhorias, da decoração e da fase da hamburgueria, fixados na abertura do dia. */
  perks: Perks
  /** Estoque do dia: começa igual ao do jogador e é gasto durante o turno. */
  stock: Stock
  /** Movimento do dia (a "previsão"), que multiplica a chegada de clientes. */
  dayMultiplier: number
  slots: (Customer | null)[]
  /** Lanche sendo montado e o ponto de cada proteína nele. */
  burger: IngredientId[]
  burgerPatties: PattyQuality[]
  /** Segundo prato da bancada (null = vazio ou sem a melhoria). */
  spareBurger: SpareBurger | null
  tray: Tray
  grill: (GrillPatty | null)[]
  /** Proteínas prontas esperando no prato. */
  held: HeldProtein[]
  fryer: (CookerItem | null)[]
  warmer: StoredItem[]
  oven: (CookerItem | null)[]
  shelf: StoredItem[]
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
  /** Peso na reputação (o crítico pesa mais); padrão 1. */
  weight?: number
  type?: CustomerTypeId
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
  /** Multiplicador de movimento deste dia por causa de influenciadores bem atendidos ontem (1 = nenhum). */
  dayBoost: number
  /** Nível comprado de cada melhoria de equipamento. */
  upgrades: UpgradeLevels
  /** Visual comprado de cada decoração (0 = nenhum). */
  decor: DecorLevels
  /** Fase da hamburgueria. */
  venue: VenueId
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
  | 'sideMissing'
  | 'sideWrong'
  | 'sideStale'
  | 'drinkMissing'
  | 'drinkWrongKind'
  | 'drinkWrongSize'
  | 'drinkLow'
  | 'drinkSpilled'
  | 'dessertMissing'
  | 'dessertWrong'
  | 'fast'
  | 'slow'

export type GameEvent =
  | { type: 'customerArrived'; slot: number; customerId: number }
  | { type: 'customerChangedMind'; slot: number; customerId: number }
  | { type: 'ingredientAdded'; ingredient: IngredientId }
  | { type: 'burgerDiscarded' }
  | { type: 'trayPlaced'; category: TrayCategory }
  | { type: 'trayDiscarded'; category: TrayCategory }
  | { type: 'pattyPlaced'; slot: number }
  | { type: 'pattyFlipped'; slot: number }
  | { type: 'pattyBurnt'; slot: number }
  | { type: 'pattyAlarm'; slot: number }
  | { type: 'benchSwapped' }
  | { type: 'pattyTaken'; slot: number; quality: PattyQuality }
  | { type: 'pattyTrashed'; slot: number }
  | { type: 'cookPlaced'; station: Station; index: number }
  | { type: 'cookReady'; station: Station; index: number }
  | { type: 'cookBurnt'; station: Station; index: number }
  | { type: 'cookTaken'; station: Station; index: number }
  | { type: 'cookTrashed'; station: Station; index: number }
  | { type: 'cupSpilled' }
  | {
      type: 'customerServed'
      slot: number
      customerId: number
      customerType: CustomerTypeId
      /** Nota do atendimento (1–5). */
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
  | { type: 'leveledUp'; from: number; level: number; unlocks: UnlockEntry[] }
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
