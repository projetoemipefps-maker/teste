/** Barra de paciência: do verde ao vermelho conforme a paciência acaba. */
export function PatienceBar({ ratio }: { ratio: number }) {
  const r = Math.min(1, Math.max(0, ratio))
  return (
    <div className="h-3.5 w-full overflow-hidden rounded-full border-[3px] border-ink bg-ink/20">
      <div
        className="h-full rounded-full"
        style={{
          width: `${r * 100}%`,
          background: `hsl(${Math.round(r * 120)} 75% 48%)`,
          boxShadow: 'inset 0 3px 0 rgba(255,255,255,.35)',
        }}
      />
    </div>
  )
}
