import { motion } from 'framer-motion'
import { Button } from '@/components/Button'
import { ECONOMY } from '@/game/config'
import { useGameStore } from '@/game/store'

export function BankruptScreen() {
  const day = useGameStore((s) => s.player.day)
  const level = useGameStore((s) => s.player.level)
  const newGame = useGameStore((s) => s.newGame)
  const goTo = useGameStore((s) => s.goTo)

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 bg-gradient-to-b from-[#5B4636] to-[#2E211A] px-6 text-center">
      <motion.div
        initial={{ y: -200, rotate: -12, opacity: 0 }}
        animate={{ y: 0, rotate: -4, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 160, damping: 9 }}
        className="rounded-2xl border-[5px] border-ink bg-cream px-8 py-4 shadow-soft"
      >
        <p className="font-display text-sm text-ink/70">Lanchonete</p>
        <h1 className="font-display text-5xl leading-none text-tomato [text-shadow:0_3px_0_#3B1F0E]">FALIU</h1>
      </motion.div>

      <motion.p
        className="max-w-xs text-lg leading-snug text-cream"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        {ECONOMY.bankruptcyDays} dias seguidos com o caixa no vermelho. A Brasa Burger fechou as portas no dia {day}, com a clientela no nível {level}.
      </motion.p>

      <motion.div className="flex w-full max-w-xs flex-col gap-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}>
        <Button variant="secondary" className="w-full !text-2xl" onClick={newGame}>
          Recomeçar
        </Button>
        <Button variant="brown" className="w-full" onClick={() => goTo('title')}>
          Menu
        </Button>
      </motion.div>
    </div>
  )
}
