import { Cup, DessertArt, SidePortion } from '@/art'
import { COOKABLES, CUSTOMER_TYPES, DESSERTS, DRINK_CONFIG, DRINKS, INGREDIENTS } from '@/game/config'
import { getRecipe, type Customer } from '@/game/engine'
import { BurgerPicture } from './BurgerPicture'

/** Passo a passo de uma receita, de baixo para cima. */
export function RecipeSteps({ recipeId, width = 84 }: { recipeId: string; width?: number }) {
  const recipe = getRecipe(recipeId)
  return (
    <div className="flex items-end gap-3">
      <div className="flex shrink-0 items-end" style={{ minWidth: width }}>
        <BurgerPicture ingredients={recipe.ingredients} width={width} />
      </div>
      <ol className="flex flex-col-reverse gap-0.5 text-left text-[13px] leading-tight text-ink">
        {recipe.ingredients.map((id, i) => {
          const ing = INGREDIENTS[id]
          return (
            <li key={i} className="flex items-center gap-1.5">
              <span className="grid h-4 w-4 place-items-center rounded-full bg-ink/10 text-[10px]">{i + 1}</span>
              <span>{ing.name}</span>
              {ing.role === 'protein' && <span className="rounded-full bg-orange px-1.5 text-[9px] text-white">chapa</span>}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/** Montagem de referência do pedido de um cliente (o que cada lanche leva e os demais itens). */
export function OrderReference({ customer }: { customer: Customer }) {
  const { order } = customer
  const distinct = [...new Set(order.burgers)]
  return (
    <div className="flex flex-col gap-3 text-left">
      <p className="text-center text-sm text-ink/70">
        {CUSTOMER_TYPES[customer.type].name}
        {customer.changedMind ? ' · mudou de ideia!' : ''}
      </p>
      {distinct.map((id) => {
        const recipe = getRecipe(id)
        const count = order.burgers.filter((b) => b === id).length
        return (
          <div key={id} className="rounded-2xl border-[3px] border-ink bg-white p-2">
            <p className="mb-1 font-display text-lg leading-none text-ink">
              {recipe.name}
              {count > 1 && <span className="ml-1 text-tomato">×{count}</span>}
            </p>
            <RecipeSteps recipeId={id} />
          </div>
        )
      })}
      {(order.sides.length > 0 || order.drinks.length > 0 || order.desserts.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {order.sides.map((id, i) => (
            <span key={`s${i}`} className="flex items-center gap-1 rounded-xl border-[3px] border-ink bg-white px-2 py-1 text-[13px] text-ink">
              <SidePortion id={id} className="h-8 w-6" /> {COOKABLES[id].name}
            </span>
          ))}
          {order.drinks.map((d, i) => (
            <span key={`d${i}`} className="flex items-center gap-1 rounded-xl border-[3px] border-ink bg-white px-2 py-1 text-[13px] text-ink">
              <Cup id={`ref-${i}`} kind={d.kind} size={d.size} className="h-8 w-6 overflow-visible" /> {DRINK_CONFIG[d.kind].name} ({DRINKS.cups[d.size].name.toLowerCase()})
            </span>
          ))}
          {order.desserts.map((id, i) => (
            <span key={`x${i}`} className="flex items-center gap-1 rounded-xl border-[3px] border-ink bg-white px-2 py-1 text-[13px] text-ink">
              <DessertArt id={id} className="h-8 w-6" /> {DESSERTS[id].name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
