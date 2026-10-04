import { AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Button } from '@/components/Button'
import { Counter } from '@/components/Counter'
import { EffectsLayer } from '@/components/EffectsLayer'
import { Hud } from '@/components/Hud'
import { Modal } from '@/components/Modal'
import { Workbench } from '@/components/Workbench'
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
    ['Pedidos errados', String(stats.wrong)],
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
const DESIGN_HEIGHT = 740
const MIN_SCALE = 0.7

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
        <Workbench />
      </div>
      <EffectsLayer />
      <AnimatePresence>
        {paused && !ended && <PauseModal key="pause" />}
        {ended && <SummaryModal key="summary" />}
      </AnimatePresence>
    </div>
  )
}
