import { motion } from 'framer-motion'
import { INGREDIENT_IDS } from '@/game/config'
import { IngredientArt, Logo } from '@/art'
import { Button } from '@/components/Button'
import { useGameStore } from '@/game/store'

const FLOATERS = Array.from({ length: 12 }, (_, i) => ({
  id: INGREDIENT_IDS[i % INGREDIENT_IDS.length]!,
  left: (i * 83) % 100,
  size: 52 + ((i * 29) % 40),
  duration: 9 + ((i * 7) % 8),
  delay: -((i * 5) % 11),
  rotate: (i % 2 ? 1 : -1) * (20 + ((i * 13) % 60)),
}))

export function TitleScreen() {
  const hasSave = useGameStore((s) => s.hasSave)
  const level = useGameStore((s) => s.player.level)
  const day = useGameStore((s) => s.player.day)
  const newGame = useGameStore((s) => s.newGame)
  const continueGame = useGameStore((s) => s.continueGame)
  const goTo = useGameStore((s) => s.goTo)

  const startNew = () => {
    if (hasSave && !window.confirm('Começar um novo jogo apaga o progresso salvo. Continuar?')) return
    newGame()
  }

  return (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-tomato-light via-tomato to-tomato-dark px-6">
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{ background: 'repeating-conic-gradient(from 0deg at 50% 38%, #fff 0 6deg, transparent 6deg 18deg)' }}
      />
      {FLOATERS.map((f, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute opacity-80"
          style={{ left: `${f.left}%`, width: f.size, top: -80 }}
          animate={{ y: ['0vh', '115vh'], rotate: [0, f.rotate] }}
          transition={{ duration: f.duration, delay: f.delay, repeat: Infinity, ease: 'linear' }}
        >
          <IngredientArt id={f.id} className="w-full overflow-visible" />
        </motion.div>
      ))}

      <div className="relative z-10 flex w-full max-w-xs flex-col items-center">
        <Logo />
        <motion.div
          className="mt-8 flex w-full flex-col gap-4"
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.5, type: 'spring', stiffness: 200, damping: 18 }}
        >
          {hasSave && (
            <Button variant="secondary" onClick={continueGame} className="w-full !text-2xl">
              Continuar
              <span className="rounded-full border-[3px] border-ink bg-cream px-2 py-0.5 text-sm">
                Nv {level} · Dia {day}
              </span>
            </Button>
          )}
          <Button variant={hasSave ? 'primary' : 'secondary'} onClick={startNew} className="w-full !text-2xl">
            Novo jogo
          </Button>
          <Button variant="brown" onClick={() => goTo('settings')} className="w-full">
            Configurações
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
