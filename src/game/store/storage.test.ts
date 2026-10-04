import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createThrottledStorage } from './storage'

/** localStorage de mentira (o ambiente de teste é node). */
function installFakeStorage() {
  const data = new Map<string, string>()
  const writes: string[] = []
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => {
      writes.push(k)
      data.set(k, v)
    },
    removeItem: (k: string) => void data.delete(k),
  })
  return { data, writes }
}

describe('armazenamento com gravação periódica', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('muitas mudanças seguidas viram uma gravação por intervalo (sem "starvation")', () => {
    const { writes, data } = installFakeStorage()
    const storage = createThrottledStorage<{ n: number }>(1000)
    // 3 segundos de mudanças a cada 16 ms (como o loop do jogo)
    for (let t = 0; t < 3000; t += 16) {
      storage.setItem('save', { state: { n: t }, version: 1 })
      vi.advanceTimersByTime(16)
    }
    expect(writes.length).toBeGreaterThanOrEqual(2) // gravou durante o jogo, não só no fim
    expect(writes.length).toBeLessThanOrEqual(4) // mas bem menos que 60 vezes por segundo
    expect(JSON.parse(data.get('save')!).state.n).toBeGreaterThan(1500)
  })

  it('lê o que acabou de ser escrito, mesmo antes do intervalo acabar', () => {
    installFakeStorage()
    const storage = createThrottledStorage<{ n: number }>(1000)
    storage.setItem('save', { state: { n: 7 }, version: 2 })
    expect(storage.getItem('save')).toEqual({ state: { n: 7 }, version: 2 })
  })

  it('save corrompido vira null em vez de quebrar', () => {
    const { data } = installFakeStorage()
    data.set('save', '{isso não é json')
    expect(createThrottledStorage<{ n: number }>().getItem('save')).toBeNull()
  })

  it('sem localStorage disponível, o jogo segue sem salvar', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('bloqueado')
      },
      setItem: () => {
        throw new Error('bloqueado')
      },
      removeItem: () => {
        throw new Error('bloqueado')
      },
    })
    const storage = createThrottledStorage<{ n: number }>(100)
    expect(() => {
      storage.setItem('save', { state: { n: 1 }, version: 1 })
      vi.advanceTimersByTime(200)
    }).not.toThrow()
    expect(storage.getItem('save')).toBeNull()
  })

  it('remover apaga o que estava pendente', () => {
    const { data } = installFakeStorage()
    const storage = createThrottledStorage<{ n: number }>(1000)
    storage.setItem('save', { state: { n: 1 }, version: 1 })
    storage.removeItem('save')
    vi.advanceTimersByTime(2000)
    expect(data.has('save')).toBe(false)
  })
})
