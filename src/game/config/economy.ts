export const ECONOMY = {
  /** Preço de venda do lanche = soma dos custos dos ingredientes × este fator (arredondado). */
  priceMarkup: 1.6,
  /** Fração do preço paga por um item errado (lanche de outra receita, copo de outro tamanho). */
  wrongPayFraction: 0.3,
  friesPrice: 6,
  /** Gorjeta como fração do preço dos itens, por nota (índice 0 = 1 estrela). */
  tipFractionByStars: [0, 0, 0.1, 0.25, 0.4],
  /** A gorjeta vai de `tipSpeedFloor` a 100% conforme a paciência que sobrou. */
  tipSpeedFloor: 0.4,
  /** Bônus de gorjeta (fração do preço do lanche) quando todas as carnes estão no ponto. */
  perfectPattyBonusFraction: 0.15,
  startingMoney: 0,
} as const
