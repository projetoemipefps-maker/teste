import { Cup, DessertArt, IngredientArt, SidePortion } from '@/art'
import { DRINK_CONFIG, INGREDIENTS, type DrinkKind, type IngredientId, type StockId } from '@/game/config'
import { getRecipe, type MenuItem } from '@/game/engine'
import { BurgerPicture } from './BurgerPicture'

const STOCK_INGREDIENT: Partial<Record<StockId, IngredientId>> = {
  bun: 'bunTop',
  brioche: 'briocheTop',
  australian: 'australianTop',
  patty: 'patty',
  chicken: 'chicken',
  veggie: 'veggie',
  cheese: 'cheese',
  cheddar: 'cheddar',
  creamyCheddar: 'creamyCheddar',
  lettuce: 'lettuce',
  tomato: 'tomato',
  onion: 'onion',
  pickles: 'pickles',
  caramelizedOnion: 'caramelizedOnion',
  bacon: 'bacon',
  egg: 'egg',
  greenMayo: 'greenMayo',
  barbecue: 'barbecue',
}

const STOCK_DRINK: Partial<Record<StockId, DrinkKind>> = {
  soda: 'soda',
  juice: 'juice',
  shakeChocolate: 'shakeChocolate',
  shakeStrawberry: 'shakeStrawberry',
  shakeVanilla: 'shakeVanilla',
}

/** Desenho de um item do estoque (para a tela de compra). */
export function StockArt({ id }: { id: StockId }) {
  const ingredient = STOCK_INGREDIENT[id]
  if (ingredient) return <IngredientArt id={ingredient} className="h-11 w-14 overflow-visible" />
  const drink = STOCK_DRINK[id]
  if (drink) return <Cup id={`stock-${id}`} kind={drink} size="large" level={1} className="h-12 w-10 overflow-visible" />
  switch (id) {
    case 'potato':
      return <SidePortion id="fries" className="h-11 w-10" />
    case 'rusticPotato':
      return <SidePortion id="rustic" className="h-11 w-10" />
    case 'nuggets':
      return <SidePortion id="nuggets" className="h-11 w-10" />
    case 'onionRings':
      return <SidePortion id="rings" className="h-11 w-10" />
    case 'brownie':
      return <DessertArt id="brownie" className="h-11 w-10" />
    default:
      return <DessertArt id="iceCream" className="h-11 w-10" />
  }
}

/** Desenho de um item do cardápio. */
export function MenuArt({ item }: { item: MenuItem }) {
  if (item.kind === 'burger' && item.recipeId) return <BurgerPicture ingredients={getRecipe(item.recipeId).ingredients} width={50} />
  if (item.kind === 'side' && item.sideId) return <SidePortion id={item.sideId} className="h-11 w-10" />
  if (item.kind === 'dessert' && item.dessertId) return <DessertArt id={item.dessertId} className="h-11 w-10" />
  if (item.drink) return <Cup id={`menu-${item.key}`} kind={item.drink.kind} size={item.drink.size} level={1} className="h-12 w-10 overflow-visible" />
  return null
}

export const ingredientName = (id: IngredientId): string => INGREDIENTS[id].name
export const drinkName = (kind: DrinkKind): string => DRINK_CONFIG[kind].name
