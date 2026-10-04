import { AnimatePresence, motion } from 'framer-motion'
import { CookablePile, cookableHeatColor } from '@/art'
import { COOKABLES, SHELF_CAPACITY, UI_LIMITS, type CookableId } from '@/game/config'
import { cookStage, hasStockFor, type CookStage, type Station } from '@/game/engine'
import { useGameStore } from '@/game/store'
import { Button } from '../Button'
import { CookRing } from '../CookRing'
import { Smoke } from '../Fx'

const STAGE_LABEL: Record<CookStage, { text: string; cls: string }> = {
  cooking: { text: 'Cozinhando', cls: 'bg-cream text-ink' },
  ready: { text: 'Pronto!', cls: 'bg-leaf text-white' },
  burnt: { text: 'Queimou!', cls: 'bg-tomato text-white' },
}

/** Nome curto para os botões. */
export const COOKABLE_SHORT: Record<CookableId, string> = {
  fries: 'Batata',
  rustic: 'Rústica',
  loaded: 'Cheddar & bacon',
  nuggets: 'Nuggets',
  rings: 'Anéis',
  brownie: 'Brownie',
}

interface Props {
  station: Station
  index: number
  /** O que será colocado neste espaço quando estiver vazio. */
  kind: CookableId
  size: number
}

/** Um cesto da fritadeira ou uma forma do forno: vazio (colocar), cozinhando (anel) ou pronto/queimado. */
export function CookerSlot({ station, index, kind, size }: Props) {
  const item = useGameStore((s) => (station === 'fryer' ? s.session.fryer : s.session.oven)[index] ?? null)
  const canPlace = useGameStore((s) => hasStockFor(s.session.stock, COOKABLES[kind].stock))
  const stockLeft = useGameStore((s) => {
    const first = Object.keys(COOKABLES[kind].stock)[0] as keyof typeof s.session.stock
    return s.session.stock[first]
  })
  const place = useGameStore((s) => s.placeCookable)
  const stage = item ? cookStage(item.kind, item.cook) : null
  const cfg = item ? COOKABLES[item.kind] : null
  const inner = Math.round(size * 0.8)

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <AnimatePresence mode="wait">
        {item && stage && cfg ? (
          <motion.div
            key="item"
            className="relative flex h-full w-full items-center justify-center"
            initial={{ y: -60, opacity: 0, scale: 1.3 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -30, opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            transition={{ type: 'spring', stiffness: 360, damping: 15 }}
          >
            <CookRing
              className="absolute inset-0"
              size={size}
              stroke={7}
              value={item.cook}
              total={cfg.burntSeconds}
              zones={[{ from: cfg.readySeconds, to: cfg.burntSeconds, color: '#5FB84A' }]}
            />
            <CookablePile kind={item.kind} color={cookableHeatColor(item.kind, item.cook)} className={`${stage === 'burnt' ? '' : 'fx-sizzle'}`} />
            {stage !== 'burnt' && station === 'fryer' && (
              <div className="pointer-events-none absolute inset-0">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className="fx-bubble absolute h-2 w-2 rounded-full border border-white/80 bg-white/50"
                    style={{ left: `${24 + i * 13}%`, top: `${30 + ((i * 37) % 40)}%`, ['--delay' as string]: `${i * 0.23}s` }}
                  />
                ))}
              </div>
            )}
            {stage === 'burnt' && <Smoke kind="heavy" className="left-1/2 top-[20px]" />}
            {stage === 'ready' && station === 'oven' && <Smoke kind="steam" className="left-1/2 top-[20px]" />}
            <span className={`absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border-[3px] border-ink px-2 py-0.5 font-display text-[12px] leading-none ${STAGE_LABEL[stage].cls}`}>
              {STAGE_LABEL[stage].text}
            </span>
          </motion.div>
        ) : (
          <motion.button
            key="empty"
            type="button"
            aria-label={`Colocar ${COOKABLES[kind].name.toLowerCase()} ${station === 'fryer' ? `na fritadeira (cesto ${index + 1})` : `no forno (forma ${index + 1})`}`}
            disabled={!canPlace}
            onClick={() => place(station, index, kind)}
            className={`flex flex-col items-center justify-center gap-0.5 rounded-full border-4 border-dashed border-white/70 bg-black/15 font-display text-white ${!canPlace ? 'opacity-40 grayscale' : ''}`}
            style={{ width: inner, height: inner }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileTap={{ scale: 0.93 }}
          >
            <span className="text-2xl leading-none">{canPlace ? '+' : '×'}</span>
            <span className="px-1 text-center text-[11px] leading-[1.05]">{canPlace ? COOKABLE_SHORT[kind] : 'Acabou'}</span>
            {canPlace && (
              <span className={`rounded-full px-1.5 text-[10px] leading-tight ${stockLeft <= UI_LIMITS.lowStock ? 'bg-orange text-white' : 'bg-white/25'}`}>×{stockLeft}</span>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Botão "Tirar"/"Lixo" de um cesto ou forma. */
export function CookerButton({ station, index, narrow = false }: { station: Station; index: number; narrow?: boolean }) {
  const item = useGameStore((s) => (station === 'fryer' ? s.session.fryer : s.session.oven)[index] ?? null)
  const storedFull = useGameStore((s) => (station === 'fryer' ? s.session.warmer.length >= s.session.perks.warmerSize : s.session.shelf.length >= SHELF_CAPACITY))
  const take = useGameStore((s) => s.takeCookable)
  const stage = item ? cookStage(item.kind, item.cook) : null
  return (
    <Button
      variant={stage === 'burnt' ? 'primary' : 'green'}
      disabled={!item || stage === 'cooking' || (stage === 'ready' && storedFull)}
      onClick={() => take(station, index)}
      className={`${narrow ? 'w-[76px]' : 'w-[96px]'} !rounded-xl !border-[3px] !px-2 !py-1 !text-sm`}
      aria-label={`${stage === 'burnt' ? 'Jogar no lixo' : 'Tirar'} ${station === 'fryer' ? `(cesto ${index + 1})` : `(forma ${index + 1})`}`}
    >
      {stage === 'burnt' ? 'Lixo' : 'Tirar'}
    </Button>
  )
}
