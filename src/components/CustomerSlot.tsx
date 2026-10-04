import { AnimatePresence, motion } from 'framer-motion'
import { CustomerArt } from '@/art'
import { getRecipe, customerMood } from '@/game/engine'
import { useGameStore } from '@/game/store'
import { OrderBubble, OrderBubbleCompact } from './OrderBubble'

/** Largura do balão completo (px) e margem mínima até a borda da tela. */
const BUBBLE_WIDTH = 126
const EDGE_MARGIN = 4
const SIDE_PADDING = 8

/**
 * Um lugar do balcão. Com mais de 3 lugares, só o cliente selecionado mostra o balão completo;
 * os demais mostram um balão compacto (o lanche principal e a paciência).
 */
export function CustomerSlot({ slot, seats = 3, slotWidth = 130 }: { slot: number; seats?: number; slotWidth?: number }) {
  const customer = useGameStore((s) => s.session.slots[slot] ?? null)
  const selected = useGameStore((s) => s.session.selectedSlot === slot)
  const select = useGameStore((s) => s.selectSlot)
  const openReference = useGameStore((s) => s.openReference)
  const side = slot === 0 ? -1 : slot === seats - 1 ? 1 : 0
  const compact = seats > 3 && !selected
  // Balão grande num lugar estreito: sai do lugar para os lados e é puxado de volta para dentro da tela.
  const overflow = seats > 3 ? Math.max(0, BUBBLE_WIDTH / 2 + SIDE_PADDING - EDGE_MARGIN - (slotWidth / 2 + SIDE_PADDING)) : 0
  const shift = side === -1 ? overflow : side === 1 ? -overflow : 0
  const figureWidth = Math.min(customer?.companion ? 112 : 80, Math.max(46, slotWidth - 4))

  const reference = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!customer || customer.status !== 'waiting') return
    if (!selected) select(slot)
    if (!compact) openReference(slot)
  }

  return (
    <div className="relative flex h-full flex-col items-center justify-end" data-slot={slot}>
      <AnimatePresence>
        {customer && (
          <motion.div
            key={customer.id}
            role="button"
            tabIndex={0}
            aria-label={`Cliente ${slot + 1}: ${customer.order.burgers.map((id) => getRecipe(id).name).join(', ')}`}
            onClick={() => select(slot)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && select(slot)}
            className="absolute inset-0 flex cursor-pointer flex-col items-center justify-end outline-none"
            initial={{ x: side * 160 || 0, y: side ? 0 : 60, opacity: 0 }}
            animate={{ x: 0, y: 0, opacity: 1 }}
            exit={{
              x: customer.mood === 'angry' ? side * -200 || 0 : side * 200 || 0,
              y: side ? 0 : 80,
              opacity: 0,
              transition: { duration: 0.45, ease: 'easeIn' },
            }}
            transition={{ type: 'spring', stiffness: 180, damping: 18 }}
          >
            {/* balão do pedido: tocar nele mostra a montagem de referência */}
            <AnimatePresence>
              {customer.status === 'waiting' && (
                <motion.button
                  type="button"
                  aria-label="Ver a montagem do pedido"
                  onClick={reference}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: selected ? 1.07 : 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0, transition: { duration: 0.2 } }}
                  transition={{ type: 'spring', stiffness: 400, damping: 16 }}
                  style={seats > 3 ? { width: compact ? slotWidth - 4 : BUBBLE_WIDTH, x: shift, zIndex: selected ? 30 : 15 } : undefined}
                  className={`relative mb-1 flex origin-bottom flex-col items-center border-4 ${
                    seats > 3 ? '' : 'w-[98%] max-w-[126px]'
                  } ${compact ? 'rounded-xl px-1 pb-1 pt-1.5' : 'rounded-2xl px-1.5 pb-1.5 pt-2.5'} ${
                    selected ? 'border-tomato bg-white shadow-[0_0_0_4px_#F5B82E,0_6px_0_rgba(59,31,14,.3)]' : 'border-ink bg-cream shadow-[0_5px_0_rgba(59,31,14,.3)]'
                  }`}
                >
                  {compact ? <OrderBubbleCompact customer={customer} /> : <OrderBubble customer={customer} selected={selected} />}
                  <span
                    className={`absolute -bottom-[10px] h-4 w-4 -translate-x-1/2 rotate-45 border-b-4 border-r-4 ${
                      selected ? 'border-tomato bg-white' : 'border-ink bg-cream'
                    }`}
                    style={{ left: `calc(50% - ${shift}px)` }}
                  />
                </motion.button>
              )}
            </AnimatePresence>
            {/* cliente */}
            <motion.div
              className="-mb-6"
              style={{ width: figureWidth }}
              animate={
                customer.status === 'leaving'
                  ? customer.mood === 'happy'
                    ? { y: [0, -16, 0, -9, 0], rotate: [0, -4, 4, -2, 0] }
                    : customer.mood === 'angry'
                      ? { x: [0, -7, 7, -7, 7, 0], rotate: [0, -3, 3, -3, 0] }
                      : { y: [0, 3, 0] }
                  : customerMood(customer) === 'impatient'
                    ? { y: [0, -3, 0, -3, 0], x: [0, -1.5, 1.5, -1.5, 0] }
                    : { y: [0, -3, 0] }
              }
              transition={
                customer.status === 'leaving'
                  ? { duration: 0.9 }
                  : customerMood(customer) === 'impatient'
                    ? { duration: 0.7, repeat: Infinity }
                    : { duration: 2.4 + slot * 0.3, repeat: Infinity, ease: 'easeInOut' }
              }
            >
              <CustomerArt
                look={customer.look}
                type={customer.type}
                mood={customerMood(customer)}
                companion={customer.companion}
                className="w-full overflow-visible drop-shadow-[0_4px_0_rgba(59,31,14,.25)]"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
