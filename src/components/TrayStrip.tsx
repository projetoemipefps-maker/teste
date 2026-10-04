import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { BellIcon, Cup, DessertArt, SidePortion } from '@/art'
import { TRAY } from '@/game/config'
import { canServe, type TrayCategory } from '@/game/engine'
import { useGameStore } from '@/game/store'
import { BurgerPicture } from './BurgerPicture'
import { Button } from './Button'

const LABEL: Record<TrayCategory, string> = { burgers: 'Lanches', sides: 'Acomp.', drinks: 'Bebidas', desserts: 'Doces' }

/** Um compartimento da bandeja: mostra até 3 itens empilhados lado a lado e a contagem; o × tira o último. */
function Pod({ category, count, children }: { category: TrayCategory; count: number; children: ReactNode[] }) {
  const discard = useGameStore((s) => s.discardTray)
  const filled = count > 0
  return (
    <div
      className={`relative flex h-[60px] min-w-0 flex-1 items-end justify-center rounded-xl border-[3px] ${
        filled ? 'border-ink/70 bg-white/70' : 'border-dashed border-ink/35 bg-black/5'
      }`}
      data-tray={category}
    >
      {filled ? (
        <div className="flex h-full w-full items-end justify-center pb-1">
          <AnimatePresence initial={false}>{children}</AnimatePresence>
        </div>
      ) : (
        <span className="absolute inset-0 grid place-items-center font-display text-[11px] leading-none text-ink/40">{LABEL[category]}</span>
      )}
      {count > 1 && (
        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full border-2 border-ink bg-mustard px-1.5 font-display text-[10px] leading-tight text-ink">
          ×{count}/{TRAY[category]}
        </span>
      )}
      {filled && (
        <button
          type="button"
          aria-label={`Tirar o último item de ${LABEL[category].toLowerCase()} da bandeja`}
          onClick={() => discard(category)}
          className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full border-[3px] border-ink bg-tomato font-display text-[11px] leading-none text-white"
        >
          ×
        </button>
      )}
    </div>
  )
}

const pop = {
  initial: { y: -30, scale: 0.5, opacity: 0 },
  animate: { y: 0, scale: 1, opacity: 1 },
  exit: { y: 16, scale: 0.4, opacity: 0, transition: { duration: 0.16 } },
  transition: { type: 'spring' as const, stiffness: 420, damping: 16 },
}

/** Bandeja de entrega: sempre visível, com tudo o que já foi colocado. */
export function TrayStrip() {
  const tray = useGameStore((s) => s.session.tray)
  const serveable = useGameStore((s) => canServe(s.session))
  const serve = useGameStore((s) => s.serve)
  const showDesserts = useGameStore((s) => s.session.oven.length > 0 || s.session.tray.desserts.length > 0)
  const last = <T,>(items: readonly T[], n = 3): T[] => items.slice(-n)
  const offset = (i: number, total: number) => ({ marginLeft: i === 0 ? 0 : total > 2 ? -14 : -6 })

  return (
    <section className="relative z-30 flex items-center gap-2 border-b-4 border-ink bg-gradient-to-b from-[#EDE6D6] to-[#D6CDB8] px-2.5 py-2">
      <div className="flex min-w-0 flex-1 gap-2 rounded-2xl border-4 border-ink bg-[#C9C0AA] p-1.5 shadow-[inset_0_3px_0_rgba(255,255,255,.4)]">
        <Pod category="burgers" count={tray.burgers.length}>
          {last(tray.burgers, 2).map((b, i, arr) => (
            <motion.div key={`b${tray.burgers.length - arr.length + i}`} {...pop} style={offset(i, arr.length)}>
              <BurgerPicture ingredients={b.ingredients} patties={b.patties} width={tray.burgers.length > 1 ? 36 : 46} />
            </motion.div>
          ))}
        </Pod>
        <Pod category="sides" count={tray.sides.length}>
          {last(tray.sides).map((s, i, arr) => (
            <motion.div key={`s${tray.sides.length - arr.length + i}`} {...pop} style={offset(i, arr.length)}>
              <SidePortion id={s.id} stale={s.quality === 'stale'} className="h-[44px] w-[32px]" />
            </motion.div>
          ))}
        </Pod>
        <Pod category="drinks" count={tray.drinks.length}>
          {last(tray.drinks).map((d, i, arr) => (
            <motion.div key={`d${tray.drinks.length - arr.length + i}`} {...pop} style={offset(i, arr.length)}>
              <Cup id={`tray-${i}`} kind={d.kind} size={d.size} level={d.quality === 'low' ? 0.5 : 1} className="h-[46px] w-[34px] overflow-visible" />
            </motion.div>
          ))}
        </Pod>
        {showDesserts && (
          <Pod category="desserts" count={tray.desserts.length}>
            {last(tray.desserts).map((d, i, arr) => (
              <motion.div key={`x${tray.desserts.length - arr.length + i}`} {...pop} style={offset(i, arr.length)}>
                <DessertArt id={d.id} className="h-[44px] w-[32px]" />
              </motion.div>
            ))}
          </Pod>
        )}
      </div>
      <Button variant="green" onClick={serve} disabled={!serveable} className="!flex-col !gap-0 !rounded-xl !px-2.5 !py-1.5 !text-base" aria-label="Entregar pedido">
        <BellIcon className="h-6 w-6" />
        <span>Entregar</span>
      </Button>
    </section>
  )
}
