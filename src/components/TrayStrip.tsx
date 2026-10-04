import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { BellIcon, Cup, FriesCarton } from '@/art'
import { canServe, type TrayItem } from '@/game/engine'
import { useGameStore } from '@/game/store'
import { BurgerPicture } from './BurgerPicture'
import { Button } from './Button'

function Slot({ item, label, filled, children }: { item: TrayItem; label: string; filled: boolean; children: ReactNode }) {
  const discard = useGameStore((s) => s.discardTray)
  return (
    <div
      className={`relative flex h-[60px] flex-1 items-end justify-center rounded-xl border-[3px] ${
        filled ? 'border-ink/70 bg-white/70' : 'border-dashed border-ink/35 bg-black/5'
      }`}
    >
      <AnimatePresence>
        {filled ? (
          <motion.div
            key="item"
            className="flex h-full w-full items-end justify-center pb-1"
            initial={{ y: -36, scale: 0.5, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 20, scale: 0.4, opacity: 0, transition: { duration: 0.18 } }}
            transition={{ type: 'spring', stiffness: 420, damping: 16 }}
          >
            {children}
          </motion.div>
        ) : (
          <motion.span
            key="empty"
            className="absolute inset-0 grid place-items-center font-display text-[11px] leading-none text-ink/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
      {filled && (
        <button
          type="button"
          aria-label={`Tirar ${label.toLowerCase()} da bandeja`}
          onClick={() => discard(item)}
          className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full border-[3px] border-ink bg-tomato font-display text-[11px] leading-none text-white"
        >
          ×
        </button>
      )}
    </div>
  )
}

/** Bandeja de entrega: sempre visível, com tudo o que já foi colocado. */
export function TrayStrip() {
  const tray = useGameStore((s) => s.session.tray)
  const serveable = useGameStore((s) => canServe(s.session))
  const serve = useGameStore((s) => s.serve)

  return (
    <section className="relative z-30 flex items-center gap-2 border-b-4 border-ink bg-gradient-to-b from-[#EDE6D6] to-[#D6CDB8] px-2.5 py-2">
      <div className="flex flex-1 gap-2.5 rounded-2xl border-4 border-ink bg-[#C9C0AA] p-1.5 shadow-[inset_0_3px_0_rgba(255,255,255,.4)]">
        <Slot item="burger" label="Lanche" filled={!!tray.burger}>
          {tray.burger && <BurgerPicture ingredients={tray.burger.ingredients} patties={tray.burger.patties} width={50} />}
        </Slot>
        <Slot item="fries" label="Batata" filled={!!tray.fries}>
          {tray.fries && <FriesCarton stale={tray.fries.quality === 'stale'} className="h-[46px] w-[40px]" />}
        </Slot>
        <Slot item="drink" label="Bebida" filled={!!tray.drink}>
          {tray.drink && (
            <Cup
              id="tray"
              size={tray.drink.size}
              level={tray.drink.quality === 'low' ? 0.5 : 1}
              className="h-[50px] w-[40px] overflow-visible"
            />
          )}
        </Slot>
      </div>
      <Button variant="green" onClick={serve} disabled={!serveable} className="!flex-col !gap-0 !rounded-xl !px-2.5 !py-1.5 !text-base" aria-label="Entregar pedido">
        <BellIcon className="h-6 w-6" />
        <span>Entregar</span>
      </Button>
    </section>
  )
}
