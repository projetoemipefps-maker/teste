import { TrashIcon, Plate } from '@/art'
import { INGREDIENTS, type IngredientId } from '@/game/config'
import { canAddIngredient } from '@/game/engine'
import { useGameStore } from '@/game/store'
import { BurgerPicture } from '../BurgerPicture'
import { Button } from '../Button'
import { HeldPlate } from '../HeldPlate'
import { IngredientTray } from '../IngredientTray'

/** Ingredientes que vêm direto da bancada (a carne vem da chapa, pelo prato). */
const TRAYS: readonly IngredientId[] = (Object.keys(INGREDIENTS) as IngredientId[]).filter((id) => id !== 'patty')

export function AssemblyPanel() {
  const burger = useGameStore((s) => s.session.burger)
  const patties = useGameStore((s) => s.session.burgerPatties)
  const held = useGameStore((s) => s.session.held)
  const discard = useGameStore((s) => s.discard)
  const addHeldPatty = useGameStore((s) => s.addHeldPatty)
  const canPickPatty = canAddIngredient(burger, 'patty')

  return (
    <div className="flex h-full flex-col gap-2.5">
      <div className="relative z-10 grid min-h-[150px] flex-1 grid-cols-[76px_1fr_90px] items-end gap-1.5">
        <Button
          variant="brown"
          onClick={discard}
          disabled={burger.length === 0}
          className="!flex-col !gap-0.5 !rounded-xl !px-0.5 !py-2 !text-xs"
          aria-label="Descartar lanche"
        >
          <TrashIcon className="h-6 w-6" />
          <span>Descartar</span>
        </Button>
        <div className="relative flex h-full min-w-0 flex-col items-center justify-end" data-burger>
          <div className="relative z-10 mb-[10px]">
            <BurgerPicture ingredients={burger} patties={patties} width={118} animated />
          </div>
          <Plate className="absolute bottom-0 w-full max-w-[190px]" />
        </div>
        <div className="flex justify-center self-end pb-1">
          <HeldPlate held={held} onPick={addHeldPatty} canPick={canPickPatty} />
        </div>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {TRAYS.map((id) => (
          <IngredientTray key={id} id={id} />
        ))}
      </div>
    </div>
  )
}
