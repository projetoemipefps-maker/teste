import { motion } from 'framer-motion'
import { Cup, CustomerArt, DessertArt, IngredientArt, ShopIcon, SidePortion } from '@/art'
import { INGREDIENTS, RECIPES, type CupSize, type IngredientId } from "@/game/config"
import type { CustomerTypeId, DessertId, DrinkKind, SideId, UnlockEntry, UnlockKind } from '@/game/engine'
import { BurgerPicture } from './BurgerPicture'
import { Button } from './Button'
import { useGameStore } from '@/game/store'

const CONFETTI_COLORS = ['#E63B2E', '#F5B82E', '#5FB84A', '#3E86D6', '#E86FA0', '#F28C28', '#8E6BC9']

/** Valores estáveis por índice (o confete não "pula" a cada renderização). */
const pseudo = (i: number, salt: number) => ((Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453) % 1 + 1) % 1

export function Confetti({ count = 70 }: { count?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {Array.from({ length: count }, (_, i) => {
        const size = 6 + pseudo(i, 1) * 8
        return (
          <motion.span
            key={i}
            className="absolute block"
            style={{
              left: `${pseudo(i, 2) * 100}%`,
              top: -20,
              width: size,
              height: i % 3 === 0 ? size : size * 1.8,
              borderRadius: i % 3 === 0 ? '50%' : 2,
              background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            }}
            initial={{ y: -30, rotate: 0, opacity: 1 }}
            animate={{ y: '110vh', x: (pseudo(i, 3) - 0.5) * 120, rotate: 360 * (pseudo(i, 4) > 0.5 ? 2 : -2), opacity: [1, 1, 0.9] }}
            transition={{ duration: 2.4 + pseudo(i, 5) * 2, delay: pseudo(i, 6) * 0.9, ease: 'easeIn', repeat: Infinity, repeatDelay: pseudo(i, 7) * 0.6 }}
          />
        )
      })}
    </div>
  )
}

const KIND_LABEL: Record<UnlockKind, string> = {
  recipe: 'Nova receita',
  ingredient: 'Ingrediente',
  side: 'Acompanhamento',
  drink: 'Bebida',
  dessert: 'Sobremesa',
  customer: 'Novo cliente',
  equipment: 'Loja',
}

const CUSTOMER_LOOK = { skin: 2, hairStyle: 0, hairColor: 1, outfit: 0, outfitColor: 0, accessory: 0 }

function UnlockIcon({ entry }: { entry: UnlockEntry }) {
  switch (entry.kind) {
    case 'ingredient': {
      const id = (entry.id === 'doublePatty' ? 'patty' : entry.id) as IngredientId
      return <IngredientArt id={id in INGREDIENTS ? id : 'patty'} className="h-7 w-11 overflow-visible" />
    }
    case 'side':
      return <SidePortion id={entry.id as SideId} className="h-9 w-8" />
    case 'drink':
      return <Cup id={`lu-${entry.id}`} kind={entry.id as DrinkKind} size={'large' as CupSize} className="h-9 w-8 overflow-visible" />
    case 'dessert':
      return <DessertArt id={entry.id as DessertId} className="h-9 w-8" />
    case 'recipe': {
      const recipe = RECIPES.find((r) => r.id === entry.id)
      return recipe ? <BurgerPicture ingredients={recipe.ingredients} width={40} /> : null
    }
    case 'customer':
      return <CustomerArt look={CUSTOMER_LOOK} type={entry.id as CustomerTypeId} mood="happy" className="h-10 w-9" />
    case 'equipment':
      return <ShopIcon className="h-9 w-11 overflow-visible" />
  }
}

/** Tela de "LEVEL UP!": confete, o novo nível e tudo o que foi desbloqueado. */
export function LevelUpOverlay() {
  const levelUp = useGameStore((s) => s.levelUp)
  const dismiss = useGameStore((s) => s.dismissLevelUp)
  if (!levelUp) return null
  const { level, from, unlocks } = levelUp
  const jumped = level - from > 1

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/70 p-4 backdrop-blur-[2px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-label={`Nível ${level}`}
    >
      <Confetti />
      <motion.div
        className="relative flex max-h-[88vh] w-full max-w-sm flex-col items-center rounded-[28px] border-4 border-ink bg-cream px-5 pb-5 pt-4 text-center shadow-soft"
        initial={{ scale: 0.3, rotate: -8, y: 60, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 14 }}
      >
        <motion.h2
          className="font-display text-5xl leading-none text-mustard"
          style={{ WebkitTextStroke: '7px #3B1F0E', paintOrder: 'stroke fill', textShadow: '0 5px 0 #3B1F0E' }}
          animate={{ scale: [1, 1.08, 1], rotate: [-2, 2, -2] }}
          transition={{ duration: 1.4, repeat: Infinity }}
        >
          LEVEL UP!
        </motion.h2>

        <motion.div
          className="relative mt-3 grid h-20 w-20 place-items-center rounded-full border-[5px] border-ink bg-mustard font-display text-5xl text-ink shadow-[0_5px_0_rgba(59,31,14,.4)]"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 11, delay: 0.25 }}
        >
          {level}
        </motion.div>
        <p className="mt-1.5 text-sm text-ink/70">{jumped ? `Do nível ${from} para o nível ${level}!` : `Você chegou ao nível ${level}!`}</p>

        <div className="mt-3 w-full overflow-y-auto" style={{ maxHeight: '38vh' }}>
          {unlocks.length === 0 ? (
            <p className="rounded-2xl border-[3px] border-dashed border-ink/30 px-3 py-4 text-sm text-ink/70">Continue servindo para liberar novidades!</p>
          ) : (
            <>
              <p className="mb-1.5 font-display text-lg leading-none text-tomato">Desbloqueou</p>
              <ul className="flex flex-col gap-1.5">
                {unlocks.map((u, i) => (
                  <motion.li
                    key={`${u.kind}-${u.id}`}
                    className="flex items-center gap-2 rounded-xl border-[3px] border-ink bg-white px-2 py-1 text-left"
                    initial={{ x: -30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5 + i * 0.12, type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <span className="grid h-10 w-12 shrink-0 place-items-center">
                      <UnlockIcon entry={u} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[10.5px] uppercase leading-none tracking-wide text-ink/50">{KIND_LABEL[u.kind]}</span>
                      <span className="block font-display text-base leading-tight text-ink">{u.name}</span>
                      {u.detail && <span className="block text-[11.5px] leading-tight text-ink/70">{u.detail}</span>}
                    </span>
                    {u.kind === 'ingredient' && u.id !== 'doublePatty' && (
                      <span className="rounded-full bg-leaf px-1.5 py-0.5 text-[10px] leading-none text-white">+6 no estoque</span>
                    )}
                  </motion.li>
                ))}
              </ul>
            </>
          )}
        </div>

        <Button variant="green" className="mt-4 w-full !text-2xl" onClick={dismiss}>
          Continuar
        </Button>
      </motion.div>
    </motion.div>
  )
}

