export const VENUE_IDS = ['stall', 'snackbar', 'craft', 'chain'] as const
export type VenueId = (typeof VENUE_IDS)[number]

export interface VenueConfig {
  id: VenueId
  /** Posição na ordem das fases (1 = barraquinha). */
  order: number
  name: string
  description: string
  /** Nível do jogador necessário para comprar a expansão que leva a esta fase. */
  minLevel: number
  /** Preço da expansão (R$); a barraquinha já vem de graça. */
  cost: number
  /** Multiplica a chegada de clientes. */
  demandFactor: number
  /** Multiplica os custos fixos do dia (aluguel, luz, gás). */
  fixedCostFactor: number
  /** O que a fase traz de novo, para o card da expansão. */
  perks: readonly string[]
}

export const VENUES: Record<VenueId, VenueConfig> = {
  stall: {
    id: 'stall',
    order: 1,
    name: 'Barraquinha de rua',
    description: 'Um toldo, uma chapa e muita vontade de vender.',
    minLevel: 1,
    cost: 0,
    demandFactor: 1,
    fixedCostFactor: 1,
    perks: [],
  },
  snackbar: {
    id: 'snackbar',
    order: 2,
    name: 'Lanchonete de bairro',
    description: 'Casinha com balcão, mesinhas e freguesia fiel.',
    minLevel: 8,
    cost: 2500,
    demandFactor: 1.1,
    fixedCostFactor: 1.5,
    perks: ['+10% de clientes', 'Melhorias e decorações intermediárias', 'Aluguel e contas mais caros'],
  },
  craft: {
    id: 'craft',
    order: 3,
    name: 'Hamburgueria artesanal',
    description: 'Tijolinho, luz quente e hambúrguer de respeito.',
    minLevel: 20,
    cost: 9000,
    demandFactor: 1.2,
    fixedCostFactor: 2.2,
    perks: ['+20% de clientes', 'Melhorias e decorações avançadas', 'Aluguel e contas bem mais caros'],
  },
  chain: {
    id: 'chain',
    order: 4,
    name: 'Rede famosa',
    description: 'Fila na porta, letreiro gigante e a cidade toda de olho.',
    minLevel: 35,
    cost: 28000,
    demandFactor: 1.3,
    fixedCostFactor: 3.2,
    perks: ['+30% de clientes', 'Todas as melhorias e decorações', 'Contas de gente grande'],
  },
}

export const FIRST_VENUE: VenueId = 'stall'

/** Duração da animação de reforma na tela (ms). */
export const RENOVATION_MS = 4200
