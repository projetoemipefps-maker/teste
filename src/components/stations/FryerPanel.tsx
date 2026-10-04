import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { Fryer, SidePortion } from '@/art'
import { COOKABLES, SIDE_IDS, TRAY, type SideId } from '@/game/config'
import { equipmentTier, storedQuality, unlockedSides } from '@/game/engine'
import { useGameStore } from '@/game/store'
import { COOKABLE_SHORT, CookerButton, CookerSlot } from './CookerSlot'

function Warmer() {
  const warmer = useGameStore((s) => s.session.warmer)
  const capacity = useGameStore((s) => s.session.perks.warmerSize)
  const trayFull = useGameStore((s) => s.session.tray.sides.length >= TRAY.sides)
  const toTray = useGameStore((s) => s.storedToTray)

  return (
    <div className="flex items-center gap-2 rounded-[20px] border-4 border-ink bg-gradient-to-b from-[#FFB347] to-[#E8731A] p-2 shadow-[inset_0_0_18px_rgba(255,230,150,.7),0_4px_0_rgba(59,31,14,.4)]">
      <span className="font-display text-sm leading-none text-ink [writing-mode:vertical-rl] rotate-180">Estufa</span>
      <div className={`flex ${capacity > 4 ? 'gap-1' : 'gap-1.5'}`}>
        {Array.from({ length: capacity }, (_, i) => {
          const portion = warmer[i]
          const cfg = portion ? COOKABLES[portion.kind] : null
          const stale = portion ? storedQuality(portion.kind, portion.age) === 'stale' : false
          return (
            <div key={i} className={`relative flex h-[62px] items-end justify-center rounded-xl border-[3px] border-ink/60 bg-black/15 ${capacity > 4 ? 'w-[40px]' : 'w-[44px]'}`}>
              <AnimatePresence>
                {portion && cfg && (
                  <motion.button
                    key={`p${i}-${portion.kind}`}
                    type="button"
                    aria-label={`Pôr ${cfg.name.toLowerCase()}${stale ? ' murcho' : ''} na bandeja`}
                    disabled={trayFull}
                    onClick={() => toTray('fryer', i)}
                    className={`flex h-full w-full flex-col items-center justify-end pb-1 ${trayFull ? 'opacity-60' : ''}`}
                    initial={{ scale: 0, y: -20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0, opacity: 0, transition: { duration: 0.15 } }}
                    whileTap={{ scale: 0.88 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                  >
                    <SidePortion id={portion.kind as SideId} stale={stale} className={capacity > 4 ? 'h-[46px] w-[36px]' : 'h-[50px] w-[40px]'} />
                    <span className="mt-px h-1.5 w-[34px] overflow-hidden rounded-full border border-ink bg-ink/30">
                      <span
                        className="block h-full"
                        style={{
                          width: `${cfg.staleSeconds ? Math.max(0, 1 - portion.age / cfg.staleSeconds) * 100 : 100}%`,
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
  const baskets = useGameStore((s) => s.session.fryer.length)
  const level = useGameStore((s) => s.session.level)
  const sides = unlockedSides(level)
  const [choice, setChoice] = useState<SideId>('fries')
  const kind = sides.includes(choice) ? choice : 'fries'
  const size = baskets >= 4 ? 70 : sides.length > 1 ? 88 : 100
  const tier = useGameStore((s) => equipmentTier(s.player, 'fryer'))

  return (
    <div className="flex h-full flex-col gap-1.5">
      {sides.length > 1 && (
        <div className="flex gap-1" role="tablist" aria-label="Acompanhamento para a fritadeira">
          {SIDE_IDS.filter((id) => sides.includes(id)).map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={id === kind}
              onClick={() => setChoice(id)}
              className={`flex-1 rounded-lg border-[3px] border-ink px-0.5 py-1 font-display text-[11px] leading-none ${
                id === kind ? 'bg-mustard text-ink' : 'bg-toast-light text-white [text-shadow:0_1px_0_#3B1F0E]'
              }`}
            >
              {COOKABLE_SHORT[id]}
            </button>
          ))}
        </div>
      )}
      <div className="relative min-h-0 flex-1">
        <Fryer tier={tier} className="absolute inset-0 h-full w-full" />
        <div className="relative z-10 flex h-full items-center justify-around px-2 pt-2">
          {Array.from({ length: baskets }, (_, i) => (
            <CookerSlot key={i} station="fryer" index={i} kind={kind} size={size} />
          ))}
        </div>
      </div>
      <div className="flex justify-around px-2">
        {Array.from({ length: baskets }, (_, i) => (
          <CookerButton key={i} station="fryer" index={i} narrow={baskets >= 4} />
        ))}
      </div>
      <div className="flex justify-center">
        <Warmer />
      </div>
    </div>
  )
}
