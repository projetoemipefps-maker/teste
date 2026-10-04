import { Cup, FriesCarton, IngredientArt } from '@/art'
import { getRecipe, type MenuItem } from '@/game/engine'
import type { StockId } from '@/game/config'
import { BurgerPicture } from './BurgerPicture'

/** Desenho de um item do estoque (para a tela de compra). */
export function StockArt({ id, className = 'h-11 w-14' }: { id: StockId; className?: string }) {
  switch (id) {
    case 'bun':
      return <IngredientArt id="bunTop" className={`${className} overflow-visible`} />
    case 'patty':
      return <IngredientArt id="patty" className={`${className} overflow-visible`} />
    case 'cheese':
    case 'lettuce':
    case 'tomato':
      return <IngredientArt id={id} className={`${className} overflow-visible`} />
    case 'potato':
      return <FriesCarton className="h-11 w-10" />
    case 'soda':
      return <Cup id="stock-soda" size="large" level={1} className="h-12 w-10 overflow-visible" />
  }
}

/** Desenho de um item do cardápio. */
export function MenuArt({ item }: { item: MenuItem }) {
  if (item.kind === 'burger' && item.recipeId) {
    return <BurgerPicture ingredients={getRecipe(item.recipeId).ingredients} width={50} />
  }
  if (item.kind === 'fries') return <FriesCarton className="h-11 w-10" />
  return <Cup id={`menu-${item.key}`} size={item.size ?? 'medium'} level={1} className="h-12 w-10 overflow-visible" />
}
