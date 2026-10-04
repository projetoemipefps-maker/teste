import { useEffect, useRef } from 'react'

/**
 * Loop com requestAnimationFrame e delta time (em segundos).
 * Com `running = false` o loop é cancelado; ao retomar, o primeiro quadro não acumula o tempo parado.
 */
export function useGameLoop(running: boolean, onTick: (dt: number) => void): void {
  const tickRef = useRef(onTick)
  tickRef.current = onTick

  useEffect(() => {
    if (!running) return
    let raf = 0
    let last = performance.now()
    const frame = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      tickRef.current(dt)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [running])
}
