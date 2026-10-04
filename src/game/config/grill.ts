export interface GrillTimes {
  /** Segundos que cada LADO precisa na chapa para ficar no ponto, passar e queimar. */
  done: number
  overdone: number
  burnt: number
}

export const GRILL = {
  /** Tempos por tipo de proteína: o frango leva mais tempo e o hambúrguer vegetal, menos. */
  kinds: {
    patty: { done: 7, overdone: 11, burnt: 15 },
    chicken: { done: 9, overdone: 14, burnt: 18 },
    veggie: { done: 5, overdone: 8, burnt: 11 },
  } satisfies Record<'patty' | 'chicken' | 'veggie', GrillTimes>,
  /** Carnes prontas que cabem no prato ao lado da chapa. */
  heldCapacity: 4,
  /** O aviso "vire!" aparece quando o lado de baixo passa desta fração do ponto. */
  flipHintRatio: 0.85,
} as const
