import { AnimatePresence, motion } from 'framer-motion'
import { CustomerArt } from '@/art'
import { getRecipe } from '@/game/engine'
import { useGameStore } from '@/game/store'
import { OrderBubble } from './OrderBubble'

export function CustomerSlot({ slot }: { slot: number }) {
  const customer = useGameStore((s) => s.session.slots[slot] ?? null)
  const selected = useGameStore((s) => s.session.selectedSlot === slot)
  const select = useGameStore((s) => s.selectSlot)
  const side = slot === 0 ? -1 : slot === 2 ? 1 : 0

  return (
    <div className="relative flex h-full flex-col items-center justify-end" data-slot={slot}>
      <AnimatePresence>
        {customer && (
          <motion.button
            key={customer.id}
            type="button"
            aria-label={`Cliente ${slot + 1}: ${getRecipe(customer.order.recipeId).name}`}
            onClick={() => select(slot)}
            className="absolute inset-0 flex flex-col items-center justify-end outline-none"
            initial={{ x: side * 160 || 0, y: side ? 0 : 60, opacity: 0 }}
            animate={{ x: 0, y: 0, opacity: 1 }}
            exit={{ x: customer.mood === 'angry' ? side * -200 || 0 : side * 200 || 0, y: side ? 0 : 80, opacity: 0, transition: { duration: 0.45, ease: 'easeIn' } }}
            transition={{ type: 'spring', stiffness: 180, damping: 18 }}
          >
            {/* balão do pedido */}
            <AnimatePresence>
              {customer.status === 'waiting' && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: selected ? 1.07 : 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0, transition: { duration: 0.2 } }}
                  transition={{ type: 'spring', stiffness: 400, damping: 16 }}
                  className={`relative mb-1 flex w-[98%] max-w-[126px] origin-bottom flex-col items-center rounded-2xl border-4 px-1.5 pb-1.5 pt-2.5 ${
                    selected ? 'border-tomato bg-white shadow-[0_0_0_4px_#F5B82E,0_6px_0_rgba(59,31,14,.3)]' : 'border-ink bg-cream shadow-[0_5px_0_rgba(59,31,14,.3)]'
                  }`}
                >
                  <OrderBubble customer={customer} selected={selected} />
                  <span
                    className={`absolute -bottom-[10px] left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-b-4 border-r-4 ${
                      selected ? 'border-tomato bg-white' : 'border-ink bg-cream'
                    }`}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            {/* cliente */}
            <motion.div
              className="-mb-6 w-[80px]"
              animate={
                customer.status === 'leaving'
                  ? customer.mood === 'happy'
                    ? { y: [0, -16, 0, -9, 0], rotate: [0, -4, 4, -2, 0] }
                    : { x: [0, -7, 7, -7, 7, 0], rotate: [0, -3, 3, -3, 0] }
                  : { y: [0, -3, 0] }
              }
              transition={
                customer.status === 'leaving'
                  ? { duration: 0.9 }
                  : { duration: 2.4 + slot * 0.3, repeat: Infinity, ease: 'easeInOut' }
              }
            >
              <CustomerArt variant={customer.variant} mood={customer.mood} className="w-full overflow-visible drop-shadow-[0_4px_0_rgba(59,31,14,.25)]" />
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
