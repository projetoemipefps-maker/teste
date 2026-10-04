import type { PersistStorage, StorageValue } from 'zustand/middleware'

/**
 * localStorage com gravação periódica. O jogo muda de estado a cada quadro, então guardamos só o estado
 * mais recente e o serializamos no máximo uma vez a cada `intervalMs` (e na hora, ao sair da página ou trocar de aba).
 */
export function createThrottledStorage<S>(intervalMs = 1000): PersistStorage<S> {
  const pending = new Map<string, StorageValue<S>>()
  let timer: ReturnType<typeof setTimeout> | undefined

  const safe = <T>(fn: () => T): T | null => {
    try {
      return fn()
    } catch {
      return null // modo privado, cota cheia ou armazenamento bloqueado: o jogo segue sem salvar
    }
  }

  const flush = () => {
    clearTimeout(timer)
    timer = undefined
    for (const [name, value] of pending) safe(() => localStorage.setItem(name, JSON.stringify(value)))
    pending.clear()
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', () => document.hidden && flush())
  }

  return {
    getItem: (name) => {
      flush()
      const raw = safe(() => localStorage.getItem(name))
      if (raw === null) return null
      return safe(() => JSON.parse(raw) as StorageValue<S>)
    },
    setItem: (name, value) => {
      pending.set(name, value)
      // Sem reiniciar o relógio a cada mudança: garante uma gravação a cada `intervalMs`.
      if (timer === undefined) timer = setTimeout(flush, intervalMs)
    },
    removeItem: (name) => {
      pending.delete(name)
      safe(() => localStorage.removeItem(name))
    },
  }
}
