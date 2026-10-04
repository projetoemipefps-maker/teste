import { motion } from 'framer-motion'
import type { PointerEvent } from 'react'
import { CUP_SCALE, Cup, SodaMachine } from '@/art'
import { CUP_SIZES, DRINKS, type CupSize } from '@/game/config'
import { cupFillRatio, cupQuality } from '@/game/engine'
import { useGameStore } from '@/game/store'
import { Button } from '../Button'

// Geometria da máquina (viewBox 200×300) para posicionar o copo e o fio de refrigerante por cima.
const MACHINE = { w: 200, h: 300 }
const NOZZLE_BOTTOM = 146
const CUP_BOX = { left: 62, top: 150, width: 76, height: 90 } // área do desenho do copo, em unidades do viewBox
const pct = (v: number, total: number) => `${(v / total) * 100}%`

/** Posição Y (unidades do viewBox da máquina) do nível do líquido dentro do copo. */
function liquidY(size: CupSize, ratio: number): number {
  const level = Math.min(1, Math.max(0, ratio))
  const cupY = 104 - 88 * level // coordenada dentro do desenho do copo (viewBox 80×112)
  const scaled = 108 - (108 - cupY) * CUP_SCALE[size]
  return CUP_BOX.top + (scaled / 112) * CUP_BOX.height
}

function PourButton({ disabled }: { disabled: boolean }) {
  const pouring = useGameStore((s) => s.session.pouring)
  const setPouring = useGameStore((s) => s.setPouring)
  const start = (e: PointerEvent<HTMLButtonElement>) => {
    if (disabled) return
    e.currentTarget.setPointerCapture(e.pointerId)
    setPouring(true)
  }
  const stop = () => setPouring(false)
  return (
    <motion.button
      type="button"
      aria-label="Segurar para encher o copo"
      aria-disabled={disabled}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerCancel={stop}
      onLostPointerCapture={stop}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && !e.repeat && !disabled && setPouring(true)}
      onKeyUp={stop}
      className={`flex h-[66px] w-full touch-none select-none items-center justify-center rounded-2xl border-4 border-ink font-display text-xl leading-tight text-white [text-shadow:0_2px_0_rgba(59,31,14,.55)] ${
        disabled ? 'bg-tomato/50 grayscale' : pouring ? 'bg-tomato-dark' : 'bg-tomato'
      }`}
      style={{ boxShadow: pouring ? '0 0 0 #3B1F0E' : '0 6px 0 #3B1F0E' }}
      animate={{ y: pouring ? 6 : 0 }}
      transition={{ type: 'spring', stiffness: 600, damping: 30 }}
    >
      {disabled ? 'Escolha um copo' : pouring ? 'Enchendo…' : 'Segure para encher'}
    </motion.button>
  )
}

export function DrinkPanel() {
  const cup = useGameStore((s) => s.session.cup)
  const pouring = useGameStore((s) => s.session.pouring)
  const trayHasDrink = useGameStore((s) => s.session.tray.drink !== null)
  const chooseCup = useGameStore((s) => s.chooseCup)
  const cupToTray = useGameStore((s) => s.cupToTray)
  const discardCup = useGameStore((s) => s.discardCup)

  const ratio = cup ? cupFillRatio(cup) : 0
  const quality = cup && cup.fill > 0 ? cupQuality(cup) : null
  const status =
    quality === 'spilled'
      ? { text: 'Derramou!', cls: 'text-tomato-light' }
      : quality === 'good'
        ? { text: 'No ponto!', cls: 'text-[#9BE06F]' }
        : quality === 'low'
          ? { text: 'Ainda falta…', cls: 'text-mustard-light' }
          : { text: cup ? 'Segure o botão' : 'Escolha o tamanho', cls: 'text-white' }
  const surface = cup ? liquidY(cup.size, ratio) : CUP_BOX.top + CUP_BOX.height

  return (
    <div className="flex h-full gap-3">
      <div className="relative h-full shrink-0" style={{ aspectRatio: `${MACHINE.w} / ${MACHINE.h}` }}>
        <SodaMachine className="absolute inset-0 h-full w-full" />
        {/* fio de refrigerante */}
        <motion.div
          className="absolute rounded-full bg-[#5B2A16]"
          style={{ left: pct(98, MACHINE.w), width: pct(4, MACHINE.w), top: pct(NOZZLE_BOTTOM, MACHINE.h), originY: 0 }}
          initial={false}
          animate={{
            height: pouring && cup ? pct(Math.max(4, surface - NOZZLE_BOTTOM), MACHINE.h) : '0%',
            opacity: pouring && cup ? 1 : 0,
          }}
          transition={{ duration: 0.08 }}
        />
        {cup && (
          <motion.div
            key={cup.size}
            className="absolute"
            style={{
              left: pct(CUP_BOX.left, MACHINE.w),
              top: pct(CUP_BOX.top, MACHINE.h),
              width: pct(CUP_BOX.width, MACHINE.w),
              height: pct(CUP_BOX.height, MACHINE.h),
            }}
            initial={{ y: -30, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 16 }}
          >
            <Cup id="machine" size={cup.size} level={ratio} showMin className="h-full w-full overflow-visible" />
            {quality === 'spilled' &&
              [0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="fx-drip absolute h-2 w-1.5 rounded-full bg-[#A66B43]"
                  style={{ left: i % 2 ? '86%' : '8%', top: `${14 + i * 3}%`, ['--delay' as string]: `${i * 0.18}s` }}
                />
              ))}
          </motion.div>
        )}
        {quality === 'spilled' && (
          <motion.span
            className="absolute rounded-[50%] bg-[#5B2A16]"
            style={{ left: '18%', width: '64%', bottom: '4.6%', height: '2.6%' }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
          />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
        <div className="grid grid-cols-3 gap-2">
          {CUP_SIZES.map((size) => {
            const selected = cup?.size === size
            return (
              <motion.button
                key={size}
                type="button"
                aria-label={`Copo ${DRINKS.cups[size].name.toLowerCase()}, ${DRINKS.cups[size].capacity} ml`}
                aria-pressed={selected}
                onClick={() => chooseCup(size)}
                className={`flex h-[74px] flex-col items-center justify-end rounded-xl border-4 border-ink px-1 pb-1 ${
                  selected ? 'bg-mustard' : 'bg-gradient-to-b from-[#FFF8EA] to-cream-dark'
                }`}
                style={{ boxShadow: '0 4px 0 #3B1F0E' }}
                whileTap={{ y: 4, boxShadow: '0 0 0 #3B1F0E' }}
              >
                <Cup id={`pick-${size}`} size={size} level={0} className="h-[42px] w-[42px] overflow-visible" />
                <span className="font-display text-lg leading-none text-ink">{DRINKS.cups[size].short}</span>
                <span className="text-[10px] leading-tight text-ink/70">{DRINKS.cups[size].capacity} ml</span>
              </motion.button>
            )
          })}
        </div>

        <p className={`text-center font-display text-lg leading-none [text-shadow:0_2px_0_#3B1F0E] ${status.cls}`}>{status.text}</p>

        <PourButton disabled={!cup} />

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="green"
            disabled={!cup || cup.fill <= 0 || trayHasDrink}
            onClick={cupToTray}
            className="!rounded-xl !border-[3px] !px-1 !py-1.5 !text-sm"
          >
            Pôr na bandeja
          </Button>
          <Button variant="brown" disabled={!cup} onClick={discardCup} className="!rounded-xl !border-[3px] !px-1 !py-1.5 !text-sm">
            Jogar fora
          </Button>
        </div>
      </div>
    </div>
  )
}
