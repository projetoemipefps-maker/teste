import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Button } from '@/components/Button'
import { Counter } from '@/components/Counter'
import { EffectsLayer } from '@/components/EffectsLayer'
import { Hud } from '@/components/Hud'
import { Modal } from '@/components/Modal'
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

function SummaryModal() {
  const stats = useGameStore((s) => s.session.stats)
  const day = useGameStore((s) => s.player.day)
  const nextDay = useGameStore((s) => s.nextDay)
  const goTo = useGameStore((s) => s.goTo)
  const rows: [string, string][] = [
    ['Atendidos', String(stats.served)],
    ['Nota média', stats.served > 0 ? `${(stats.starsTotal / stats.served).toFixed(1)} ★` : '—'],
    ['Clientes perdidos', String(stats.lost)],
    ['Faturamento', `R$ ${stats.earned}`],
  ]
  return (
    <Modal title={`Fim do dia ${day}`}>
      <dl className="mb-5 flex flex-col gap-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between rounded-xl border-[3px] border-ink bg-white px-3 py-1.5">
            <dt className="text-ink">{k}</dt>
            <dd className="font-display text-xl text-tomato">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-col gap-3">
        <Button variant="green" onClick={nextDay}>Próximo dia</Button>
        <Button variant="brown" onClick={() => goTo('title')} className="!py-2 !text-lg">Menu</Button>
      </div>
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
        {paused && !ended && <PauseModal key="pause" />}
        {ended && <SummaryModal key="summary" />}
      </AnimatePresence>
    </div>
  )
}
