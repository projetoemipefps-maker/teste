import { AnimatePresence, motion, useAnimationControls } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { FlipIcon, PattyDisc, pattyHeatColor } from '@/art'
import { GRILL, INGREDIENTS, PROTEIN_IDS, UI_LIMITS, type ProteinId } from '@/game/config'
import { grillTimes, isIngredientUnlocked, pattyHint, pattyStage, type GrillPatty, type PattyStage } from '@/game/engine'
import { useGameStore } from '@/game/store'
import { Button } from '../Button'
import { CookRing } from '../CookRing'
import { Smoke, Sizzle, Sparks } from '../Fx'
import { HeldPlate } from '../HeldPlate'

const STAGE_LABEL: Record<PattyStage, { text: string; cls: string }> = {
  raw: { text: 'Crua', cls: 'bg-[#F29AA0] text-ink' },
  perfect: { text: 'No ponto!', cls: 'bg-leaf text-white' },
  overdone: { text: 'Passada', cls: 'bg-orange text-white' },
  burnt: { text: 'Queimada!', cls: 'bg-tomato text-white' },
}

const SHORT: Record<ProteinId, string> = { patty: 'Carne', chicken: 'Frango', veggie: 'Vegetal' }
const zonesFor = (kind: ProteinId) => {
  const t = grillTimes(kind)
  return [
    { from: t.done, to: t.overdone, color: '#5FB84A' },
    { from: t.overdone, to: t.burnt, color: '#F5A02E' },
  ] as const
}

interface SlotProps {
  slot: number
  kind: ProteinId
  /** Tamanho do anel (px). */
  size: number
  /** Chapa com mais de 2 espaços: botões mais baixos para caber tudo na tela. */
  compact: boolean
}

function GrillSlot({ slot, kind, size, compact }: SlotProps) {
  const patty = useGameStore((s) => s.session.grill[slot] ?? null)
  const heldFull = useGameStore((s) => s.session.held.length >= GRILL.heldCapacity)
  const place = useGameStore((s) => s.placePatty)
  const flip = useGameStore((s) => s.flipPatty)
  const take = useGameStore((s) => s.takePatty)
  const stockId = INGREDIENTS[kind].stock!
  const stock = useGameStore((s) => s.session.stock[stockId])
  const burnt = patty !== null && pattyStage(patty) === 'burnt'
  const inner = Math.round(size * 0.8)

  return (
    <div className={`flex flex-col items-center ${compact ? 'gap-1' : 'gap-1.5'}`} style={{ width: size }}>
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <AnimatePresence mode="wait">
          {patty ? (
            <PattyOnGrill key="patty" patty={patty} size={size} onFlip={() => flip(slot)} />
          ) : (
            <motion.button
              key="empty"
              type="button"
              aria-label={`Colocar ${INGREDIENTS[kind].name.toLowerCase()} crua na chapa (espaço ${slot + 1})`}
              disabled={stock <= 0}
              onClick={() => place(slot, kind)}
              className={`flex flex-col items-center justify-center rounded-full border-4 border-dashed border-white/55 bg-black/20 font-display text-white/90 ${stock <= 0 ? 'opacity-40 grayscale' : ''}`}
              style={{ width: inner, height: inner }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileTap={{ scale: 0.93 }}
            >
              <span className="text-3xl leading-none">{stock <= 0 ? '×' : '+'}</span>
              <span className="text-xs leading-none">{stock <= 0 ? `Sem ${SHORT[kind].toLowerCase()}` : SHORT[kind]}</span>
              {stock > 0 && (
                <span className={`mt-0.5 rounded-full px-1.5 text-[10px] leading-tight ${stock <= UI_LIMITS.lowStock ? 'bg-orange text-white' : 'bg-white/25'}`}>×{stock}</span>
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      <Button
        variant={burnt ? 'primary' : 'green'}
        disabled={!patty || (!burnt && heldFull)}
        onClick={() => take(slot)}
        className={`w-full !rounded-xl !border-[3px] !px-2 ${compact ? '!py-0 !text-[13px] !leading-none' : '!py-1 !text-sm'}`}
        aria-label={`${burnt ? 'Jogar proteína queimada no lixo' : 'Tirar da chapa'} (espaço ${slot + 1})`}
      >
        {burnt ? 'Lixo' : 'Tirar'}
      </Button>
    </div>
  )
}

function PattyOnGrill({ patty, size, onFlip }: { patty: GrillPatty; size: number; onFlip: () => void }) {
  const stage = pattyStage(patty)
  const hint = pattyHint(patty)
  const times = grillTimes(patty.kind)
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

  const visibleSide = patty.flips === 0 ? up : shownSide
  // Passada/queimada: o lado escuro aparece por baixo da proteína, então a cor acompanha o lado mais cozido.
  const heat = stage === 'burnt' || stage === 'overdone' ? Math.max(...patty.sides) : patty.sides[visibleSide]
  const color = pattyHeatColor(heat, patty.kind)
  const burnt = stage === 'burnt'
  const smoke = burnt ? 'heavy' : stage === 'overdone' ? 'light' : 'steam'
  const label = STAGE_LABEL[stage]
  const zones = zonesFor(patty.kind)
  const innerRing = Math.round(size * 0.8)
  const disc = Math.round(size * 0.58)

  return (
    <motion.button
      type="button"
      aria-label={`Virar (${label.text})`}
      onClick={onFlip}
      className="relative flex h-full w-full items-center justify-center outline-none"
      initial={{ y: -90, scale: 1.5, opacity: 0 }}
      animate={{ y: 0, scale: 1, opacity: 1 }}
      exit={{ y: -30, scale: 0.4, opacity: 0, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 380, damping: 14 }}
      whileTap={{ scale: 0.94 }}
    >
      <CookRing className="absolute inset-0" size={size} stroke={Math.max(6, Math.round(size / 15))} value={patty.sides[patty.down]} total={times.burnt} zones={zones} />
      <CookRing
        className="absolute"
        style={{ left: (size - innerRing) / 2, top: (size - innerRing) / 2 }}
        size={innerRing}
        stroke={5}
        value={patty.sides[up]}
        total={times.burnt}
        zones={zones}
        marker={false}
      />
      <div className={`relative ${burnt ? '' : 'fx-sizzle'}`} style={{ width: disc, height: disc, perspective: 400 }}>
        <motion.div animate={controls} className="h-full w-full" style={{ transformStyle: 'preserve-3d' }}>
          <PattyDisc color={color} kind={patty.kind} className="h-full w-full overflow-visible" />
        </motion.div>
        {!burnt && <Sizzle />}
        {!burnt && <Sparks />}
      </div>
      <Smoke kind={smoke} className="left-1/2" />
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
  const slots = useGameStore((s) => s.session.grill.length)
  const level = useGameStore((s) => s.session.level)
  const proteins = PROTEIN_IDS.filter((id) => isIngredientUnlocked(id, level))
  const [choice, setChoice] = useState<ProteinId>('patty')
  const kind = proteins.includes(choice) ? choice : 'patty'
  const compact = slots > 2
  const size = compact ? 72 : 120

  return (
    <div className="flex h-full flex-col gap-1.5">
      {proteins.length > 1 && (
        <div className="flex gap-1.5" role="tablist" aria-label="Proteína para a chapa">
          {proteins.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={id === kind}
              onClick={() => setChoice(id)}
              className={`flex-1 rounded-lg border-[3px] border-ink px-1 ${compact ? 'py-0.5' : 'py-1'} font-display text-[13px] leading-none ${
                id === kind ? 'bg-mustard text-ink' : 'bg-toast-light text-white [text-shadow:0_1px_0_#3B1F0E]'
              }`}
            >
              {SHORT[id]}
            </button>
          ))}
        </div>
      )}
      <div
        className={`relative flex min-h-0 flex-1 items-center justify-between gap-1.5 rounded-[24px] border-4 border-ink px-2 ${slots > 2 ? 'py-1' : 'py-2'} shadow-[inset_0_6px_0_rgba(255,255,255,.12),0_5px_0_rgba(59,31,14,.4)]`}
        style={{
          background:
            'repeating-linear-gradient(90deg, rgba(0,0,0,.35) 0 4px, transparent 4px 18px), radial-gradient(ellipse at 50% 40%, #6F6F78, #3E3E46)',
        }}
      >
        <div className={compact ? 'grid flex-1 grid-cols-2 place-items-center gap-x-1 gap-y-1.5' : 'flex flex-1 items-center justify-around'}>
          {Array.from({ length: slots }, (_, i) => (
            <GrillSlot key={i} slot={i} kind={kind} size={size} compact={compact} />
          ))}
        </div>
        <HeldPlate held={held} />
      </div>
    </div>
  )
}
