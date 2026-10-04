import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { CheckIcon, Cup, DessertArt, SidePortion } from '@/art'
import { CUSTOMER_TYPES, DRINK_CONFIG, DRINKS, COOKABLES, DESSERTS } from '@/game/config'
import { getRecipe, patienceRatio, type Customer, type Tray } from '@/game/engine'
import { matchesRecipe } from '@/game/engine'
import { useGameStore } from '@/game/store'
import { BurgerPicture } from './BurgerPicture'
import { PatienceBar } from './PatienceBar'

/** Quanto mais itens distintos no pedido, menores os desenhos, para o balão caber sempre na mesma área. */
type Size = 'solo' | 'big' | 'medium' | 'small' | 'tiny'

interface Dims {
  /** Largura e altura máxima do hambúrguer. */
  burger: number
  burgerH: number
  /** Largura e altura dos demais itens. */
  w: number
  h: number
}

const DIMS: Record<Size, Dims> = {
  solo: { burger: 56, burgerH: 52, w: 36, h: 44 },
  big: { burger: 38, burgerH: 50, w: 30, h: 40 },
  medium: { burger: 32, burgerH: 40, w: 26, h: 34 },
  small: { burger: 24, burgerH: 26, w: 20, h: 25 },
  tiny: { burger: 17, burgerH: 18, w: 15, h: 18 },
}

const sizeFor = (groups: number): Size => (groups <= 1 ? 'solo' : groups === 2 ? 'big' : groups === 3 ? 'medium' : groups <= 8 ? 'small' : 'tiny')

interface Group {
  key: string
  count: number
  placed: number
  art: (d: Dims) => ReactNode
  name: string
}

const Box = ({ d, children }: { d: Dims; children: ReactNode }) => <div style={{ width: d.w, height: d.h }}>{children}</div>

/** Agrupa o pedido por item (2 hambúrgueres iguais viram "×2") e conta quantos já estão certos na bandeja. */
function groupsOf(customer: Customer, tray: Tray, selected: boolean): Group[] {
  const { order } = customer
  const groups: Group[] = []
  const add = (key: string, name: string, art: Group['art'], placedCount: number) => {
    const existing = groups.find((g) => g.key === key)
    if (existing) existing.count += 1
    else groups.push({ key, name, art, count: 1, placed: selected ? placedCount : 0 })
  }
  for (const id of order.burgers) {
    const recipe = getRecipe(id)
    const inTray = tray.burgers.filter((b) => matchesRecipe(b.ingredients, recipe)).length
    add(`b-${id}`, recipe.name, (d) => <BurgerPicture ingredients={recipe.ingredients} width={d.burger} maxHeight={d.burgerH} />, inTray)
  }
  for (const id of order.sides) {
    add(`s-${id}`, COOKABLES[id].name, (d) => <Box d={d}><SidePortion id={id} className="h-full w-full" /></Box>, tray.sides.filter((s) => s.id === id).length)
  }
  for (const d of order.drinks) {
    add(
      `d-${d.kind}-${d.size}`,
      `${DRINK_CONFIG[d.kind].name} (${DRINKS.cups[d.size].name.toLowerCase()})`,
      (dims) => (
        <Box d={dims}>
          <Cup id={`bubble-${customer.id}-${d.kind}-${d.size}`} kind={d.kind} size={d.size} level={1} className="h-full w-full overflow-visible" />
        </Box>
      ),
      tray.drinks.filter((t) => t.kind === d.kind && t.size === d.size).length,
    )
  }
  for (const id of order.desserts) {
    add(`x-${id}`, DESSERTS[id].name, (d) => <Box d={d}><DessertArt id={id} className="h-full w-full" /></Box>, tray.desserts.filter((t) => t.id === id).length)
  }
  return groups
}

const TYPE_COLOR: Record<string, string> = {
  hurried: 'bg-orange text-white',
  kid: 'bg-[#6FA8DC] text-white',
  family: 'bg-leaf text-white',
  indecisive: 'bg-[#8E6BC9] text-white',
  influencer: 'bg-[#E86FA0] text-white',
  critic: 'bg-[#2F3340] text-[#FFD866]',
}

function Item({ group, size }: { group: Group; size: Size }) {
  const done = group.placed >= group.count
  const tiny = size === 'small' || size === 'tiny'
  const badge = `absolute -left-1 rounded-full border-2 border-ink bg-cream font-display leading-tight text-ink ${tiny ? '-top-1.5 px-0.5 text-[8px]' : '-bottom-1 px-1 text-[10px]'}`
  return (
    <div className="relative flex items-end" title={group.name}>
      {group.art(DIMS[size])}
      {group.count > 1 && (
        <span className={badge}>{done ? `×${group.count}` : `${group.placed}/${group.count}`}</span>
      )}
      {done && (
        <motion.span
          className={`absolute grid place-items-center rounded-full border-ink bg-leaf ${tiny ? '-right-1.5 -top-2 h-[14px] w-[14px] border-2' : '-right-2 -top-2.5 h-[18px] w-[18px] border-[3px]'}`}
          initial={{ scale: 0, rotate: -40 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 600, damping: 14 }}
          aria-label="Já está na bandeja"
        >
          <CheckIcon className={tiny ? 'h-2 w-2' : 'h-3 w-3'} />
        </motion.span>
      )}
    </div>
  )
}

/** Balão do pedido: um desenho por item; os que já estão (certos) na bandeja ganham um check. */
export function OrderBubble({ customer, selected }: { customer: Customer; selected: boolean }) {
  const tray = useGameStore((s) => s.session.tray)
  const groups = groupsOf(customer, tray, selected)
  const size = sizeFor(groups.length)
  const { order } = customer
  const title = order.burgers.length === 1 ? getRecipe(order.burgers[0]!).name : `${order.burgers.length} lanches`
  const signature = JSON.stringify(order)
  const type = CUSTOMER_TYPES[customer.type]

  return (
    <div className="flex w-full flex-col items-center gap-0.5">
      {customer.type !== 'normal' && (
        <span className={`absolute -top-3.5 left-1 z-10 rounded-full border-2 border-ink px-1.5 py-px font-display text-[9.5px] leading-tight ${TYPE_COLOR[customer.type] ?? ''}`}>
          {type.tag}
        </span>
      )}
      <motion.div
        key={signature}
        className={`flex flex-wrap items-end justify-center gap-x-1.5 ${size === 'tiny' ? 'min-h-[54px] content-center gap-y-0.5' : 'min-h-[54px] content-end gap-y-1.5'}`}
        initial={customer.changedMind ? { scale: 0.5, rotate: -10 } : false}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 420, damping: 12 }}
      >
        {groups.map((g) => (
          <Item key={g.key} group={g} size={size} />
        ))}
      </motion.div>
      <span className={`whitespace-nowrap text-center font-display leading-none text-ink ${title.length > 11 ? 'text-[11px]' : 'text-[12.5px]'}`}>{title}</span>
      <PatienceBar ratio={patienceRatio(customer)} />
    </div>
  )
}
