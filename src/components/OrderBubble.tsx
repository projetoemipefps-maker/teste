import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { CheckIcon, Cup, FriesCarton } from '@/art'
import { getRecipe, patienceRatio, type Customer } from '@/game/engine'
import { useGameStore } from '@/game/store'
import { BurgerPicture } from './BurgerPicture'
import { PatienceBar } from './PatienceBar'

function Item({ placed, children }: { placed: boolean; children: ReactNode }) {
  return (
    <div className="relative flex items-end">
      {children}
      {placed && (
        <motion.span
          className="absolute -right-2 -top-2.5 grid h-[18px] w-[18px] place-items-center rounded-full border-[3px] border-ink bg-leaf"
          initial={{ scale: 0, rotate: -40 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 600, damping: 14 }}
          aria-label="Já está na bandeja"
        >
          <CheckIcon className="h-3 w-3" />
        </motion.span>
      )}
    </div>
  )
}

/** Balão do pedido: um desenho por item; os que já estão na bandeja ganham um check. */
export function OrderBubble({ customer, selected }: { customer: Customer; selected: boolean }) {
  const tray = useGameStore((s) => s.session.tray)
  const { order } = customer
  const recipe = getRecipe(order.recipeId)
  const extras = (order.fries ? 1 : 0) + (order.drink ? 1 : 0)
  // Só o cliente selecionado "usa" a bandeja.
  const has = (item: 'burger' | 'fries' | 'drink') => selected && tray[item] !== null

  return (
    <div className="flex w-full flex-col items-center gap-0.5">
      <div className="flex h-[54px] items-end justify-center gap-1.5">
        <Item placed={has('burger')}>
          <BurgerPicture ingredients={recipe.ingredients} width={extras ? 36 : 56} />
        </Item>
        {order.fries && (
          <Item placed={has('fries')}>
            <FriesCarton className="h-[36px] w-[30px]" />
          </Item>
        )}
        {order.drink && (
          <Item placed={has('drink')}>
            <Cup id={`bubble-${customer.id}`} size={order.drink} level={1} className="h-[40px] w-[30px] overflow-visible" />
          </Item>
        )}
      </div>
      <span className="font-display text-[13px] leading-none text-ink">{recipe.name}</span>
      <PatienceBar ratio={patienceRatio(customer)} />
    </div>
  )
}
