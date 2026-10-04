import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Button } from '@/components/Button'
import { Counter } from '@/components/Counter'
import { EffectsLayer } from '@/components/EffectsLayer'
import { Hud } from '@/components/Hud'
import { Modal } from '@/components/Modal'
import { ReviewsList } from '@/components/ReviewsList'
import { ScorePopup } from '@/components/ScorePopup'
import { StationTabs, type Station } from '@/components/StationTabs'
import { TrayStrip } from '@/components/TrayStrip'
import { AssemblyPanel } from '@/components/stations/AssemblyPanel'
import { DrinkPanel } from '@/components/stations/DrinkPanel'
import { FryerPanel } from '@/components/stations/FryerPanel'
import { GrillPanel } from '@/components/stations/GrillPanel'
import { useGameLoop } from '@/game/loop/useGameLoop'
import { useGameStore } from '@/game/store'

function PauseModal() {
  const setPaused = useGameStore((s) => s.setPaused)
  const goTo = useGameStore((s) => s.goTo)
  return (
    <Modal title="Pausado">
      <div className="flex flex-col gap-4">
        <p className="text-sm leading-snug text-ink/80">Se sair para o menu, o dia recomeça do início quando você voltar.</p>
        <Button variant="green" onClick={() => setPaused(false)}>Continuar</Button>
        <Button
          variant="brown"
          onClick={() => {
            setPaused(false)
            goTo('title')
          }}
        >
          Sair para o menu
        </Button>
      </div>
    </Modal>
  )
}

function ReviewsModal() {
  const player = useGameStore((s) => s.player)
  const close = useGameStore((s) => s.setReviewsOpen)
  const setPaused = useGameStore((s) => s.setPaused)
  return (
    <Modal title="Avaliações">
      <div className="max-h-[52vh] overflow-y-auto pr-1 text-left">
        <ReviewsList reviews={player.reviews} reputation={player.reputation} idPrefix="kit-rv" />
      </div>
      <Button
        variant="green"
        className="mt-4 w-full"
        onClick={() => {
          close(false)
          setPaused(false)
        }}
      >
        Voltar ao jogo
      </Button>
    </Modal>
  )
}

/** Altura de projeto da cozinha; em telas mais baixas ela é reduzida proporcionalmente. */
const DESIGN_HEIGHT = 780
const MIN_SCALE = 0.68

function useKitchenScale(): number {
  const calc = () => Math.min(1, Math.max(MIN_SCALE, window.innerHeight / DESIGN_HEIGHT))
  const [scale, setScale] = useState(calc)
  useEffect(() => {
    const onResize = () => setScale(calc())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return scale
}

export function KitchenScreen() {
  const scale = useKitchenScale()
  const [station, setStation] = useState<Station>('assembly')
  const paused = useGameStore((s) => s.paused)
  const reviewsOpen = useGameStore((s) => s.reviewsOpen)
  const ended = useGameStore((s) => s.session.ended)
  const tick = useGameStore((s) => s.tick)
  const setPaused = useGameStore((s) => s.setPaused)

  useGameLoop(!paused && !ended, tick)

  // Pausa sozinho quando a aba sai de foco.
  useEffect(() => {
    const onHide = () => document.hidden && setPaused(true)
    document.addEventListener('visibilitychange', onHide)
    return () => document.removeEventListener('visibilitychange', onHide)
  }, [setPaused])

  return (
    <div className="h-full overflow-hidden bg-cream">
      <div
        className="mx-auto flex max-w-[640px] flex-col overflow-hidden bg-cream"
        style={{ zoom: scale, height: "100%" }}
      >
        <Hud />
        <Counter />
        <TrayStrip />
        <section
          className="relative min-h-0 flex-1 px-3 pb-2 pt-3"
          style={{
            background:
              'repeating-linear-gradient(90deg, rgba(0,0,0,.05) 0 3px, transparent 3px 46px), linear-gradient(#C98A4B, #B4743A)',
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={station}
              className="h-full"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6, transition: { duration: 0.08 } }}
              transition={{ duration: 0.14 }}
            >
              {station === 'assembly' && <AssemblyPanel />}
              {station === 'grill' && <GrillPanel />}
              {station === 'fryer' && <FryerPanel />}
              {station === 'drinks' && <DrinkPanel />}
            </motion.div>
          </AnimatePresence>
        </section>
        <StationTabs active={station} onChange={setStation} />
      </div>
      <EffectsLayer />
      <ScorePopup />
      <AnimatePresence>
        {paused && !ended && !reviewsOpen && <PauseModal key="pause" />}
        {reviewsOpen && <ReviewsModal key="reviews" />}
      </AnimatePresence>
    </div>
  )
}
