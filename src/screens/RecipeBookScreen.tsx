import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { BackIcon, BookIcon, LockIcon, StarBurst } from '@/art'
import { BurgerPicture } from '@/components/BurgerPicture'
import { formatMoney } from '@/components/format'
import { RecipeSteps } from '@/components/RecipeReference'
import { RECIPES, type Recipe } from '@/game/config'
import { INGREDIENTS } from '@/game/config'
import { isRecipeUnlocked, itemPrice, recipeKey } from '@/game/engine'
import { useGameStore } from '@/game/store'

function RecipeCard({ recipe, level, price, open, onToggle }: { recipe: Recipe; level: number; price: number; open: boolean; onToggle: () => void }) {
  const unlocked = isRecipeUnlocked(recipe, level)
  const names = recipe.ingredients.map((id) => INGREDIENTS[id].name)
  return (
    <motion.article
      layout
      className={`rounded-2xl border-4 border-ink px-3 py-2 shadow-[0_4px_0_rgba(59,31,14,.3)] ${unlocked ? 'bg-white' : 'bg-ink/10'}`}
      aria-label={unlocked ? recipe.name : `${recipe.name} (bloqueada, nível ${recipe.unlockLevel})`}
    >
      <button type="button" onClick={unlocked ? onToggle : undefined} className="flex w-full items-center gap-3 text-left" aria-expanded={unlocked ? open : undefined} disabled={!unlocked}>
        <div className="relative grid h-[76px] w-[72px] shrink-0 place-items-end justify-center">
          <div style={unlocked ? undefined : { filter: 'brightness(0) opacity(.28)' }}>
            <BurgerPicture ingredients={recipe.ingredients} width={62} maxHeight={72} />
          </div>
          {!unlocked && (
            <span className="absolute inset-0 grid place-items-center">
              <LockIcon className="h-9 w-9 drop-shadow-[0_2px_0_rgba(59,31,14,.3)]" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 font-display text-xl leading-none text-ink">
            <span>{recipe.name}</span>
            {recipe.signature && (
              <span className="flex shrink-0 items-center gap-0.5 rounded-full border-2 border-ink bg-mustard px-1.5 py-px text-[10px] leading-none">
                <StarBurst className="h-3.5 w-3.5" /> Assinatura
              </span>
            )}
          </p>
          {unlocked ? (
            <>
              <p className="mt-1 text-sm text-ink/70">
                {names.length} ingredientes · <b className="text-leaf-dark">{formatMoney(price)}</b>
              </p>
              <p className="mt-0.5 text-[11.5px] leading-tight text-ink/60">{names.join(' · ')}</p>
            </>
          ) : (
            <p className="mt-1.5 inline-flex items-center gap-1 rounded-full border-[3px] border-ink bg-mustard px-2.5 py-0.5 font-display text-sm leading-none text-ink">
              <LockIcon className="h-4 w-4" /> Nível {recipe.unlockLevel}
            </p>
          )}
        </div>
      </button>
      <AnimatePresence initial={false}>
        {unlocked && open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-2 border-t-[3px] border-dashed border-ink/20 pt-2">
              <RecipeSteps recipeId={recipe.id} width={84} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  )
}

/** Livro de Receitas: todas as receitas, liberadas (com o passo a passo) e bloqueadas (com cadeado e nível). */
export function RecipeBookScreen() {
  const level = useGameStore((s) => s.player.level)
  const prices = useGameStore((s) => s.player.prices)
  const close = useGameStore((s) => s.closeRecipeBook)
  const [openId, setOpenId] = useState<string | null>(null)
  const unlockedCount = RECIPES.filter((r) => isRecipeUnlocked(r, level)).length

  return (
    <div
      className="mx-auto flex h-full max-w-[640px] flex-col"
      style={{ background: 'linear-gradient(rgba(59,31,14,.06) 2px, transparent 2px) 0 0/44px 44px, linear-gradient(90deg, rgba(59,31,14,.06) 2px, transparent 2px) 0 0/44px 44px, #FFF3DC' }}
    >
      <header className="relative z-10 flex items-center gap-2 rounded-b-[26px] border-b-4 border-ink bg-gradient-to-b from-tomato-light to-tomato px-3 pb-2.5 pt-2 shadow-[0_5px_0_rgba(59,31,14,.35)]">
        <motion.button
          type="button"
          aria-label="Voltar"
          onClick={close}
          whileTap={{ scale: 0.9, y: 3 }}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border-4 border-ink bg-toast shadow-[0_4px_0_#3B1F0E]"
        >
          <BackIcon className="h-6 w-6" />
        </motion.button>
        <BookIcon className="h-9 w-9" />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl leading-tight text-white [text-shadow:0_2px_0_#3B1F0E]">Livro de Receitas</h1>
          <p className="text-xs leading-none text-white/90">
            {unlockedCount} de {RECIPES.length} liberadas · nível {level}
          </p>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-3 pb-6 pt-3">
        {RECIPES.map((r) => (
          <RecipeCard
            key={r.id}
            recipe={r}
            level={level}
            price={itemPrice(prices, recipeKey(r.id))}
            open={openId === r.id}
            onToggle={() => setOpenId(openId === r.id ? null : r.id)}
          />
        ))}
      </div>
    </div>
  )
}
