import { AnimatePresence, motion, useAnimationControls } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { FlipIcon, PattyDisc, pattyHeatColor } from '@/art'
import { GRILL, UI_LIMITS } from '@/game/config'
import { pattyHint, pattyStage, type GrillPatty, type PattyStage } from '@/game/engine'
import { useGameStore } from '@/game/store'
import { Button } from '../Button'
import { CookRing } from '../CookRing'
import { Smoke, Sizzle, Sparks } from '../Fx'
import { HeldPlate } from '../HeldPlate'

const RING_TOTAL = GRILL.sideBurntSeconds
const OUTER_ZONES = [
  { from: GRILL.sideDoneSeconds, to: GRILL.sideOverdoneSeconds, color: '#5FB84A' },
  { from: GRILL.sideOverdoneSeconds, to: GRILL.sideBurntSeconds, color: '#F5A02E' },
] as const

const STAGE_LABEL: Record<PattyStage, { text: string; cls: string }> = {
  raw: { text: 'Crua', cls: 'bg-[#F29AA0] text-ink' },
  perfect: { text: 'No ponto!', cls: 'bg-leaf text-white' },
  overdone: { text: 'Passada', cls: 'bg-orange text-white' },
  burnt: { text: 'Queimada!', cls: 'bg-tomato text-white' },
}

function GrillSlot({ slot }: { slot: number }) {
  const patty = useGameStore((s) => s.session.grill[slot] ?? null)
  const heldFull = useGameStore((s) => s.session.held.length >= GRILL.heldCapacity)
  const place = useGameStore((s) => s.placePatty)
  const stock = useGameStore((s) => s.session.stock.patty)
  const flip = useGameStore((s) => s.flipPatty)
  const take = useGameStore((s) => s.takePatty)

  return (
    <div className="flex w-[120px] flex-col items-center gap-1.5">
      <div className="relative flex h-[120px] w-[120px] items-center justify-center">
        <AnimatePresence mode="wait">
          {patty ? (
            <PattyOnGrill key="patty" patty={patty} onFlip={() => flip(slot)} />
          ) : (
            <motion.button
              key="empty"
              type="button"
              aria-label={`Colocar carne crua na chapa (espaço ${slot + 1})`}
              disabled={stock <= 0}
              onClick={() => place(slot)}
              className={`flex h-[96px] w-[96px] flex-col items-center justify-center rounded-full border-4 border-dashed border-white/55 bg-black/20 font-display text-white/90 ${stock <= 0 ? 'opacity-40 grayscale' : ''}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileTap={{ scale: 0.93 }}
            >
              <span className="text-3xl leading-none">{stock <= 0 ? '×' : '+'}</span>
              <span className="text-xs leading-none">{stock <= 0 ? 'Acabou a carne' : 'Carne crua'}</span>
              {stock > 0 && (
                <span className={`mt-0.5 rounded-full px-1.5 text-[10px] leading-tight ${stock <= UI_LIMITS.lowStock ? 'bg-orange text-white' : 'bg-white/25'}`}>×{stock}</span>
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      <Button
        variant={patty && pattyStage(patty) === 'burnt' ? 'primary' : 'green'}
        disabled={!patty || (pattyStage(patty) !== 'burnt' && heldFull)}
        onClick={() => take(slot)}
        className="w-full !rounded-xl !border-[3px] !px-2 !py-1 !text-sm"
        aria-label={`${patty && pattyStage(patty) === 'burnt' ? 'Jogar carne queimada no lixo' : 'Tirar carne da chapa'} (espaço ${slot + 1})`}
      >
        {patty && pattyStage(patty) === 'burnt' ? 'Lixo' : 'Tirar'}
      </Button>
    </div>
  )
}

function PattyOnGrill({ patty, onFlip }: { patty: GrillPatty; onFlip: () => void }) {
  const stage = pattyStage(patty)
  const hint = pattyHint(patty)
  const up: 0 | 1 = patty.down === 0 ? 1 : 0
  const controls = useAnimationControls()
  // Mostra o lado de cima; troca a cor no meio do giro para o flip parecer real.
  const [shownSide, setShownSide] = useState<0 | 1>(up)
  const lastFlips = useRef(patty.flips)

  useEffect(() => {
    if (patty.flips === lastFlips.current) return
    lastFlips.current = patty.flips
    void controls.start({
      rotateX: [0, 180, 360],
      y: [0, -46, 0],
      scale: [1, 1.18, 1],
      transition: { duration: 0.5, ease: 'easeInOut' },
    })
    const t = setTimeout(() => setShownSide(up), 250)
    return () => clearTimeout(t)
  }, [patty.flips, up, controls])

  // Ao reaparecer (ex.: nova carne no mesmo espaço), o lado exibido acompanha o estado.
  const visibleSide = patty.flips === 0 ? up : shownSide
  // Passada/queimada: o lado escuro aparece por baixo da carne, então a cor acompanha o lado mais cozido.
  const heat = stage === 'burnt' || stage === 'overdone' ? Math.max(...patty.sides) : patty.sides[visibleSide]
  const color = pattyHeatColor(heat)
  const burnt = stage === 'burnt'
  const smoke = burnt ? 'heavy' : stage === 'overdone' ? 'light' : 'steam'
  const label = STAGE_LABEL[stage]

  return (
    <motion.button
      type="button"
      aria-label={`Virar carne (${label.text})`}
      onClick={onFlip}
      className="relative flex h-full w-full items-center justify-center outline-none"
      initial={{ y: -90, scale: 1.5, opacity: 0 }}
      animate={{ y: 0, scale: 1, opacity: 1 }}
      exit={{ y: -30, scale: 0.4, opacity: 0, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 380, damping: 14 }}
      whileTap={{ scale: 0.94 }}
    >
      <CookRing
        className="absolute inset-0"
        size={120}
        stroke={8}
        value={patty.sides[patty.down]}
        total={RING_TOTAL}
        zones={OUTER_ZONES}
      />
      <CookRing
        className="absolute left-[12px] top-[12px]"
        size={96}
        stroke={5}
        value={patty.sides[up]}
        total={RING_TOTAL}
        zones={OUTER_ZONES}
        marker={false}
      />
      <div className={`relative h-[70px] w-[70px] ${burnt ? '' : 'fx-sizzle'}`} style={{ perspective: 400 }}>
        <motion.div animate={controls} className="h-full w-full" style={{ transformStyle: 'preserve-3d' }}>
          <PattyDisc color={color} className="h-full w-full overflow-visible" />
        </motion.div>
        {!burnt && <Sizzle />}
        {!burnt && <Sparks />}
      </div>
      <Smoke kind={smoke} className="left-1/2 top-[26px]" />
      <span className={`absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border-[3px] border-ink px-2 py-0.5 font-display text-[12px] leading-none ${label.cls}`}>
        {label.text}
      </span>
      <AnimatePresence>
        {hint === 'flip' && (
          <motion.span
            key="flip"
            className="fx-bounce absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full border-[3px] border-ink bg-mustard px-2 py-0.5 font-display text-sm leading-none text-ink"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <FlipIcon className="h-4 w-4" /> Vire!
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

export function GrillPanel() {
  const held = useGameStore((s) => s.session.held)
  return (
    <div
      className="relative flex h-full items-center justify-between gap-1.5 rounded-[24px] border-4 border-ink px-2 py-2 shadow-[inset_0_6px_0_rgba(255,255,255,.12),0_5px_0_rgba(59,31,14,.4)]"
      style={{
        background:
          'repeating-linear-gradient(90deg, rgba(0,0,0,.35) 0 4px, transparent 4px 18px), radial-gradient(ellipse at 50% 40%, #6F6F78, #3E3E46)',
      }}
    >
      {Array.from({ length: GRILL.slots }, (_, i) => (
        <GrillSlot key={i} slot={i} />
      ))}
      <HeldPlate held={held} />
    </div>
  )
}
