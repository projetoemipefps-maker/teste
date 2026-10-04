import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { VenueArt } from '@/art'
import { RENOVATION_MS, VENUES } from '@/game/config'
import { useGameStore } from '@/game/store'
import { Button } from './Button'
import { Confetti } from './LevelUpOverlay'

/** Pedaços de poeira da reforma (posições estáveis por índice). */
const DUST = Array.from({ length: 9 }, (_, i) => ({ x: 8 + ((i * 37) % 84), y: 18 + ((i * 53) % 64), size: 22 + ((i * 17) % 22), delay: (i % 5) * 0.18 }))

const hazard = 'repeating-linear-gradient(135deg, #F5B82E 0 12px, #3B1F0E 12px 24px)'

/** Animação de reforma: tapumes cobrem a fachada antiga, a obra balança e solta poeira, e a fase nova é revelada. */
export function RenovationOverlay() {
  const renovation = useGameStore((s) => s.renovation)
  const finish = useGameStore((s) => s.finishRenovation)
  const reduceMotion = useGameStore((s) => s.settings.reduceMotion)
  const [stage, setStage] = useState<'build' | 'reveal'>(reduceMotion ? 'reveal' : 'build')

  useEffect(() => {
    if (!renovation || reduceMotion) return
    setStage('build')
    const t = setTimeout(() => setStage('reveal'), RENOVATION_MS * 0.62)
    return () => clearTimeout(t)
  }, [renovation, reduceMotion])

  if (!renovation) return null
  const to = VENUES[renovation.to]
  const building = stage === 'build'

  return (
    <motion.div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/80 p-4 backdrop-blur-[2px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-label={building ? 'Reformando a hamburgueria' : `Nova fase: ${to.name}`}
    >
      {!building && <Confetti count={60} />}
      <div className="relative flex w-full max-w-sm flex-col items-center rounded-[28px] border-4 border-ink bg-cream px-4 pb-4 pt-3 text-center shadow-soft">
        <motion.h2
          key={stage}
          className="font-display text-4xl leading-none text-tomato [text-shadow:0_3px_0_#3B1F0E]"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 14 }}
        >
          {building ? 'Em reforma…' : 'Nova fase!'}
        </motion.h2>

        <div className="relative mt-3 h-[190px] w-full overflow-hidden rounded-2xl border-4 border-ink bg-[#BEE3F8]">
          {/* fachada: a antiga durante a obra e a nova na revelação */}
          <motion.div
            key={building ? renovation.from : renovation.to}
            className="absolute inset-0"
            initial={building ? false : { scale: 0.7, opacity: 0, rotate: -3 }}
            animate={building ? { x: [0, -3, 3, -2, 2, 0], y: [0, 1, -1, 1, 0] } : { scale: 1, opacity: 1, rotate: 0 }}
            transition={building ? { duration: 0.5, repeat: Infinity } : { type: 'spring', stiffness: 220, damping: 13 }}
          >
            <VenueArt id={building ? renovation.from : renovation.to} className="h-full w-full" />
          </motion.div>

          {building && (
            <>
              {/* tapumes que fecham */}
              <motion.div
                className="absolute inset-y-0 left-0 w-1/2 border-r-4 border-ink"
                style={{ background: hazard }}
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                transition={{ type: 'spring', stiffness: 120, damping: 16 }}
              />
              <motion.div
                className="absolute inset-y-0 right-0 w-1/2 border-l-4 border-ink"
                style={{ background: hazard }}
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                transition={{ type: 'spring', stiffness: 120, damping: 16 }}
              />
              {DUST.map((d, i) => (
                <motion.span
                  key={i}
                  className="absolute rounded-full bg-[#E9E1D0]"
                  style={{ left: `${d.x}%`, top: `${d.y}%`, width: d.size, height: d.size, border: '3px solid #3B1F0E' }}
                  animate={{ scale: [0, 1, 1.4], opacity: [0, 0.95, 0], y: [0, -14, -30] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: d.delay }}
                />
              ))}
              <motion.div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl border-4 border-ink bg-mustard px-3 py-1 font-display text-xl leading-none text-ink shadow-[0_4px_0_#3B1F0E]"
                animate={{ rotate: [-6, 6, -6], scale: [1, 1.06, 1] }}
                transition={{ duration: 0.7, repeat: Infinity }}
              >
                Obra!
              </motion.div>
            </>
          )}
          {!building && (
            <motion.div className="pointer-events-none absolute inset-0 bg-white" initial={{ opacity: 0.9 }} animate={{ opacity: 0 }} transition={{ duration: 0.6 }} />
          )}
        </div>

        {building ? (
          <div className="mt-3 w-full">
            <p className="text-sm font-bold text-ink/70">Os pedreiros estão trabalhando na {VENUES[renovation.from].name.toLowerCase()}…</p>
            <div className="mt-1.5 h-4 overflow-hidden rounded-full border-[3px] border-ink bg-cream-dark">
              <motion.div className="h-full rounded-full bg-gradient-to-b from-[#FFD866] to-mustard" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: (RENOVATION_MS * 0.62) / 1000, ease: 'linear' }} />
            </div>
          </div>
        ) : (
          <motion.div className="mt-3 w-full" initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}>
            <p className="font-display text-2xl leading-tight text-ink">{to.name}</p>
            <p className="text-sm text-ink/70">{to.description}</p>
            <ul className="mt-2 flex flex-wrap justify-center gap-1">
              {to.perks.map((p) => (
                <li key={p} className="rounded-full bg-cream-dark px-2 py-0.5 text-[11.5px] font-bold leading-tight text-ink">
                  {p}
                </li>
              ))}
            </ul>
            <Button variant="green" className="mt-3 w-full !text-2xl" onClick={finish}>
              Continuar
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
