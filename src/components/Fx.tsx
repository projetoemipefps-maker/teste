import type { CSSProperties } from 'react'

/** Valores determinísticos por índice, para o efeito não "piscar" a cada renderização. */
const pseudo = (i: number, salt: number) => ((Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453) % 1 + 1) % 1

interface SmokeProps {
  /** 'steam' = vapor fraquinho; 'light' = carne passando; 'heavy' = queimada (fumaça preta e densa). */
  kind: 'steam' | 'light' | 'heavy'
  className?: string
}

const SMOKE = {
  steam: { count: 3, color: '255,255,255', opacity: 0.45, size: 16, dur: 2.6 },
  light: { count: 4, color: '190,190,190', opacity: 0.7, size: 20, dur: 2.2 },
  heavy: { count: 7, color: '42,36,34', opacity: 0.85, size: 26, dur: 1.8 },
} as const

/** Fumacinha subindo. */
export function Smoke({ kind, className = '' }: SmokeProps) {
  const cfg = SMOKE[kind]
  return (
    <div className={`pointer-events-none absolute ${className}`}>
      {Array.from({ length: cfg.count }, (_, i) => {
        const style = {
          left: `${(pseudo(i, 1) - 0.5) * 60}px`,
          width: cfg.size,
          height: cfg.size,
          background: `radial-gradient(circle, rgba(${cfg.color},${cfg.opacity}) 0%, rgba(${cfg.color},0) 70%)`,
          '--sx': `${(pseudo(i, 2) - 0.5) * 36}px`,
          '--rise': `${-60 - pseudo(i, 3) * 40}px`,
          '--delay': `${(i / cfg.count) * cfg.dur}s`,
          '--dur': `${cfg.dur}s`,
          '--smoke-opacity': cfg.opacity,
        } as CSSProperties
        return <span key={i} className="fx-smoke absolute rounded-full" style={style} />
      })}
    </div>
  )
}

/** Bolhinhas de óleo estourando na borda (o "chiado" visual). */
export function Sizzle({ count = 7, className = '' }: { count?: number; className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`}>
      {Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2 + pseudo(i, 4)
        const rad = 44 + pseudo(i, 5) * 8
        const style = {
          left: `${50 + Math.cos(a) * rad}%`,
          top: `${50 + Math.sin(a) * rad * 0.9}%`,
          '--delay': `${pseudo(i, 6) * 0.9}s`,
          '--dur': `${0.6 + pseudo(i, 7) * 0.7}s`,
        } as CSSProperties
        return (
          <span
            key={i}
            className="fx-bubble absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/80 bg-white/50"
            style={style}
          />
        )
      })}
    </div>
  )
}

/** Faíscas leves, de vez em quando. */
export function Sparks({ count = 4, className = '' }: { count?: number; className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`}>
      {Array.from({ length: count }, (_, i) => {
        const a = pseudo(i, 8) * Math.PI * 2
        const dist = 26 + pseudo(i, 9) * 22
        const style = {
          left: '50%',
          top: '50%',
          '--dx': `${Math.cos(a) * dist}px`,
          '--dy': `${Math.sin(a) * dist - 12}px`,
          '--delay': `${i * 0.9 + pseudo(i, 10) * 1.6}s`,
          '--dur': `${3.5 + pseudo(i, 11) * 3}s`,
        } as CSSProperties
        return (
          <span
            key={i}
            className="fx-spark absolute h-1.5 w-1.5 rounded-full bg-[#FFD04A] shadow-[0_0_6px_2px_rgba(255,160,40,.8)]"
            style={style}
          />
        )
      })}
    </div>
  )
}
