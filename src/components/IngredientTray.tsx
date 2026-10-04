import { motion } from 'framer-motion'
import { INGREDIENTS, type IngredientId } from '@/game/config'
import { canAddToBurger } from '@/game/engine'
import { IngredientArt } from '@/art'
import { useGameStore } from '@/game/store'

export function IngredientTray({ id }: { id: IngredientId }) {
  const allowed = useGameStore((s) => canAddToBurger(s.session, id))
  const add = useGameStore((s) => s.addIngredient)

  return (
    <motion.button
      type="button"
      aria-label={`Adicionar ${INGREDIENTS[id].name}`}
      onClick={() => add(id)}
      className={`relative flex h-[72px] flex-col items-center justify-center rounded-xl border-4 border-ink bg-gradient-to-b from-[#FFF8EA] to-cream-dark px-0.5 pt-1.5 outline-none ${
        allowed ? '' : 'opacity-45 saturate-50'
      }`}
      style={{ boxShadow: '0 4px 0 #3B1F0E' }}
      whileHover={allowed ? { scale: 1.04 } : undefined}
      whileTap={{ y: 4, boxShadow: '0 0 0 #3B1F0E', scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 600, damping: 28 }}
    >
      <span className="pointer-events-none absolute inset-x-2.5 top-1 h-1 rounded-full bg-white/70" />
      <IngredientArt id={id} className="w-[48px] overflow-visible drop-shadow-[0_2px_0_rgba(59,31,14,.3)]" />
      <span className="mt-1 font-display text-[11px] leading-none text-ink">{INGREDIENTS[id].name}</span>
    </motion.button>
  )
}
