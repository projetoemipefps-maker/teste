export const ECONOMY = {
  /** Fração do preço paga por um item errado (lanche de outra receita, copo de outro tamanho). */
  wrongPayFraction: 0.3,
  /** Gorjeta como fração do preço dos itens, por nota (índice 0 = 1 estrela). */
  tipFractionByStars: [0, 0, 0.1, 0.25, 0.4],
  /** A gorjeta vai de `tipSpeedFloor` a 100% conforme a paciência que sobrou. */
  tipSpeedFloor: 0.4,
  /** Bônus de gorjeta (fração do preço do lanche) quando todas as carnes estão no ponto. */
  perfectPattyBonusFraction: 0.15,
  startingMoney: 300,
  /** Custos fixos descontados no fim de cada dia. */
  fixedCosts: [
    { id: 'rent', name: 'Aluguel', amount: 120 },
    { id: 'power', name: 'Luz', amount: 40 },
    { id: 'gas', name: 'Gás', amount: 30 },
  ],
  /** Dias seguidos com o caixa negativo até a falência. */
  bankruptcyDays: 3,
} as const

export const LOAN = {
  /** Valor emprestado (R$); só dá para pedir uma vez, e só com o caixa negativo. */
  amount: 500,
  /** Juros totais sobre o valor. */
  interestRate: 0.2,
  /** Em quantas parcelas diárias (descontadas junto dos custos fixos) o empréstimo é pago. */
  installments: 6,
} as const

export const PRICING = {
  /** Limites do preço de venda em relação ao preço padrão do item. */
  minFactor: 0.6,
  maxFactor: 1.6,
  /** Quanto o preço médio do cardápio (relativo ao padrão) altera o movimento: 1 - (razão - 1) × este valor. */
  demandElasticity: 0.9,
  demandMin: 0.5,
  demandMax: 1.4,
  /** Quanto o preço do pedido altera a paciência do cliente. */
  patienceElasticity: 0.25,
  patienceMin: 0.75,
  patienceMax: 1.15,
  /** Quanto o preço do pedido altera a gorjeta. */
  tipElasticity: 0.9,
  tipMin: 0.2,
  tipMax: 1.4,
  /** Razões de preço que viram "barato" e "caro" nas avaliações e no cardápio. */
  cheapRatio: 0.9,
  priceyRatio: 1.15,
} as const
