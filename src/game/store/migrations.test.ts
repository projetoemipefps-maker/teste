import { describe, expect, it } from 'vitest'
import { PROGRESSION } from '../config'
import { defaultSave, migrateSave, sanitizeSave, type Migration } from './migrations'

describe('save', () => {
  it('lixo ou vazio vira o save padrão', () => {
    expect(migrateSave(null, 1)).toEqual(defaultSave())
    expect(migrateSave('oi', 1)).toEqual(defaultSave())
    expect(sanitizeSave(undefined)).toEqual(defaultSave())
  })

  it('completa campos que faltam', () => {
    const s = sanitizeSave({ hasSave: true, player: { money: 50 } })
    expect(s.hasSave).toBe(true)
    expect(s.player.money).toBe(50)
    expect(s.player.level).toBe(PROGRESSION.startingLevel)
    expect(s.settings.reduceMotion).toBe(false)
  })

  it('corrige valores inválidos', () => {
    const s = sanitizeSave({ player: { money: -10, level: 9999, reputation: 42, xp: 'x', day: NaN } })
    expect(s.player.money).toBe(0)
    expect(s.player.level).toBe(PROGRESSION.maxLevel)
    expect(s.player.reputation).toBe(PROGRESSION.maxReputation)
    expect(s.player.xp).toBe(0)
    expect(s.player.day).toBe(1)
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
