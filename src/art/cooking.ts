import { FRYER, GRILL } from '@/game/config'
import type { PattyQuality } from '@/game/engine'

type Stop = readonly [number, string]

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function lerpColor(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a)
  const [br, bg, bb] = hexToRgb(b)
  const k = Math.min(1, Math.max(0, t))
  const mix = (x: number, y: number) => Math.round(x + (y - x) * k)
  return `rgb(${mix(ar, br)}, ${mix(ag, bg)}, ${mix(ab, bb)})`
}

/** Interpola entre as paradas (valor, cor) — as cores acompanham o tempo de cozimento. */
function colorAt(stops: readonly Stop[], value: number): string {
  const first = stops[0]!
  if (value <= first[0]) return lerpColor(first[1], first[1], 0)
  for (let i = 1; i < stops.length; i++) {
    const [v1, c1] = stops[i]!
    const [v0, c0] = stops[i - 1]!
    if (value <= v1) return lerpColor(c0, c1, (value - v0) / (v1 - v0))
  }
  const last = stops[stops.length - 1]!
  return lerpColor(last[1], last[1], 0)
}

/** Cor de um lado da carne: rosa (crua) → marrom (no ponto) → escuro (passada) → preto (queimada). */
const PATTY_STOPS: readonly Stop[] = [
  [0, '#F29AA0'],
  [GRILL.sideDoneSeconds * 0.5, '#D07A66'],
  [GRILL.sideDoneSeconds, '#8D4B26'],
  [GRILL.sideOverdoneSeconds, '#55301A'],
  [GRILL.sideBurntSeconds, '#1B1411'],
]
export const pattyHeatColor = (heat: number): string => colorAt(PATTY_STOPS, heat)

/** Cores do hambúrguer (vista lateral) já dentro do lanche. */
export const PATTY_QUALITY_COLORS: Record<PattyQuality, { base: string; top: string; marks: string }> = {
  raw: { base: '#D9777F', top: '#F2A6AB', marks: '#B85962' },
  perfect: { base: '#7B3F1C', top: '#A55E30', marks: '#4E230C' },
  overdone: { base: '#4A2713', top: '#6B3A20', marks: '#2B140A' },
}

const FRIES_STOPS: readonly Stop[] = [
  [0, '#F5E6A8'],
  [FRYER.readySeconds * 0.6, '#F6D56A'],
  [FRYER.readySeconds, '#F0A826'],
  [FRYER.burntSeconds * 0.85, '#8A5A14'],
  [FRYER.burntSeconds, '#241812'],
]
export const friesHeatColor = (cook: number): string => colorAt(FRIES_STOPS, cook)
