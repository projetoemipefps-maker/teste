import { COOKABLES, GRILL, type CookableId, type ProteinId } from '@/game/config'
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

/** Cores de cada lado, do cru ao queimado: [cru, meio, no ponto, passado, queimado]. */
const PATTY_PALETTE: Record<ProteinId, readonly [string, string, string, string, string]> = {
  patty: ['#F29AA0', '#D07A66', '#8D4B26', '#55301A', '#1B1411'],
  chicken: ['#F1D2B4', '#E7BC82', '#D79A45', '#9C5D24', '#1F1612'],
  veggie: ['#B6CF86', '#9BB567', '#7A8A45', '#4A4A28', '#1B1B12'],
}

/** Cor de um lado da proteína na chapa, conforme os segundos de cozimento. */
export function pattyHeatColor(heat: number, kind: ProteinId = 'patty'): string {
  const t = GRILL.kinds[kind]
  const [raw, mid, done, over, burnt] = PATTY_PALETTE[kind]
  return colorAt(
    [
      [0, raw],
      [t.done * 0.5, mid],
      [t.done, done],
      [t.overdone, over],
      [t.burnt, burnt],
    ],
    heat,
  )
}

/** Cores da proteína (vista lateral) já dentro do lanche. */
export const PATTY_QUALITY_COLORS: Record<ProteinId, Record<PattyQuality, { base: string; top: string; marks: string }>> = {
  patty: {
    raw: { base: '#D9777F', top: '#F2A6AB', marks: '#B85962' },
    perfect: { base: '#7B3F1C', top: '#A55E30', marks: '#4E230C' },
    overdone: { base: '#4A2713', top: '#6B3A20', marks: '#2B140A' },
  },
  chicken: {
    raw: { base: '#EDCFA8', top: '#F7E2C6', marks: '#C9A47A' },
    perfect: { base: '#D9963F', top: '#EDB866', marks: '#B06F22' },
    overdone: { base: '#9C5D24', top: '#BC7C3E', marks: '#6B3A12' },
  },
  veggie: {
    raw: { base: '#9DB86F', top: '#BBD28F', marks: '#7E9A52' },
    perfect: { base: '#7A7B3E', top: '#9A9C58', marks: '#4F5A2A' },
    overdone: { base: '#4C4A28', top: '#6A6840', marks: '#2E2C16' },
  },
}

/** Cores de cada item que cozinha: [cru, quase pronto, pronto, passando, queimado]. */
const COOKABLE_PALETTE: Record<CookableId, readonly [string, string, string, string, string]> = {
  fries: ['#F5E6A8', '#F6D56A', '#F0A826', '#8A5A14', '#241812'],
  rustic: ['#EBD9A0', '#E5BE62', '#D68E2A', '#7A4A14', '#241812'],
  loaded: ['#F5E6A8', '#F6D56A', '#F0A826', '#8A5A14', '#241812'],
  nuggets: ['#F0DDB8', '#E8C082', '#D9983F', '#7E4A1A', '#241812'],
  rings: ['#F2E2B2', '#EBC672', '#E39A33', '#82501A', '#241812'],
  brownie: ['#B98A5C', '#8B5A36', '#5B3320', '#3A2014', '#161010'],
}

/** Cor do item na fritadeira ou no forno, conforme o tempo de cozimento. */
export function cookableHeatColor(kind: CookableId, cook: number): string {
  const c = COOKABLES[kind]
  const [raw, almost, ready, over, burnt] = COOKABLE_PALETTE[kind]
  return colorAt(
    [
      [0, raw],
      [c.readySeconds * 0.6, almost],
      [c.readySeconds, ready],
      [c.burntSeconds * 0.85, over],
      [c.burntSeconds, burnt],
    ],
    cook,
  )
}
