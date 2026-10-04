import { motion } from 'framer-motion'
import { Star } from '@/art'
import { REPUTATION } from '@/game/config'
import { starFill, type Review } from '@/game/engine'

function Stars({ value, idPrefix, size = 'h-4 w-4' }: { value: number; idPrefix: string; size?: string }) {
  return (
    <span className="flex" role="img" aria-label={`${value.toFixed(1)} de 5 estrelas`}>
      {Array.from({ length: REPUTATION.maxStars }, (_, i) => (
        <Star key={i} id={`${idPrefix}-${i}`} amount={starFill(value, i)} className={`-mx-px ${size}`} />
      ))}
    </span>
  )
}

/** Avaliações recentes dos clientes, com a nota geral da lanchonete no topo. */
export function ReviewsList({ reviews, reputation, idPrefix = 'rv' }: { reviews: readonly Review[]; reputation: number; idPrefix?: string }) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between rounded-2xl border-4 border-ink bg-mustard px-3 py-2 shadow-[0_4px_0_rgba(59,31,14,.35)]">
        <div>
          <p className="font-display text-xl leading-none text-ink">Nota da lanchonete</p>
          <p className="mt-0.5 text-xs text-ink/80">
            média das últimas {Math.min(REPUTATION.window, reviews.length) || REPUTATION.window} avaliações
          </p>
        </div>
        <div className="flex flex-col items-end">
          <span className="font-display text-3xl leading-none text-ink">{reputation.toFixed(1)}</span>
          <Stars value={reputation} idPrefix={`${idPrefix}-top`} size="h-5 w-5" />
        </div>
      </div>

      {reviews.length === 0 ? (
        <p className="rounded-2xl border-4 border-dashed border-ink/30 px-4 py-6 text-center text-ink/60">
          Ainda não há avaliações. Atenda os primeiros clientes!
        </p>
      ) : (
        reviews.map((r, i) => (
          <motion.article
            key={r.id}
            className="rounded-2xl border-[3px] border-ink bg-white px-3 py-2"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(i, 8) * 0.04 }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-display text-base leading-none text-ink">{r.name}</span>
              <span className="flex items-center gap-2">
                <span className="text-[11px] text-ink/50">Dia {r.day}</span>
                <Stars value={r.stars} idPrefix={`${idPrefix}-${r.id}`} />
              </span>
            </div>
            <p className="mt-1 text-[15px] leading-snug text-ink">“{r.text}”</p>
          </motion.article>
        ))
      )}
    </div>
  )
}
