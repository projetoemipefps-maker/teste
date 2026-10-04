import { describe, expect, it } from 'vitest'
import {
  COOKABLES,
  CUSTOMER_TYPES,
  DESSERTS,
  DRINK_CONFIG,
  GRILL,
  INGREDIENTS,
  INGREDIENT_IDS,
  PROGRESSION,
  RECIPES,
  STOCK_IDS,
  STOCK_ITEMS,
  MAX_UNLOCKS_PER_LEVEL,
} from '../config'
import {
  allUnlocks,
  fryerBasketCount,
  grillSlotCount,
  ovenSlotCount,
  unlockedCustomerTypes,
  unlockedDrinkKinds,
  unlockedRecipes,
  unlockedSides,
  unlocksAtLevel,
  unlocksBetween,
} from './unlocks'
import { addXp, totalXpForLevel, xpForServe, xpToNext } from './xp'

const names = (level: number) => unlocksAtLevel(level).map((u) => u.name)
const everyName = () => allUnlocks().map((u) => u.name)

describe('desbloqueios por nível', () => {
  it('libera todos os ingredientes pedidos', () => {
    const wanted = [
      'Cheddar', 'Bacon', 'Cebola', 'Picles', 'Cebola caramelizada', 'Ovo', 'Cheddar cremoso', 'Maionese verde',
      'Barbecue', 'Pão brioche', 'Pão australiano', 'Carne dupla', 'Frango empanado', 'Hambúrguer vegetal',
    ]
    for (const n of wanted) expect(everyName(), n).toContain(n)
  })

  it('libera os acompanhamentos, bebidas e sobremesas pedidos', () => {
    const wanted = [
      'Batata rústica', 'Batata com cheddar e bacon', 'Nuggets', 'Anéis de cebola',
      'Suco natural', 'Milkshake de chocolate', 'Milkshake de morango', 'Milkshake de baunilha', 'Brownie', 'Sorvete',
    ]
    for (const n of wanted) expect(everyName(), n).toContain(n)
  })

  it('libera as receitas, inclusive a assinatura de nível alto', () => {
    for (const r of ['X-Bacon', 'Smash Duplo', 'Cheddar Melt', 'Brasa Supreme']) expect(everyName()).toContain(r)
    const supreme = RECIPES.find((r) => r.signature)!
    expect(supreme.name).toBe('Brasa Supreme')
    expect(supreme.unlockLevel).toBeGreaterThanOrEqual(30)
    expect(supreme.basePrice).toBe(Math.max(...RECIPES.map((r) => r.basePrice)))
  })

  it('libera os 6 tipos de cliente além do normal', () => {
    const types = allUnlocks().filter((u) => u.kind === 'customer').map((u) => u.id)
    expect(types.sort()).toEqual(['critic', 'family', 'hurried', 'indecisive', 'influencer', 'kid'])
  })

  it('há novidade em quase todo nível do começo e nenhum nível concentra tudo (distribuição equilibrada)', () => {
    for (let level = 2; level <= 21; level++) expect(unlocksAtLevel(level).length, `nível ${level}`).toBeGreaterThanOrEqual(1)
    for (let level = 1; level <= PROGRESSION.maxLevel; level++) expect(unlocksAtLevel(level).length, `nível ${level}`).toBeLessThanOrEqual(MAX_UNLOCKS_PER_LEVEL)
    const levels = new Set(allUnlocks().map((u) => u.level))
    expect(levels.size).toBeGreaterThanOrEqual(20)
    const last = Math.max(...allUnlocks().map((u) => u.level))
    expect(last).toBeLessThanOrEqual(PROGRESSION.maxLevel)
  })

  it('o jogo começa jogável: itens do nível 1 existem e não aparecem como liberação', () => {
    expect(allUnlocks().every((u) => u.level > 1)).toBe(true)
    expect(unlockedRecipes(1).length).toBeGreaterThanOrEqual(4)
    expect(unlockedSides(1)).toEqual(['fries'])
    expect(unlockedDrinkKinds(1)).toEqual(['soda'])
    expect(unlockedCustomerTypes(1).map((c) => c.id)).toEqual(['normal'])
    expect(grillSlotCount(1)).toBe(2)
    expect(fryerBasketCount(1)).toBe(2)
    expect(ovenSlotCount(1)).toBe(0)
  })

  it('o que é liberado só aparece nas listas a partir do nível certo', () => {
    expect(unlockedSides(7)).toContain('rustic')
    expect(unlockedSides(6)).not.toContain('rustic')
    expect(unlockedDrinkKinds(5)).toContain('juice')
    expect(unlockedDrinkKinds(4)).not.toContain('juice')
    expect(unlockedCustomerTypes(18).map((c) => c.id)).toContain('critic')
    expect(unlockedCustomerTypes(17).map((c) => c.id)).not.toContain('critic')
  })

  it('unlocksBetween junta o que foi liberado entre dois níveis (exclusivo, inclusivo)', () => {
    const range = unlocksBetween(1, 4).map((u) => u.id)
    for (const id of ['cheddar', 'onion', 'bacon', 'hurried', 'x-bacon']) expect(range, id).toContain(id)
    expect(unlocksBetween(4, 4)).toEqual([])
    expect(unlocksBetween(1, 50).length).toBe(allUnlocks().length)
  })

  it('o nível 2 libera o cheddar já na primeira subida', () => {
    expect(names(2)).toContain('Cheddar')
  })

  it('espaços extras na chapa e na fritadeira entram com o nível', () => {
    expect(names(12).some((n) => n.includes('chapa'))).toBe(true)
    expect(names(28).some((n) => n.includes('chapa'))).toBe(true)
    expect(names(16).some((n) => n.includes('fritadeira'))).toBe(true)
    expect(GRILL.slotLevels.length).toBe(4)
  })

  it('cada receita só usa ingredientes já liberados no nível dela e cabe nos catálogos', () => {
    for (const r of RECIPES) {
      for (const id of r.ingredients) {
        expect(INGREDIENT_IDS).toContain(id)
        expect(INGREDIENTS[id].unlockLevel, `${r.name}: ${id}`).toBeLessThanOrEqual(r.unlockLevel)
      }
    }
  })

  it('o estoque de cada item é liberado junto com o ingrediente, acompanhamento ou bebida que o usa', () => {
    for (const ing of Object.values(INGREDIENTS)) {
      if (ing.stock) expect(STOCK_ITEMS[ing.stock].unlockLevel, ing.id).toBeLessThanOrEqual(ing.unlockLevel)
    }
    for (const c of Object.values(COOKABLES)) {
      for (const id of Object.keys(c.stock) as (keyof typeof STOCK_ITEMS)[]) expect(STOCK_ITEMS[id].unlockLevel, c.name).toBeLessThanOrEqual(c.unlockLevel)
    }
    for (const d of Object.values(DRINK_CONFIG)) expect(STOCK_ITEMS[d.stock].unlockLevel).toBeLessThanOrEqual(d.unlockLevel)
    for (const d of Object.values(DESSERTS)) for (const id of Object.keys(d.stock) as (keyof typeof STOCK_ITEMS)[]) expect(STOCK_ITEMS[id].unlockLevel).toBeLessThanOrEqual(d.unlockLevel)
    expect(STOCK_IDS.length).toBe(Object.keys(STOCK_ITEMS).length)
  })

  it('os tipos de cliente raros e especiais vêm mais tarde', () => {
    expect(CUSTOMER_TYPES.critic.unlockLevel).toBeGreaterThan(CUSTOMER_TYPES.influencer.unlockLevel)
    expect(CUSTOMER_TYPES.critic.weight).toBeLessThan(CUSTOMER_TYPES.normal.weight / 5)
  })
})

describe('curva de XP', () => {
  it('vai do nível 1 ao 50', () => {
    expect(PROGRESSION.maxLevel).toBe(50)
    expect(addXp(1, 0, 10 ** 9).level).toBe(50)
  })

  it('o XP necessário nunca diminui e cresce ao longo da curva', () => {
    for (let l = 1; l < PROGRESSION.maxLevel; l++) expect(xpToNext(l + 1), `nível ${l}`).toBeGreaterThan(xpToNext(l))
    expect(xpToNext(40)).toBeGreaterThan(xpToNext(10) * 3)
  })

  it('o começo é rápido: o primeiro nível sai com um único pedido perfeito', () => {
    expect(xpToNext(1)).toBeLessThanOrEqual(xpForServe(5, 0))
    // os 5 primeiros níveis custam poucos pedidos bons
    const earlyTotal = totalXpForLevel(6)
    expect(earlyTotal / xpForServe(5, 2)).toBeLessThan(15)
  })

  it('o nível 50 exige um volume grande (meta de longo prazo)', () => {
    expect(totalXpForLevel(50)).toBeGreaterThan(40_000)
    expect(totalXpForLevel(50)).toBeLessThan(200_000)
  })

  it('a curva é configurável: a tabela inicial manda nos primeiros níveis e a fórmula, nos demais', () => {
    expect(xpToNext(1)).toBe(PROGRESSION.earlyXp[0])
    expect(xpToNext(PROGRESSION.earlyXp.length + 1)).toBe(
      Math.round(PROGRESSION.xpBase * Math.pow(PROGRESSION.earlyXp.length + 1, PROGRESSION.xpExponent)),
    )
  })

  it('nota alta, combos e tipos de cliente dão mais XP', () => {
    expect(xpForServe(5, 0)).toBeGreaterThan(xpForServe(1, 0))
    expect(xpForServe(3, 2)).toBe(xpForServe(3, 0) + 2 * PROGRESSION.xpPerExtraItem)
    expect(xpForServe(5, 0, 1.5)).toBeGreaterThan(xpForServe(5, 0))
    expect(xpForServe(9, 0)).toBe(xpForServe(5, 0))
  })
})
