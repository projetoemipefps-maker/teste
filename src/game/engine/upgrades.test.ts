import { describe, expect, it } from 'vitest'
import {
  BONUS_LABEL,
  DECOR,
  DECOR_IDS,
  EQUIPMENT,
  EQUIPMENT_IDS,
  MAX_EQUIPMENT_TIER,
  SHOP,
  UPGRADES,
  UPGRADE_IDS,
  VENUES,
  VENUE_IDS,
} from '../config'
import { createPlayer } from './player'
import { testPlayer } from './testing'
import {
  affordableCount,
  basePerks,
  buyDecor,
  buyUpgrade,
  computePerks,
  currentEffect,
  decorOffer,
  decorTotals,
  effectiveReputation,
  emptyDecor,
  emptyUpgrades,
  equipmentProgress,
  equipmentTier,
  expandVenue,
  shopUnlocked,
  upgradeMax,
  upgradeOffer,
  upgradeValue,
  venueOffer,
} from './upgrades'
import type { PlayerState } from './types'

/** Jogador rico e de nível alto, para testar as compras sem esbarrar em requisitos. */
const rich = (overrides: Partial<PlayerState> = {}): PlayerState => testPlayer({ money: 1e7, level: 50, venue: 'chain', ...overrides })

describe('catálogo da loja', () => {
  it('cada melhoria tem preço, nível e fase crescentes e efeito que só melhora', () => {
    for (const id of UPGRADE_IDS) {
      const { levels, base } = UPGRADES[id]
      expect(levels.length, id).toBeGreaterThanOrEqual(1)
      levels.forEach((l, i) => {
        if (i === 0) return
        const prev = levels[i - 1]!
        expect(l.cost, `${id} preço`).toBeGreaterThan(prev.cost)
        expect(l.minLevel, `${id} nível`).toBeGreaterThanOrEqual(prev.minLevel)
        expect(l.minVenue, `${id} fase`).toBeGreaterThanOrEqual(prev.minVenue)
        expect(l.value, `${id} valor`).toBeGreaterThan(prev.value)
      })
      expect(levels[0]!.value, id).toBeGreaterThan(base)
      expect(levels[0]!.minLevel, `${id}: só depois da loja abrir`).toBeGreaterThanOrEqual(SHOP.unlockLevel)
    }
  })

  it('todo equipamento pedido tem melhorias, e toda melhoria pertence a um equipamento', () => {
    expect([...EQUIPMENT_IDS]).toEqual(['grill', 'fryer', 'drinks', 'bench', 'counter', 'fridge', 'register'])
    const listed = EQUIPMENT_IDS.flatMap((e) => EQUIPMENT[e].upgrades)
    expect([...listed].sort()).toEqual([...UPGRADE_IDS].sort())
    for (const id of UPGRADE_IDS) expect(EQUIPMENT[UPGRADES[id].equipment].upgrades).toContain(id)
  })

  it('os limites pedidos: chapa de 2 a 6 espaços, balcão de 3 a 6 clientes, bancada com 2 pratos', () => {
    expect(UPGRADES.grillSlots.base).toBe(2)
    expect(upgradeValue('grillSlots', upgradeMax('grillSlots'))).toBe(6)
    expect(UPGRADES.counterSeats.base).toBe(3)
    expect(upgradeValue('counterSeats', upgradeMax('counterSeats'))).toBe(6)
    expect(upgradeValue('benchDouble', 1)).toBe(2)
    expect(upgradeMax('benchDouble')).toBe(1)
  })

  it('o texto do efeito diz claramente o que muda', () => {
    expect(UPGRADES.grillSpeed.effect(0.15)).toBe('Cozimento 15% mais rápido')
    expect(UPGRADES.grillSlots.effect(4)).toBe('4 espaços na chapa')
    expect(UPGRADES.grillAlarm.effect(2)).toBe('Avisa 2 s antes de a carne passar do ponto')
    expect(UPGRADES.grillAlarm.effect(1.5)).toContain('1,5 s')
    expect(UPGRADES.drinkAuto.effect(-1)).toBe('Enchimento manual')
    expect(UPGRADES.drinkAuto.effect(0)).toBe('Para sozinho no ponto certo')
    expect(UPGRADES.drinkAuto.effect(0.3)).toBe('Automático e 30% mais rápido')
    expect(UPGRADES.fridgeFresh.effect(1)).toBe('Frescos duram +1 dia')
    expect(UPGRADES.fridgeFresh.effect(2)).toBe('Frescos duram +2 dias')
    for (const id of UPGRADE_IDS) {
      const texts = [UPGRADES[id].base, ...UPGRADES[id].levels.map((l) => l.value)].map((v) => UPGRADES[id].effect(v))
      expect(new Set(texts).size, `${id}: cada nível tem um texto diferente`).toBe(texts.length)
    }
  })

  it('a decoração tem os 8 itens pedidos, cada um com bônus de paciência, gorjeta ou reputação', () => {
    expect([...DECOR_IDS].sort()).toEqual(['floor', 'jukebox', 'lighting', 'neon', 'plants', 'tables', 'tv', 'wall'])
    for (const id of DECOR_IDS) {
      const { tiers, bonusKind } = DECOR[id]
      expect(Object.keys(BONUS_LABEL)).toContain(bonusKind)
      tiers.forEach((t, i) => {
        expect(t.bonus, `${id} bônus`).toBeGreaterThan(0)
        if (i > 0) {
          expect(t.cost, `${id} preço`).toBeGreaterThan(tiers[i - 1]!.cost)
          expect(t.bonus, `${id} bônus cresce`).toBeGreaterThan(tiers[i - 1]!.bonus)
        }
      })
    }
    const kinds = new Set(DECOR_IDS.map((id) => DECOR[id].bonusKind))
    expect(kinds).toEqual(new Set(['patience', 'tip', 'reputation']))
  })

  it('as 4 fases, em ordem, exigem nível e preço cada vez maiores', () => {
    expect(VENUE_IDS.map((id) => VENUES[id].name)).toEqual(['Barraquinha de rua', 'Lanchonete de bairro', 'Hamburgueria artesanal', 'Rede famosa'])
    const list = VENUE_IDS.map((id) => VENUES[id])
    list.forEach((v, i) => {
      expect(v.order).toBe(i + 1)
      if (i < 2) return
      expect(v.minLevel).toBeGreaterThan(list[i - 1]!.minLevel)
      expect(v.cost).toBeGreaterThan(list[i - 1]!.cost)
    })
    expect(VENUES.stall.cost).toBe(0)
  })
})

describe('efeitos (perks)', () => {
  it('sem compras, vale o começo do jogo', () => {
    const p = basePerks()
    expect(p).toMatchObject({
      grillSlots: 2,
      grillSpeed: 1,
      grillAlarm: 0,
      fryerBaskets: 2,
      fryerSpeed: 1,
      drinkAuto: false,
      drinkSpeed: 1,
      benches: 1,
      seats: 3,
      payBonus: 0,
      tipBonus: 0,
      patienceBonus: 0,
      reputationBonus: 0,
      spoilBonus: 0,
      demandFactor: 1,
      fixedCostFactor: 1,
      venue: 'stall',
    })
    expect(p.stockCap).toBe(300)
    expect(p.warmerSize).toBe(3)
  })

  it('cada melhoria comprada muda o efeito certo', () => {
    const at = (id: (typeof UPGRADE_IDS)[number], level: number) => computePerks({ upgrades: { ...emptyUpgrades(), [id]: level }, decor: emptyDecor(), venue: 'stall' })
    expect(at('grillSlots', 4).grillSlots).toBe(6)
    expect(at('grillSpeed', 2).grillSpeed).toBeCloseTo(1.2)
    expect(at('grillAlarm', 3).grillAlarm).toBe(3)
    expect(at('fryerBaskets', 2).fryerBaskets).toBe(4)
    expect(at('fryerSpeed', 3).fryerSpeed).toBeCloseTo(1.4)
    expect(at('warmerSize', 3).warmerSize).toBe(6)
    expect(at('drinkAuto', 1)).toMatchObject({ drinkAuto: true, drinkSpeed: 1 })
    expect(at('drinkAuto', 3)).toMatchObject({ drinkAuto: true, drinkSpeed: 1.6 })
    expect(at('benchDouble', 1).benches).toBe(2)
    expect(at('counterSeats', 3).seats).toBe(6)
    expect(at('fridgeCapacity', 4).stockCap).toBe(1000)
    expect(at('fridgeFresh', 3).spoilBonus).toBe(3)
    expect(at('registerPay', 4).payBonus).toBeCloseTo(0.16)
    expect(at('registerTips', 4).tipBonus).toBeCloseTo(0.35)
  })

  it('níveis fora da faixa são limitados', () => {
    const p = computePerks({ upgrades: { ...emptyUpgrades(), grillSlots: 99, counterSeats: -3 }, decor: emptyDecor(), venue: 'stall' })
    expect(p.grillSlots).toBe(6)
    expect(p.seats).toBe(3)
  })

  it('a decoração soma bônus por tipo, e um visual novo substitui o anterior (não soma)', () => {
    const decor = { ...emptyDecor(), floor: 1, lighting: 2, tv: 1, neon: 3, jukebox: 1, wall: 2, plants: 1 }
    const t = decorTotals(decor)
    expect(t.patience).toBeCloseTo(DECOR.floor.tiers[0]!.bonus + DECOR.lighting.tiers[1]!.bonus + DECOR.tv.tiers[0]!.bonus)
    expect(t.tip).toBeCloseTo(DECOR.neon.tiers[2]!.bonus + DECOR.jukebox.tiers[0]!.bonus)
    expect(t.reputation).toBeCloseTo(DECOR.wall.tiers[1]!.bonus + DECOR.plants.tiers[0]!.bonus)
    expect(decorTotals(emptyDecor())).toEqual({ patience: 0, tip: 0, reputation: 0 })
  })

  it('gorjeta soma o caixa e a decoração; a reputação efetiva não passa de 5 estrelas', () => {
    const p = computePerks({ upgrades: { ...emptyUpgrades(), registerTips: 1 }, decor: { ...emptyDecor(), neon: 1 }, venue: 'stall' })
    expect(p.tipBonus).toBeCloseTo(UPGRADES.registerTips.levels[0]!.value + DECOR.neon.tiers[0]!.bonus)
    expect(effectiveReputation(4.95, { reputationBonus: 0.3 })).toBe(5)
    expect(effectiveReputation(3, { reputationBonus: 0.15 })).toBeCloseTo(3.15)
  })

  it('a fase muda clientes e custos; lugares extras no balcão atraem mais gente', () => {
    const noSeats = computePerks({ upgrades: emptyUpgrades(), decor: emptyDecor(), venue: 'craft' })
    expect(noSeats.demandFactor).toBeCloseTo(VENUES.craft.demandFactor)
    expect(noSeats.fixedCostFactor).toBe(VENUES.craft.fixedCostFactor)
    const seats = computePerks({ upgrades: { ...emptyUpgrades(), counterSeats: 3 }, decor: emptyDecor(), venue: 'craft' })
    expect(seats.demandFactor).toBeGreaterThan(noSeats.demandFactor)
  })
})

describe('aparência dos equipamentos', () => {
  it('sem melhorias é simples; cada terço sobe um degrau; tudo comprado é o máximo', () => {
    const upgrades = emptyUpgrades()
    expect(equipmentTier({ upgrades }, 'grill')).toBe(0)
    expect(equipmentProgress({ upgrades }, 'grill')).toEqual({ done: 0, total: 11 })
    expect(equipmentTier({ upgrades: { ...upgrades, grillSlots: 1 } }, 'grill')).toBe(1)
    expect(equipmentTier({ upgrades: { ...upgrades, grillSlots: 4 } }, 'grill')).toBe(2)
    expect(equipmentTier({ upgrades: { ...upgrades, grillSlots: 4, grillSpeed: 4 } }, 'grill')).toBe(3)
    const all = Object.fromEntries(UPGRADE_IDS.map((id) => [id, upgradeMax(id)])) as typeof upgrades
    for (const id of EQUIPMENT_IDS) expect(equipmentTier({ upgrades: all }, id), id).toBe(MAX_EQUIPMENT_TIER)
  })

  it('a chapa simples vira a grande de inox: o degrau acompanha as melhorias da chapa', () => {
    const p = rich()
    const bought = buyUpgrade(buyUpgrade(p, 'grillSlots'), 'grillSpeed')
    expect(equipmentTier(p, 'grill')).toBe(0)
    expect(equipmentTier(bought, 'grill')).toBeGreaterThanOrEqual(1)
  })
})

describe('loja: comprar melhorias', () => {
  it('só abre no nível 3 e só entre um dia e outro', () => {
    expect(shopUnlocked(2)).toBe(false)
    expect(shopUnlocked(SHOP.unlockLevel)).toBe(true)
    expect(upgradeOffer(rich({ level: 2 }), 'grillSpeed').blocker).toBe('closed')
    expect(upgradeOffer(rich({ phase: 'open' }), 'grillSpeed').blocker).toBe('closed')
    expect(buyUpgrade(rich({ level: 2 }), 'grillSpeed').upgrades.grillSpeed).toBe(0)
    expect(buyUpgrade(rich({ phase: 'open' }), 'grillSpeed').upgrades.grillSpeed).toBe(0)
  })

  it('compra o próximo nível, desconta o preço e vai subindo o preço', () => {
    let p = rich({ money: 10_000 })
    const costs: number[] = []
    for (let i = 0; i < upgradeMax('grillSpeed'); i++) {
      const offer = upgradeOffer(p, 'grillSpeed')
      expect(offer.blocker).toBeNull()
      costs.push(offer.next!.cost)
      const before = p.money
      p = buyUpgrade(p, 'grillSpeed')
      expect(p.money).toBe(before - offer.next!.cost)
      expect(p.upgrades.grillSpeed).toBe(i + 1)
    }
    expect(costs).toEqual([...costs].sort((a, b) => a - b))
  })

  it('no último nível não compra mais nada', () => {
    let p = rich()
    for (let i = 0; i < 10; i++) p = buyUpgrade(p, 'benchDouble')
    expect(p.upgrades.benchDouble).toBe(1)
    expect(upgradeOffer(p, 'benchDouble')).toMatchObject({ blocker: 'maxed', next: null })
    expect(buyUpgrade(p, 'benchDouble')).toBe(p)
  })

  it('sem dinheiro não compra (o botão treme); sem nível ou fase, fica bloqueado com o motivo', () => {
    const poor = rich({ money: 10 })
    expect(upgradeOffer(poor, 'grillSpeed').blocker).toBe('money')
    expect(buyUpgrade(poor, 'grillSpeed')).toBe(poor)
    // nível: a 3ª vaga da chapa exige nível 4
    expect(upgradeOffer(rich({ level: 3 }), 'grillSlots').blocker).toBe('level')
    // fase: o 5º espaço exige a lanchonete de bairro
    const stuck = rich({ venue: 'stall', upgrades: { ...emptyUpgrades(), grillSlots: 2 } })
    expect(upgradeOffer(stuck, 'grillSlots')).toMatchObject({ blocker: 'venue', level: 2 })
    expect(buyUpgrade(stuck, 'grillSlots')).toBe(stuck)
    // a prioridade do motivo: nível antes de dinheiro
    expect(upgradeOffer(rich({ level: 3, money: 0 }), 'grillSlots').blocker).toBe('level')
  })

  it('o efeito atual aparece no texto do card', () => {
    const p = buyUpgrade(rich(), 'grillSpeed')
    expect(currentEffect(p, 'grillSpeed')).toBe('Cozimento 10% mais rápido')
    expect(currentEffect(createPlayer(), 'grillSlots')).toBe('2 espaços na chapa')
  })

  it('conta o que dá para comprar agora', () => {
    expect(affordableCount(createPlayer())).toBe(0) // nível 1: loja fechada
    expect(affordableCount(rich({ money: 0 }))).toBe(0)
    expect(affordableCount(rich())).toBeGreaterThan(10)
  })
})

describe('loja: decoração', () => {
  it('compra os visuais em ordem e o novo substitui o anterior', () => {
    let p = rich()
    p = buyDecor(p, 'floor')
    expect(p.decor.floor).toBe(1)
    const cost2 = DECOR.floor.tiers[1]!.cost
    const before = p.money
    p = buyDecor(p, 'floor')
    expect(p.decor.floor).toBe(2)
    expect(p.money).toBe(before - cost2)
    expect(decorTotals(p.decor).patience).toBeCloseTo(DECOR.floor.tiers[1]!.bonus)
  })

  it('respeita nível, fase e dinheiro, e não passa do último visual', () => {
    expect(decorOffer(rich({ level: 2 }), 'floor').blocker).toBe('closed')
    expect(decorOffer(rich({ level: 5 }), 'floor').next!.name).toBe('Piso xadrez')
    const low = rich({ level: 5, decor: { ...emptyDecor(), floor: 1 } })
    expect(decorOffer(low, 'floor').blocker).toBe('level') // porcelanato exige nível 9
    expect(decorOffer(rich({ venue: 'stall', decor: { ...emptyDecor(), floor: 1 } }), 'floor').blocker).toBe('venue')
    expect(decorOffer(rich({ money: 1 }), 'floor').blocker).toBe('money')
    let p = rich()
    for (let i = 0; i < 6; i++) p = buyDecor(p, 'tv')
    expect(p.decor.tv).toBe(DECOR.tv.tiers.length)
    expect(decorOffer(p, 'tv').blocker).toBe('maxed')
  })
})

describe('loja: fases da hamburgueria', () => {
  it('a expansão exige nível e dinheiro e leva para a fase seguinte', () => {
    const p = testPlayer({ level: 8, money: 10_000 })
    expect(venueOffer(p)).toMatchObject({ blocker: null })
    expect(venueOffer(p).next!.id).toBe('snackbar')
    const grown = expandVenue(p)
    expect(grown.venue).toBe('snackbar')
    expect(grown.money).toBe(10_000 - VENUES.snackbar.cost)
    expect(venueOffer(grown).next!.id).toBe('craft')
  })

  it('sem nível ou sem dinheiro, não expande', () => {
    expect(venueOffer(testPlayer({ level: 7, money: 1e6 })).blocker).toBe('level')
    expect(expandVenue(testPlayer({ level: 7, money: 1e6 })).venue).toBe('stall')
    expect(venueOffer(testPlayer({ level: 8, money: 100 })).blocker).toBe('money')
    expect(expandVenue(testPlayer({ level: 8, money: 100 })).venue).toBe('stall')
    expect(venueOffer(testPlayer({ level: 2, money: 1e6 })).blocker).toBe('closed')
  })

  it('percorre as 4 fases em ordem, e a última não tem expansão', () => {
    let p = rich({ venue: 'stall', money: 1e7 })
    const seen = [p.venue]
    for (let i = 0; i < 6; i++) {
      p = expandVenue(p)
      if (seen[seen.length - 1] !== p.venue) seen.push(p.venue)
    }
    expect(seen).toEqual(['stall', 'snackbar', 'craft', 'chain'])
    expect(venueOffer(p)).toMatchObject({ next: null, blocker: 'maxed' })
  })
})
