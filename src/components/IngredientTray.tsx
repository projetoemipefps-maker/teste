import { motion } from 'framer-motion'
import { INGREDIENTS, type IngredientId } from '@/game/config'
import { canAddIngredient } from '@/game/engine'
import { IngredientArt } from '@/art'
import { useGameStore } from '@/game/store'

export function IngredientTray({ id }: { id: IngredientId }) {
  const burger = useGameStore((s) => s.session.burger)
  const add = useGameStore((s) => s.addIngredient)
  const allowed = canAddIngredient(burger, id)

  return (
    <motion.button
      type="button"
      aria-label={`Adicionar ${INGREDIENTS[id].name}`}
      onClick={() => add(id)}
      className={`relative flex h-[68px] flex-col items-center justify-center rounded-2xl border-4 border-ink bg-gradient-to-b from-[#FFF8EA] to-cream-dark px-1 pt-1.5 outline-none ${
        allowed ? '' : 'opacity-45 saturate-50'
      }`}
      style={{ boxShadow: '0 5px 0 #3B1F0E' }}
      whileHover={allowed ? { scale: 1.04 } : undefined}
      whileTap={{ y: 5, boxShadow: '0 0 0 #3B1F0E', scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 600, damping: 28 }}
    >
      <span className="pointer-events-none absolute inset-x-3 top-1 h-1.5 rounded-full bg-white/70" />
      <IngredientArt id={id} className="w-[60px] overflow-visible drop-shadow-[0_2px_0_rgba(59,31,14,.3)]" />
      <span className="mt-1 font-display text-[12px] leading-none text-ink">{INGREDIENTS[id].name}</span>
    </motion.button>
  )
}
