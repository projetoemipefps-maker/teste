import { describe, expect, it } from 'vitest'
import { CUSTOMERS, LOOK_PARTS } from '../config'
import { LOOKS_COUNTS } from '../../art/customers/parts'
import { rollCustomer } from './customers'
import { SPECIAL_PARTS, applyTypeLook, lookSignature, rollLook, rollLookParts, usedLookSignatures } from './looks'
import { defaultPrices } from './pricing'
import type { Customer } from './types'

const ctx = { prices: defaultPrices(), reputation: 3 }
const make = (seed: number, level: number, others: Customer[] = []) => rollCustomer(seed, level, seed, 0, others, ctx)[0]

describe('visual dos clientes', () => {
  it('as tabelas de partes da arte batem com as quantidades da config', () => {
    expect(LOOKS_COUNTS).toEqual(LOOK_PARTS)
  })

  it('cada parte sorteada fica dentro da tabela', () => {
    let s = 1
    for (let i = 0; i < 300; i++) {
      const [look, next] = rollLookParts(s)
      s = next
      expect(look.skin).toBeLessThan(LOOK_PARTS.skin)
      expect(look.hairStyle).toBeLessThan(LOOK_PARTS.hairStyle)
      expect(look.hairColor).toBeLessThan(LOOK_PARTS.hairColor)
      expect(look.outfit).toBeLessThan(LOOK_PARTS.outfit)
      expect(look.outfitColor).toBeLessThan(LOOK_PARTS.outfitColor)
      expect(look.accessory).toBeLessThan(LOOK_PARTS.accessory)
      for (const v of Object.values(look)) expect(v).toBeGreaterThanOrEqual(0)
    }
  })

  it('há muita variedade: centenas de combinações diferentes', () => {
    const seen = new Set<string>()
    let s = 7
    for (let i = 0; i < 500; i++) {
      const [look, next] = rollLookParts(s)
      s = next
      seen.add(lookSignature(look))
    }
    expect(seen.size).toBeGreaterThan(400)
  })

  it('clientes no balcão nunca ficam com o mesmo visual', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const others: Customer[] = []
      for (let slot = 0; slot < CUSTOMERS.maxSlots; slot++) {
        const c = rollCustomer(seed * 10 + slot, 20, slot + 1, slot, others, ctx)[0]
        others.push(c)
      }
      const signatures = others.flatMap((c) => [lookSignature(c.look), ...(c.companion ? [lookSignature(c.companion)] : [])])
      expect(new Set(signatures).size).toBe(signatures.length)
    }
  })

  it('o novo cliente evita os visuais já usados', () => {
    const [taken] = rollLookParts(5)
    const used = new Set([lookSignature(taken)])
    let s = 5
    for (let i = 0; i < 100; i++) {
      const [look, next] = rollLook(s, 'normal', used)
      s = next
      expect(used.has(lookSignature(look))).toBe(false)
    }
    expect(usedLookSignatures([])).toEqual(new Set())
  })

  it('o crítico usa terno e óculos; o influenciador, óculos escuros', () => {
    const [base] = rollLookParts(3)
    expect(applyTypeLook(base, 'critic')).toMatchObject({ outfit: SPECIAL_PARTS.suitOutfit, accessory: SPECIAL_PARTS.glassesAccessory })
    expect(applyTypeLook(base, 'influencer').accessory).toBe(SPECIAL_PARTS.sunglassesAccessory)
    expect(applyTypeLook(base, 'normal')).toEqual(base)
  })

  it('os clientes sorteados são determinísticos pela seed', () => {
    expect(make(9, 25)).toEqual(make(9, 25))
  })
})
