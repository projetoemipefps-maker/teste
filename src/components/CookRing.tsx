interface Zone {
  from: number
  to: number
  color: string
}

interface Props {
  /** Valor atual (mesma unidade de `total`, normalmente segundos). */
  value: number
  total: number
  zones: readonly Zone[]
  size: number
  stroke: number
  /** Mostra a bolinha marcadora na posição atual. */
  marker?: boolean
  className?: string
}

const TRACK = 'rgba(59,31,14,.28)'

/** Anel circular de cozimento: faixas coloridas (no ponto, passando, queimando) que acendem conforme o tempo passa. */
export function CookRing({ value, total, zones, size, stroke, marker = true, className }: Props) {
  const r = (size - stroke) / 2
  const c = size / 2
  const pct = (v: number) => Math.min(100, Math.max(0, (v / total) * 100))
  const arc = (from: number, to: number, color: string, opacity = 1, key = '') => {
    const start = pct(from)
    const len = Math.max(0, pct(to) - start)
    if (len <= 0) return null
    return (
      <circle
        key={key}
        cx={c}
        cy={c}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="butt"
        pathLength={100}
        strokeDasharray={`${len} ${100 - len}`}
        strokeDashoffset={-start}
        opacity={opacity}
        transform={`rotate(-90 ${c} ${c})`}
      />
    )
  }
  const angle = (pct(value) / 100) * 2 * Math.PI - Math.PI / 2
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className} aria-hidden>
      <circle cx={c} cy={c} r={r + stroke / 2 + 1} fill="none" stroke="#3B1F0E" strokeWidth={2} opacity={0.55} />
      <circle cx={c} cy={c} r={r - stroke / 2 - 1} fill="none" stroke="#3B1F0E" strokeWidth={2} opacity={0.55} />
      <circle cx={c} cy={c} r={r} fill="none" stroke={TRACK} strokeWidth={stroke} />
      {zones.map((z, i) => arc(z.from, z.to, z.color, 0.35, `dim${i}`))}
      {zones.map((z, i) => arc(z.from, Math.min(z.to, value), z.color, 1, `on${i}`))}
      {marker && (
        <circle
          cx={c + r * Math.cos(angle)}
          cy={c + r * Math.sin(angle)}
          r={stroke * 0.62}
          fill="#fff"
          stroke="#3B1F0E"
          strokeWidth={2.5}
        />
      )}
    </svg>
  )
}
