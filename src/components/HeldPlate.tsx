import { AnimatePresence, motion } from 'framer-motion'
import { GRILL, INGREDIENTS } from '@/game/config'
import { PattyDisc, pattyHeatColor } from '@/art'
import type { HeldProtein, PattyQuality } from '@/game/engine'

const QUALITY_LABEL: Record<PattyQuality, string> = { raw: 'crua', perfect: 'no ponto', overdone: 'passada' }

/** Cor da proteína no prato: o ponto de cozimento em segundos de cada lado. */
export function heldColor(h: HeldProtein): string {
  const t = GRILL.kinds[h.id]
  const heat = h.quality === 'raw' ? 0 : h.quality === 'perfect' ? t.done : t.overdone
  return pattyHeatColor(heat, h.id)
}

interface Props {
  held: readonly HeldProtein[]
  /** Se informado, cada proteína vira um botão que a coloca no lanche. */
  onPick?: (index: number) => void
  canPick?: boolean
}

/** Prato com as proteínas prontas, esperando para entrar no lanche. */
export function HeldPlate({ held, onPick, canPick = true }: Props) {
  return (
    <div className="flex flex-col items-center gap-1" aria-label="Carnes prontas">
      <div className="relative grid h-[84px] w-[84px] grid-cols-2 content-center place-items-center gap-0.5 rounded-full border-4 border-ink bg-white p-1.5 shadow-[0_4px_0_rgba(59,31,14,.35)]">
        <div className="pointer-events-none absolute inset-2 rounded-full border-2 border-[#E4D7BE]" />
        <AnimatePresence>
          {held.map((h, i) => (
            <motion.button
              key={`${i}-${h.id}-${h.quality}`}
              type="button"
              aria-label={`Pôr ${INGREDIENTS[h.id].name.toLowerCase()} ${QUALITY_LABEL[h.quality]} no lanche`}
              disabled={!onPick || !canPick}
              onClick={() => onPick?.(i)}
              className={`relative h-[34px] w-[34px] ${onPick && canPick ? '' : 'cursor-default'} ${onPick && !canPick ? 'opacity-60' : ''}`}
              initial={{ scale: 0, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0, transition: { duration: 0.15 } }}
              whileTap={onPick && canPick ? { scale: 0.85 } : undefined}
              transition={{ type: 'spring', stiffness: 500, damping: 18 }}
            >
              <PattyDisc color={heldColor(h)} kind={h.id} className="h-full w-full overflow-visible" />
            </motion.button>
          ))}
        </AnimatePresence>
        {held.length === 0 && (
          <span className="col-span-2 text-center font-display text-[10px] leading-tight text-ink/50">sem carne pronta</span>
        )}
      </div>
      <span className="font-display text-[11px] leading-none text-white [text-shadow:0_1px_0_#3B1F0E,1px_0_0_#3B1F0E,-1px_0_0_#3B1F0E]">
        Carnes {held.length}/{GRILL.heldCapacity}
      </span>
    </div>
  )
}
