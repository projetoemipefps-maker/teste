import { AnimatePresence, motion } from 'framer-motion'
import { DessertArt } from '@/art'
import { COOKABLES, DESSERTS, SHELF_CAPACITY, TRAY, UI_LIMITS } from '@/game/config'
import { hasStockFor } from '@/game/engine'
import { useGameStore } from '@/game/store'
import { CookerButton, CookerSlot } from './CookerSlot'

function Shelf() {
  const shelf = useGameStore((s) => s.session.shelf)
  const trayFull = useGameStore((s) => s.session.tray.desserts.length >= TRAY.desserts)
  const toTray = useGameStore((s) => s.storedToTray)
  return (
    <div className="flex items-center gap-2 rounded-[20px] border-4 border-ink bg-gradient-to-b from-[#FFE9B8] to-[#E8B76A] p-2 shadow-[0_4px_0_rgba(59,31,14,.4)]">
      <span className="font-display text-sm leading-none text-ink [writing-mode:vertical-rl] rotate-180">Vitrine</span>
      <div className="flex gap-1.5">
        {Array.from({ length: SHELF_CAPACITY }, (_, i) => {
          const item = shelf[i]
          return (
            <div key={i} className="relative flex h-[62px] w-[44px] items-end justify-center rounded-xl border-[3px] border-ink/50 bg-white/30">
              <AnimatePresence>
                {item && (
                  <motion.button
                    key={`s${i}`}
                    type="button"
                    aria-label="Pôr brownie na bandeja"
                    disabled={trayFull}
                    onClick={() => toTray('oven', i)}
                    className={`flex h-full w-full items-end justify-center pb-1 ${trayFull ? 'opacity-60' : ''}`}
                    initial={{ scale: 0, y: -20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0, opacity: 0, transition: { duration: 0.15 } }}
                    whileTap={{ scale: 0.88 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                  >
                    <DessertArt id="brownie" className="h-[50px] w-[40px]" />
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

function IceCream() {
  const level = useGameStore((s) => s.session.level)
  const stock = useGameStore((s) => s.session.stock.iceCream)
  const canServe = useGameStore((s) => hasStockFor(s.session.stock, DESSERTS.iceCream.stock) && s.session.tray.desserts.length < TRAY.desserts)
  const scoop = useGameStore((s) => s.scoopIceCream)
  if (level < DESSERTS.iceCream.unlockLevel) return null
  return (
    <motion.button
      type="button"
      aria-label="Servir sorvete"
      disabled={!canServe}
      onClick={scoop}
      whileTap={{ y: 4, boxShadow: '0 0 0 #3B1F0E' }}
      className={`flex flex-1 items-center gap-2 rounded-2xl border-4 border-ink bg-gradient-to-b from-[#FFD6E4] to-[#FFB6C8] px-2 py-1 ${canServe ? '' : 'opacity-50 grayscale'}`}
      style={{ boxShadow: '0 5px 0 #3B1F0E' }}
    >
      <DessertArt id="iceCream" className="h-[58px] w-[48px]" />
      <span className="text-left">
        <span className="block font-display text-lg leading-none text-ink">Servir sorvete</span>
        <span className={`mt-0.5 inline-block rounded-full px-2 text-[11px] leading-tight ${stock <= UI_LIMITS.lowStock ? 'bg-orange text-white' : 'bg-white/70 text-ink'}`}>
          {stock <= 0 ? 'Acabou' : `×${stock}`}
        </span>
      </span>
    </motion.button>
  )
}

export function DessertPanel() {
  const slots = useGameStore((s) => s.session.oven.length)
  return (
    <div className="flex h-full flex-col gap-2">
      {slots > 0 && (
        <>
          <div className="relative flex min-h-0 flex-1 items-center justify-around rounded-[24px] border-4 border-ink bg-gradient-to-b from-[#8A8F99] to-[#5D6169] px-2 py-3 shadow-[inset_0_6px_0_rgba(255,255,255,.15),0_5px_0_rgba(59,31,14,.4)]">
            <span className="absolute left-3 top-1 font-display text-xs text-white/80">Forno</span>
            {Array.from({ length: slots }, (_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <CookerSlot station="oven" index={i} kind="brownie" size={100} />
                <CookerButton station="oven" index={i} />
              </div>
            ))}
          </div>
          <div className="flex items-stretch justify-between gap-2">
            <Shelf />
            <IceCream />
          </div>
        </>
      )}
      <p className="sr-only">{COOKABLES.brownie.name}</p>
    </div>
  )
}
