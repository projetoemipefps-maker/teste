/** Gerador pseudoaleatório puro (mulberry32): recebe o estado e devolve [valor 0–1, novo estado]. */
export function nextRandom(state: number): [number, number] {
  const t = (state + 0x6d2b79f5) >>> 0
  let r = Math.imul(t ^ (t >>> 15), 1 | t)
  r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
  return [((r ^ (r >>> 14)) >>> 0) / 4294967296, t]
}

/** Inteiro em [min, max], inclusive. */
export function randomInt(state: number, min: number, max: number): [number, number] {
  const [v, next] = nextRandom(state)
  return [min + Math.floor(v * (max - min + 1)), next]
}

/** Real em [min, max). */
export function randomRange(state: number, min: number, max: number): [number, number] {
  const [v, next] = nextRandom(state)
  return [min + v * (max - min), next]
}
