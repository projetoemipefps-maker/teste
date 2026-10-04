import { CUSTOMERS, LOOK_PARTS, type CustomerTypeId } from '../config'
import { randomInt } from './rng'
import type { Customer, CustomerLook } from './types'

/** Identifica um visual para evitar clientes iguais no balcão. */
export const lookSignature = (l: CustomerLook): string => `${l.skin}-${l.hairStyle}-${l.hairColor}-${l.outfit}-${l.outfitColor}`

/** Sorteia cada parte do visual. */
export function rollLookParts(rngState: number): [CustomerLook, number] {
  let s = rngState
  const pick = (n: number) => {
    const [v, next] = randomInt(s, 0, n - 1)
    s = next
    return v
  }
  const look: CustomerLook = {
    skin: pick(LOOK_PARTS.skin),
    hairStyle: pick(LOOK_PARTS.hairStyle),
    hairColor: pick(LOOK_PARTS.hairColor),
    outfit: pick(LOOK_PARTS.outfit),
    outfitColor: pick(LOOK_PARTS.outfitColor),
    accessory: pick(LOOK_PARTS.accessory),
  }
  return [look, s]
}

/** Visuais já usados por quem está no balcão (cliente e acompanhante). */
export function usedLookSignatures(customers: readonly Customer[]): Set<string> {
  return new Set(customers.flatMap((c) => [lookSignature(c.look), ...(c.companion ? [lookSignature(c.companion)] : [])]))
}

/**
 * Visual do cliente: partes sorteadas, diferentes dos já usados (se possível).
 * Alguns tipos têm marcas próprias: o crítico usa óculos e terno; o influenciador, óculos escuros.
 */
export function rollLook(rngState: number, type: CustomerTypeId, used: ReadonlySet<string>): [CustomerLook, number] {
  let state = rngState
  let look!: CustomerLook
  for (let i = 0; i < CUSTOMERS.lookRetries; i++) {
    ;[look, state] = rollLookParts(state)
    if (!used.has(lookSignature(look))) break
  }
  return [applyTypeLook(look, type), state]
}

/** Índices das partes especiais (ver parts.ts): terno, óculos, óculos escuros. */
export const SPECIAL_PARTS = { suitOutfit: 7, glassesAccessory: 1, sunglassesAccessory: 2 } as const

export function applyTypeLook(look: CustomerLook, type: CustomerTypeId): CustomerLook {
  if (type === 'critic') return { ...look, outfit: SPECIAL_PARTS.suitOutfit, accessory: SPECIAL_PARTS.glassesAccessory }
  if (type === 'influencer') return { ...look, accessory: SPECIAL_PARTS.sunglassesAccessory }
  return look
}
