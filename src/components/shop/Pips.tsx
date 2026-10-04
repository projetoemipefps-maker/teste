/** Bolinhas de nível: cheias para o que já foi comprado. */
export function Pips({ level, max, label }: { level: number; max: number; label: string }) {
  return (
    <div className="flex items-center gap-[3px]" role="img" aria-label={`${label}: ${level} de ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={`h-2.5 w-2.5 rounded-full border-2 border-ink ${i < level ? 'bg-leaf' : 'bg-cream-dark'}`} />
      ))}
    </div>
  )
}

/** Barra de progresso das melhorias de um equipamento. */
export function ProgressBar({ done, total }: { done: number; total: number }) {
  const ratio = total > 0 ? done / total : 0
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-3.5 flex-1 overflow-hidden rounded-full border-[3px] border-ink bg-cream-dark" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
        <div className="h-full rounded-full bg-gradient-to-b from-[#9BE06F] to-leaf transition-[width] duration-500" style={{ width: `${ratio * 100}%` }} />
      </div>
      <span className="whitespace-nowrap font-display text-xs leading-none text-ink">
        {done}/{total}
      </span>
    </div>
  )
}
