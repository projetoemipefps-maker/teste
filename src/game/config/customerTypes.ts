export const CUSTOMER_TYPE_IDS = ['normal', 'hurried', 'kid', 'family', 'indecisive', 'influencer', 'critic'] as const
export type CustomerTypeId = (typeof CUSTOMER_TYPE_IDS)[number]

export interface CustomerTypeConfig {
  id: CustomerTypeId
  name: string
  /** Nome curto para a etiqueta do balão do pedido. */
  tag: string
  description: string
  unlockLevel: number
  /** Chance relativa de aparecer (entre os tipos já liberados). */
  weight: number
  /** Multiplica a paciência. */
  patienceFactor: number
  /** Multiplica a gorjeta. */
  tipFactor: number
  /** Multiplica o valor pago pelos itens (cliente que "paga bem"). */
  payFactor: number
  /** Multiplica o XP do atendimento. */
  xpFactor: number
  /** Peso da avaliação na reputação (o crítico pesa muito). */
  reviewWeight: number
  /** Pedidos grandes (família): quantidade de lanches. */
  burgers: { min: number; max: number }
  /** Só pede receitas simples (criança). */
  simpleOnly?: boolean
  /** Exige perfeição: só dá nota alta e gorjeta se o atendimento for de 5 estrelas. */
  strict?: boolean
  /** Muda de ideia no meio do pedido. */
  changesMind?: boolean
  /** Se bem atendido, aumenta o movimento do dia seguinte. */
  boostsDemand?: boolean
}

export const CUSTOMER_TYPES: Record<CustomerTypeId, CustomerTypeConfig> = {
  normal: {
    id: 'normal', name: 'Cliente', tag: 'Cliente', description: 'Um cliente comum.',
    unlockLevel: 1, weight: 10, patienceFactor: 1, tipFactor: 1, payFactor: 1, xpFactor: 1, reviewWeight: 1,
    burgers: { min: 1, max: 1 },
  },
  hurried: {
    id: 'hurried', name: 'Apressado', tag: 'Apressado', description: 'Pouca paciência, mas dá gorjeta alta.',
    unlockLevel: 3, weight: 4, patienceFactor: 0.55, tipFactor: 1.9, payFactor: 1, xpFactor: 1.3, reviewWeight: 1,
    burgers: { min: 1, max: 1 },
  },
  kid: {
    id: 'kid', name: 'Criança', tag: 'Criança', description: 'Pedidos simples.',
    unlockLevel: 5, weight: 3, patienceFactor: 1.15, tipFactor: 0.5, payFactor: 1, xpFactor: 1, reviewWeight: 1,
    burgers: { min: 1, max: 1 }, simpleOnly: true,
  },
  family: {
    id: 'family', name: 'Família', tag: 'Família', description: 'Pedido grande, com vários lanches.',
    unlockLevel: 8, weight: 2.5, patienceFactor: 1.4, tipFactor: 1.2, payFactor: 1, xpFactor: 1, reviewWeight: 1,
    burgers: { min: 2, max: 4 },
  },
  indecisive: {
    id: 'indecisive', name: 'Indeciso', tag: 'Indeciso', description: 'Muda de ideia no meio do pedido.',
    unlockLevel: 11, weight: 2.5, patienceFactor: 1.15, tipFactor: 1, payFactor: 1, xpFactor: 1.2, reviewWeight: 1,
    burgers: { min: 1, max: 1 }, changesMind: true,
  },
  influencer: {
    id: 'influencer', name: 'Influenciador', tag: 'Influenciador', description: 'Paga bem e, se gostar, traz mais gente amanhã.',
    unlockLevel: 14, weight: 1.5, patienceFactor: 0.9, tipFactor: 1.5, payFactor: 1.35, xpFactor: 1.2, reviewWeight: 2,
    burgers: { min: 1, max: 1 }, boostsDemand: true,
  },
  critic: {
    id: 'critic', name: 'Crítico gastronômico', tag: 'Crítico', description: 'Raro. Exige perfeição e, se gostar, dá muita reputação.',
    unlockLevel: 18, weight: 0.8, patienceFactor: 1, tipFactor: 2.5, payFactor: 1, xpFactor: 1.5, reviewWeight: 4,
    burgers: { min: 1, max: 1 }, strict: true,
  },
}

export const CUSTOMER_RULES = {
  /** O indeciso muda de ideia quando a paciência restante cai abaixo de um valor sorteado nesta faixa. */
  changeMindRatio: { min: 0.5, max: 0.75 },
  /** Paciência extra (s) que o indeciso ganha ao mudar de ideia. */
  changeMindPatienceBonus: 8,
  /** O crítico só dá nota alta se for perfeito; abaixo disso, a avaliação perde esta quantidade de estrelas. */
  criticStarPenalty: 2,
  /** Cada influenciador bem atendido soma isto ao movimento do dia seguinte (até o teto). */
  influencerBoost: { perCustomer: 0.12, max: 0.36 },
} as const
