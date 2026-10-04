export const GRILL = {
  slots: 2,
  /** Segundos que cada LADO precisa na chapa para ficar no ponto, passar e queimar. */
  sideDoneSeconds: 7,
  sideOverdoneSeconds: 11,
  sideBurntSeconds: 15,
  /** Carnes prontas que cabem no prato ao lado da chapa. */
  heldCapacity: 4,
  /** O aviso "vire!" aparece quando o lado de baixo passa desta fração do ponto. */
  flipHintRatio: 0.85,
} as const
