import { describe, expect, it } from 'vitest'
import { LOAN, MAX_STOCK, PROGRESSION, REPUTATION, STOCK_IDS } from '../config'
import { createPlayer, defaultPrices, openDay, priceLimits, startingStock, type Review } from '../engine'
import { SAVE_VERSION, defaultSave, migrateSave, sanitizeSave, type Migration } from './migrations'

const review = (i: number): Review => ({ id: `1-${i}`, day: 1, stars: 5, text: 'Muito bom', name: 'Ana' })

describe('save', () => {
  it('a versão atual é a 3', () => {
    expect(SAVE_VERSION).toBe(3)
  })

  it('lixo ou vazio vira o save padrão', () => {
    expect(migrateSave(null, 1)).toEqual(defaultSave())
    expect(migrateSave('oi', 1)).toEqual(defaultSave())
    expect(sanitizeSave(undefined)).toEqual(defaultSave())
  })

  it('migra um save da versão 1 mantendo dinheiro, XP, nível e dia, e criando o resto', () => {
    const v1 = {
      hasSave: true,
      player: { money: 123, xp: 17, level: 4, day: 6, reputation: 4.2 },
      settings: { reduceMotion: true },
    }
    const s = migrateSave(v1, 1)
    expect(s.hasSave).toBe(true)
    expect(s.settings.reduceMotion).toBe(true)
    expect(s.player).toMatchObject({ money: 123, xp: 17, level: 4, day: 6, phase: 'prep', dayStart: null, bankrupt: false })
    expect(s.player.reputation).toBe(PROGRESSION.startingReputation) // agora vem das avaliações
    expect(s.player.reviews).toEqual([])
    expect(s.player.stock).toEqual(startingStock(4)) // nível 4: itens liberados ganham estoque
    expect(s.player.prices).toEqual(defaultPrices())
    expect(s.player.dayBoost).toBe(1)
    expect(s.player.loan).toEqual({ taken: false, installmentsLeft: 0, installment: 0 })
  })

  it('migra um save da versão 2: preços de bebida e batata trocam de chave, estoque dos itens novos é completado', () => {
    const v2 = {
      hasSave: true,
      player: {
        money: 450,
        xp: 30,
        level: 6,
        day: 9,
        stock: { bun: 20, patty: 14, cheese: 3, lettuce: 1, tomato: 2, potato: 9, soda: 7 },
        prices: { 'recipe:simples': 15, fries: 9, 'drink:small': 6, 'drink:large': 11 },
        reviews: [{ id: '8-1', day: 8, stars: 5, text: 'Que delícia, recomendo!', name: 'Bia' }],
      },
      settings: { reduceMotion: false },
    }
    const s = migrateSave(v2, 2)
    expect(s.player).toMatchObject({ money: 450, level: 6, day: 9, dayBoost: 1 })
    expect(s.player.stock).toMatchObject({ bun: 20, patty: 14, cheese: 3, soda: 7, cheddar: 6, bacon: 6, juice: 6 }) // mantém o que tinha, completa o resto
    expect(s.player.stock.creamyCheddar).toBe(0) // ainda não liberado
    expect(s.player.prices['recipe:simples']).toBe(15)
    expect(s.player.prices['side:fries']).toBe(9)
    expect(s.player.prices['drink:soda:small']).toBe(6)
    expect(s.player.prices['drink:soda:large']).toBe(11)
    expect(s.player.prices.fries).toBeUndefined()
    expect(s.player.reviews).toHaveLength(1)
  })

  it('um save v3 válido passa intacto', () => {
    const player = { ...createPlayer(), money: 777, day: 3, reviews: [review(1)], debtDays: 1, dayBoost: 1.24 }
    const s = migrateSave({ hasSave: true, player, settings: { reduceMotion: false } }, 3)
    expect(s.player.dayBoost).toBeCloseTo(1.24)
    expect(s.player.money).toBe(777)
    expect(s.player.day).toBe(3)
    expect(s.player.reviews).toEqual([review(1)])
    expect(s.player.debtDays).toBe(1)
    expect(s.player.reputation).toBeGreaterThan(3) // calculada pela avaliação
  })

  it('completa campos que faltam', () => {
    const s = sanitizeSave({ hasSave: true, player: { money: 50 } })
    expect(s.hasSave).toBe(true)
    expect(s.player.money).toBe(50)
    expect(s.player.level).toBe(PROGRESSION.startingLevel)
    expect(s.player.stock).toEqual(startingStock(1))
    expect(s.settings.reduceMotion).toBe(false)
  })

  it('corrige valores inválidos', () => {
    const s = sanitizeSave({
      player: {
        money: 'x',
        level: 9999,
        xp: -4,
        day: NaN,
        stock: { patty: -5, bun: 99999, cheese: 'a' },
        prices: { 'recipe:simples': 9999, 'recipe:fantasma': 3, fries: -1 },
        loan: { taken: 'sim', installmentsLeft: 999, installment: -3 },
        debtDays: 99,
        reviews: [{ id: 'a', day: 1, stars: 9, text: 'ok', name: 'Zé' }, 'lixo', { text: 1 }],
      },
    })
    expect(s.player.money).toBe(createPlayer().money)
    expect(s.player.level).toBe(PROGRESSION.maxLevel)
    expect(s.player.xp).toBe(0)
    expect(s.player.day).toBe(1)
    expect(s.player.stock.patty).toBe(0)
    expect(s.player.stock.bun).toBe(MAX_STOCK)
    expect(s.player.stock.cheese).toBe(startingStock(1).cheese)
    expect(s.player.prices['recipe:simples']).toBe(priceLimits('recipe:simples').max)
    expect(s.player.prices['recipe:fantasma']).toBeUndefined()
    expect(s.player.prices['side:fries']).toBeGreaterThan(0)
    expect(s.player.loan).toEqual({ taken: false, installmentsLeft: LOAN.installments, installment: 0 })
    expect(s.player.debtDays).toBeLessThanOrEqual(3)
    expect(s.player.reviews).toHaveLength(1)
    expect(s.player.reviews[0]!.stars).toBe(5)
  })

  it('o dinheiro pode ser negativo (caixa no vermelho)', () => {
    expect(sanitizeSave({ player: { money: -80 } }).player.money).toBe(-80)
  })

  it('limita o histórico de avaliações e o tamanho do texto', () => {
    const many = Array.from({ length: 200 }, (_, i) => ({ ...review(i), text: 'x'.repeat(500) }))
    const s = sanitizeSave({ player: { reviews: many } })
    expect(s.player.reviews).toHaveLength(REPUTATION.keepReviews)
    expect(s.player.reviews[0]!.text.length).toBeLessThanOrEqual(120)
  })

  it('o dia em andamento só vale com o estado de abertura íntegro', () => {
    const opened = openDay({ ...createPlayer(), money: 400 })
    const ok = sanitizeSave({ hasSave: true, player: opened })
    expect(ok.player.phase).toBe('open')
    expect(ok.player.dayStart?.money).toBe(400)
    const broken = sanitizeSave({ hasSave: true, player: { ...opened, dayStart: null } })
    expect(broken.player.phase).toBe('prep')
    expect(broken.player.dayStart).toBeNull()
  })

  it('cada item do estoque sempre existe depois de sanitizar', () => {
    const s = sanitizeSave({ player: { stock: {} } })
    for (const id of STOCK_IDS) expect(typeof s.player.stock[id]).toBe('number')
  })

  it('aplica as migrações em cadeia, em ordem', () => {
    const migrations: Record<number, Migration> = {
      0: (d) => ({ ...d, player: { money: d.coins } }),
      1: (d) => ({ ...d, hasSave: true }),
    }
    const s = migrateSave({ coins: 77 }, 0, migrations, 2)
    expect(s.player.money).toBe(77)
    expect(s.hasSave).toBe(true)
  })

  it('save sem migração disponível é sanitizado em vez de quebrar', () => {
    const s = migrateSave({ hasSave: true, player: { money: 5 } }, 0, {}, 3)
    expect(s.player.money).toBe(5)
  })
})
