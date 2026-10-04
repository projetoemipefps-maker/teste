import { AnimatePresence, motion } from 'framer-motion'
import { Fryer, FriesCarton, FriesPile, friesHeatColor } from '@/art'
import { FRYER, UI_LIMITS } from '@/game/config'
import { friesQuality, friesStage, type FriesStage } from '@/game/engine'
import { useGameStore } from '@/game/store'
import { Button } from '../Button'
import { CookRing } from '../CookRing'
import { Smoke } from '../Fx'

const ZONES = [{ from: FRYER.readySeconds, to: FRYER.burntSeconds, color: '#5FB84A' }] as const

const STAGE_LABEL: Record<FriesStage, { text: string; cls: string }> = {
  cooking: { text: 'Fritando', cls: 'bg-cream text-ink' },
  ready: { text: 'Pronta!', cls: 'bg-leaf text-white' },
  burnt: { text: 'Queimou!', cls: 'bg-tomato text-white' },
}

function Basket({ index }: { index: number }) {
  const basket = useGameStore((s) => s.session.fryer[index] ?? null)
  const place = useGameStore((s) => s.placeFries)
  const stock = useGameStore((s) => s.session.stock.potato)
  const stage = basket ? friesStage(basket.cook) : null

  return (
    <div className="flex w-[100px] flex-col items-center">
      <div className="relative flex h-[100px] w-[100px] items-center justify-center">
        <AnimatePresence mode="wait">
          {basket && stage ? (
            <motion.div
              key="basket"
              className="relative flex h-full w-full items-center justify-center"
              initial={{ y: -60, opacity: 0, scale: 1.3 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -30, opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 360, damping: 15 }}
            >
              <CookRing className="absolute inset-0" size={100} stroke={7} value={basket.cook} total={FRYER.burntSeconds} zones={ZONES} />
              <FriesPile color={friesHeatColor(basket.cook)} className={`h-[66px] w-[66px] ${stage === 'burnt' ? '' : 'fx-sizzle'}`} />
              {stage !== 'burnt' && (
                <div className="pointer-events-none absolute inset-0">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <span
                      key={i}
                      className="fx-bubble absolute h-2 w-2 rounded-full border border-white/80 bg-white/50"
                      style={{
                        left: `${24 + i * 13}%`,
                        top: `${30 + ((i * 37) % 40)}%`,
                        ['--delay' as string]: `${i * 0.23}s`,
                      }}
                    />
                  ))}
                </div>
              )}
              {stage === 'burnt' && <Smoke kind="heavy" className="left-1/2 top-[20px]" />}
              <span className={`absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border-[3px] border-ink px-2 py-0.5 font-display text-[12px] leading-none ${STAGE_LABEL[stage].cls}`}>
                {STAGE_LABEL[stage].text}
              </span>
            </motion.div>
          ) : (
            <motion.button
              key="empty"
              type="button"
              aria-label={`Colocar batata na fritadeira (cesto ${index + 1})`}
              disabled={stock <= 0}
              onClick={() => place(index)}
              className={`flex h-[80px] w-[80px] flex-col items-center justify-center gap-0.5 rounded-full border-4 border-dashed border-white/70 bg-black/15 font-display text-white ${stock <= 0 ? 'opacity-40 grayscale' : ''}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileTap={{ scale: 0.93 }}
            >
              <span className="text-2xl leading-none">{stock <= 0 ? '×' : '+'}</span>
              <span className="text-xs leading-none">{stock <= 0 ? 'Acabou' : 'Batata'}</span>
              {stock > 0 && (
                <span className={`rounded-full px-1.5 text-[10px] leading-tight ${stock <= UI_LIMITS.lowStock ? 'bg-orange text-white' : 'bg-white/25'}`}>×{stock}</span>
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function BasketButton({ index }: { index: number }) {
  const basket = useGameStore((s) => s.session.fryer[index] ?? null)
  const warmerFull = useGameStore((s) => s.session.warmer.length >= FRYER.warmerCapacity)
  const take = useGameStore((s) => s.takeFries)
  const stage = basket ? friesStage(basket.cook) : null
  return (
    <Button
      variant={stage === 'burnt' ? 'primary' : 'green'}
      disabled={!basket || stage === 'cooking' || (stage === 'ready' && warmerFull)}
      onClick={() => take(index)}
      className="w-[104px] !rounded-xl !border-[3px] !px-2 !py-1 !text-sm"
      aria-label={`${stage === 'burnt' ? 'Jogar batata queimada no lixo' : 'Tirar batata do óleo'} (cesto ${index + 1})`}
    >
      {stage === 'burnt' ? 'Lixo' : 'Tirar'}
    </Button>
  )
}

function Warmer() {
  const warmer = useGameStore((s) => s.session.warmer)
  const trayHasFries = useGameStore((s) => s.session.tray.fries !== null)
  const toTray = useGameStore((s) => s.friesToTray)

  return (
    <div className="flex items-center gap-2 rounded-[20px] border-4 border-ink bg-gradient-to-b from-[#FFB347] to-[#E8731A] p-2 shadow-[inset_0_0_18px_rgba(255,230,150,.7),0_4px_0_rgba(59,31,14,.4)]">
      <span className="font-display text-sm leading-none text-ink [writing-mode:vertical-rl] rotate-180">Estufa</span>
      <div className="flex gap-1.5">
        {Array.from({ length: FRYER.warmerCapacity }, (_, i) => {
          const portion = warmer[i]
          const stale = portion ? friesQuality(portion.age) === 'stale' : false
          return (
            <div key={i} className="relative flex h-[62px] w-[44px] items-end justify-center rounded-xl border-[3px] border-ink/60 bg-black/15">
              <AnimatePresence>
                {portion && (
                  <motion.button
                    key={`p${i}`}
                    type="button"
                    aria-label={stale ? 'Pôr batata murcha na bandeja' : 'Pôr batata na bandeja'}
                    disabled={trayHasFries}
                    onClick={() => toTray(i)}
                    className={`flex h-full w-full flex-col items-center justify-end pb-1 ${trayHasFries ? 'opacity-60' : ''}`}
                    initial={{ scale: 0, y: -20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0, opacity: 0, transition: { duration: 0.15 } }}
                    whileTap={{ scale: 0.88 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                  >
                    <FriesCarton stale={stale} className="h-[50px] w-[40px]" />
                    <span className={`mt-px h-1.5 w-[34px] overflow-hidden rounded-full border border-ink bg-ink/30`}>
                      <span
                        className="block h-full"
                        style={{
                          width: `${Math.max(0, 1 - portion.age / FRYER.staleSeconds) * 100}%`,
                          background: stale ? '#9A9A9A' : '#5FB84A',
                        }}
                      />
                    </span>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function FryerPanel() {
  return (
    <div className="flex h-full flex-col gap-2">
      <div className="relative flex-1">
        <Fryer className="absolute inset-0 h-full w-full" />
        <div className="relative z-10 grid h-full grid-cols-2 place-items-center px-2 pt-2">
          {Array.from({ length: FRYER.baskets }, (_, i) => (
            <Basket key={i} index={i} />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 place-items-center px-2">
        {Array.from({ length: FRYER.baskets }, (_, i) => (
          <BasketButton key={i} index={i} />
        ))}
      </div>
      <div className="flex justify-center">
        <Warmer />
      </div>
    </div>
  )
}
