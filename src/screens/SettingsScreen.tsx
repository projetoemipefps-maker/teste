import { motion } from 'framer-motion'
import { useState } from 'react'
import { BackIcon } from '@/art'
import { Button } from '@/components/Button'
import { useGameStore } from '@/game/store'

export function SettingsScreen() {
  const reduceMotion = useGameStore((s) => s.settings.reduceMotion)
  const setReduceMotion = useGameStore((s) => s.setReduceMotion)
  const hasSave = useGameStore((s) => s.hasSave)
  const eraseSave = useGameStore((s) => s.eraseSave)
  const goTo = useGameStore((s) => s.goTo)
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="flex h-full flex-col items-center bg-cream px-5 pb-8 pt-6">
      <div className="flex w-full max-w-sm items-center gap-3">
        <motion.button
          type="button"
          aria-label="Voltar"
          onClick={() => goTo('title')}
          whileTap={{ scale: 0.88, y: 3 }}
          className="grid h-11 w-11 place-items-center rounded-xl border-4 border-ink bg-mustard shadow-[0_4px_0_#3B1F0E]"
        >
          <BackIcon className="h-7 w-7" />
        </motion.button>
        <h1 className="font-display text-4xl text-tomato [text-shadow:0_3px_0_#3B1F0E]">Configurações</h1>
      </div>

      <div className="mt-8 flex w-full max-w-sm flex-col gap-4">
        <button
          type="button"
          role="switch"
          aria-checked={reduceMotion}
          onClick={() => setReduceMotion(!reduceMotion)}
          className="flex items-center justify-between rounded-2xl border-4 border-ink bg-white px-4 py-3 text-left shadow-[0_5px_0_rgba(59,31,14,.35)]"
        >
          <span>
            <span className="block font-display text-xl text-ink">Reduzir animações</span>
            <span className="block text-sm text-ink/70">Menos movimento na tela</span>
          </span>
          <span className={`relative h-8 w-14 rounded-full border-4 border-ink transition-colors ${reduceMotion ? 'bg-leaf' : 'bg-ink/25'}`}>
            <motion.span
              className="absolute top-0 h-6 w-6 rounded-full border-[3px] border-ink bg-white"
              animate={{ left: reduceMotion ? 24 : 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </span>
        </button>

        <div className="rounded-2xl border-4 border-ink bg-white p-4 shadow-[0_5px_0_rgba(59,31,14,.35)]">
          <span className="block font-display text-xl text-ink">Progresso salvo</span>
          <span className="mb-3 block text-sm text-ink/70">
            O jogo salva sozinho neste navegador. Apagar remove dinheiro, nível e reputação.
          </span>
          {confirming ? (
            <div className="flex gap-3">
              <Button
                variant="primary"
                className="flex-1 !px-2 !py-2 !text-base"
                onClick={() => {
                  eraseSave()
                  setConfirming(false)
                }}
              >
                Apagar tudo
              </Button>
              <Button variant="brown" className="flex-1 !px-2 !py-2 !text-base" onClick={() => setConfirming(false)}>
                Cancelar
              </Button>
            </div>
          ) : (
            <Button variant="primary" disabled={!hasSave} className="w-full !py-2 !text-base" onClick={() => setConfirming(true)}>
              Apagar progresso
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
