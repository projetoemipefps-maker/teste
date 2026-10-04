import { BellIcon, Plate, TrashIcon } from '@/art'
import { TRAY_ORDER } from '@/game/config'
import { canServe } from '@/game/engine'
import { useGameStore } from '@/game/store'
import { BurgerPicture } from './BurgerPicture'
import { Button } from './Button'
import { IngredientTray } from './IngredientTray'

export function Workbench() {
  const burger = useGameStore((s) => s.session.burger)
  const serveable = useGameStore((s) => canServe(s.session))
  const discard = useGameStore((s) => s.discard)
  const serve = useGameStore((s) => s.serve)

  return (
    <section
      className="relative flex flex-[1.35] flex-col gap-2.5 px-3 pb-3 pt-2"
      style={{
        background:
          'repeating-linear-gradient(90deg, rgba(0,0,0,.05) 0 3px, transparent 3px 46px), linear-gradient(#C98A4B, #B4743A)',
      }}
    >
      <div className="relative z-10 grid min-h-[150px] grid-cols-[80px_1fr_80px] items-end gap-2">
        <Button variant="brown" onClick={discard} disabled={burger.length === 0} className="!flex-col !gap-0.5 !rounded-xl !px-0.5 !py-2 !text-xs" aria-label="Descartar lanche">
          <TrashIcon className="h-6 w-6" />
          <span>Descartar</span>
        </Button>
        <div className="relative flex h-[150px] min-w-0 flex-col items-center justify-end" data-burger>
          <div className="relative z-10 mb-[10px]">
            <BurgerPicture ingredients={burger} width={124} animated />
          </div>
          <Plate className="absolute bottom-0 w-full max-w-[200px]" />
        </div>
        <Button variant="green" onClick={serve} disabled={!serveable} className="!flex-col !gap-0.5 !rounded-xl !px-0.5 !py-2 !text-xs" aria-label="Entregar lanche">
          <BellIcon className="h-6 w-6" />
          <span>Entregar</span>
        </Button>
      </div>
      <div className="mt-auto grid grid-cols-3 gap-2.5">
        {TRAY_ORDER.map((id) => (
          <IngredientTray key={id} id={id} />
        ))}
      </div>
    </section>
  )
}
