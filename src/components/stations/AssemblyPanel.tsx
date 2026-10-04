import { useEffect, useRef, useState } from 'react'
import { Plate, TrashIcon } from '@/art'
import { INGREDIENTS, INGREDIENT_IDS, TRAY_CATEGORIES, type IngredientId } from '@/game/config'
import { canAddIngredient, closingIngredient, isIngredientUnlocked } from '@/game/engine'
import { useGameStore } from '@/game/store'
import { BurgerPicture } from '../BurgerPicture'
import { Button } from '../Button'
import { HeldPlate } from '../HeldPlate'
import { IngredientTray } from '../IngredientTray'

type CategoryId = (typeof TRAY_CATEGORIES)[number]['id']

/** Ingredientes da categoria já liberados (a proteína vem da chapa; o pão de cima é um botão só, que combina com o de baixo). */
function itemsFor(category: CategoryId, level: number, closing: IngredientId | null): IngredientId[] {
  if (category === 'bun') {
    const bottoms = INGREDIENT_IDS.filter((id) => INGREDIENTS[id].role === 'base' && isIngredientUnlocked(id, level))
    return [...bottoms, closing ?? 'bunTop']
  }
  return INGREDIENT_IDS.filter((id) => INGREDIENTS[id].category === category && INGREDIENTS[id].role === 'topping' && isIngredientUnlocked(id, level))
}

export function AssemblyPanel() {
  const burger = useGameStore((s) => s.session.burger)
  const patties = useGameStore((s) => s.session.burgerPatties)
  const held = useGameStore((s) => s.session.held)
  const level = useGameStore((s) => s.session.level)
  const closing = useGameStore((s) => closingIngredient(s.session))
  const discard = useGameStore((s) => s.discard)
  const addHeldPatty = useGameStore((s) => s.addHeldPatty)
  const canPickPatty = held.some((h) => canAddIngredient(burger, h.id))

  const categories = TRAY_CATEGORIES.filter((c) => itemsFor(c.id, level, closing).length > 0)
  const [category, setCategory] = useState<CategoryId>('bun')
  // Lanche novo começa pelos pães; depois do pão de baixo, vai para os queijos.
  const wasEmpty = useRef(true)
  useEffect(() => {
    if (burger.length === 0 && !wasEmpty.current) setCategory('bun')
    if (burger.length === 1 && wasEmpty.current) setCategory(categories.some((c) => c.id === 'cheese') ? 'cheese' : 'bun')
    wasEmpty.current = burger.length === 0
  }, [burger.length, categories])
  const active = categories.some((c) => c.id === category) ? category : 'bun'
  const items = itemsFor(active, level, closing)

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="relative z-10 grid min-h-[130px] flex-1 grid-cols-[76px_1fr_90px] items-end gap-1.5">
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
            <BurgerPicture ingredients={burger} patties={patties} width={108} animated />
          </div>
          <Plate className="absolute bottom-0 w-full max-w-[190px]" />
        </div>
        <div className="flex justify-center self-end pb-1">
          <HeldPlate held={held} onPick={addHeldPatty} canPick={canPickPatty} />
        </div>
      </div>

      {categories.length > 1 && (
        <div className="flex gap-1" role="tablist" aria-label="Categorias de ingredientes">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={c.id === active}
              onClick={() => setCategory(c.id)}
              className={`flex-1 rounded-lg border-[3px] border-ink px-1 py-1 font-display text-[12px] leading-none ${
                c.id === active ? 'bg-mustard text-ink' : 'bg-toast-light text-white [text-shadow:0_1px_0_#3B1F0E]'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-5 gap-1.5">
        {items.map((id) => (
          <IngredientTray key={id} id={id} />
        ))}
      </div>
    </div>
  )
}
