import type { GameEvent } from '../engine'

type Listener = (event: GameEvent) => void
const listeners = new Set<Listener>()

/** Canal de eventos do engine para a interface (efeitos visuais; no futuro, sons). */
export function emitGameEvents(events: readonly GameEvent[]): void {
  for (const event of events) listeners.forEach((l) => l(event))
}

export function onGameEvent(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
