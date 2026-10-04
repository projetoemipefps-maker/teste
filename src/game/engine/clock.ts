import { SHIFT } from '../config'

export function shiftProgress(elapsed: number): number {
  return Math.min(1, Math.max(0, elapsed / SHIFT.durationSeconds))
}

/** Horário do relógio do jogo, "HH:MM". */
export function formatClock(elapsed: number): string {
  const totalMinutes = Math.floor(
    SHIFT.openHour * 60 + shiftProgress(elapsed) * (SHIFT.closeHour - SHIFT.openHour) * 60,
  )
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
