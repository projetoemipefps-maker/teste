import { motion } from 'framer-motion'
import { useState } from 'react'
import type { PointerEvent } from 'react'
import { CUP_SCALE, Cup, SodaMachine } from '@/art'
import { CUP_SIZES, DRINKS, DRINK_CONFIG, DRINK_KINDS, TRAY, UI_LIMITS, type CupSize, type DrinkKind } from '@/game/config'
import { canChooseCup, cupFillRatio, cupQuality, equipmentTier, unlockedDrinkKinds } from '@/game/engine'
import { useGameStore } from '@/game/store'
import { Button } from '../Button'

// Geometria da máquina (viewBox 200×300) para posicionar o copo e o fio da bebida por cima.
const MACHINE = { w: 200, h: 300 }
const NOZZLE_BOTTOM = 146
const CUP_BOX = { left: 62, top: 150, width: 76, height: 90 } // área do desenho do copo, em unidades do viewBox
const pct = (v: number, total: number) => `${(v / total) * 100}%`

const MACHINE_LOOK: Record<DrinkKind, { label: string; body: string; shade: string }> = {
  soda: { label: 'REFRI', body: '#E63B2E', shade: '#7E1F18' },
  juice: { label: 'SUCO', body: '#F28C28', shade: '#8A4A12' },
  shakeChocolate: { label: 'SHAKE', body: '#8B5A36', shade: '#3E2414' },
  shakeStrawberry: { label: 'SHAKE', body: '#E86FA0', shade: '#8A2E55' },
  shakeVanilla: { label: 'SHAKE', body: '#E8C468', shade: '#8A6A1E' },
}
const STREAM_COLOR: Record<DrinkKind, string> = {
  soda: '#5B2A16',
  juice: '#F5A623',
  shakeChocolate: '#6B3A22',
  shakeStrawberry: '#F28BA8',
  shakeVanilla: '#F3DDA6',
}

/** Posição Y (unidades do viewBox da máquina) do nível do líquido dentro do copo. */
function liquidY(size: CupSize, ratio: number): number {
  const level = Math.min(1, Math.max(0, ratio))
  const cupY = 104 - 88 * level // coordenada dentro do desenho do copo (viewBox 80×112)
  const scaled = 108 - (108 - cupY) * CUP_SCALE[size]
  return CUP_BOX.top + (scaled / 112) * CUP_BOX.height
}

function PourButton({ disabled }: { disabled: boolean }) {
  const pouring = useGameStore((s) => s.session.pouring)
  const auto = useGameStore((s) => s.session.perks.drinkAuto)
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
      className={`flex h-[58px] w-full touch-none select-none items-center justify-center rounded-2xl border-4 border-ink font-display text-xl leading-tight text-white [text-shadow:0_2px_0_rgba(59,31,14,.55)] ${
        disabled ? 'bg-tomato/50 grayscale' : pouring ? 'bg-tomato-dark' : 'bg-tomato'
      }`}
      style={{ boxShadow: pouring ? '0 0 0 #3B1F0E' : '0 6px 0 #3B1F0E' }}
      animate={{ y: pouring ? 6 : 0 }}
      transition={{ type: 'spring', stiffness: 600, damping: 30 }}
    >
      {disabled ? 'Escolha um copo' : pouring ? 'Enchendo…' : auto ? 'Segure: para sozinho' : 'Segure para encher'}
    </motion.button>
  )
}

export function DrinkPanel() {
  const session = useGameStore((s) => s.session)
  const { cup, pouring } = session
  const trayFull = useGameStore((s) => s.session.tray.drinks.length >= TRAY.drinks)
  const chooseCup = useGameStore((s) => s.chooseCup)
  const cupToTray = useGameStore((s) => s.cupToTray)
  const discardCup = useGameStore((s) => s.discardCup)
  const kinds = DRINK_KINDS.filter((k) => unlockedDrinkKinds(session.level).includes(k))
  const [choice, setChoice] = useState<DrinkKind>('soda')
  const kind = kinds.includes(choice) ? choice : 'soda'
  const cfg = DRINK_CONFIG[kind]
  const look = MACHINE_LOOK[cup?.kind ?? kind]
  const tier = useGameStore((s) => equipmentTier(s.player, 'drinks'))
  const auto = session.perks.drinkAuto

  const ratio = cup ? cupFillRatio(cup) : 0
  const quality = cup && cup.fill > 0 ? cupQuality(cup) : null
  const status =
    quality === 'spilled'
      ? { text: 'Derramou!', cls: 'text-tomato-light' }
      : quality === 'good'
        ? { text: 'No ponto!', cls: 'text-[#9BE06F]' }
        : quality === 'low'
          ? { text: 'Ainda falta…', cls: 'text-mustard-light' }
          : { text: cup ? (auto ? 'Segure: eu paro no ponto' : 'Segure o botão') : 'Escolha o tamanho', cls: 'text-white' }
  const surface = cup ? liquidY(cup.size, ratio) : CUP_BOX.top + CUP_BOX.height
  const stock = session.stock[cfg.stock]

  return (
    <div className="flex h-full flex-col gap-1.5">
      {kinds.length > 1 && (
        <div className="flex gap-1" role="tablist" aria-label="Bebida">
          {kinds.map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={k === kind}
              onClick={() => setChoice(k)}
              className={`flex-1 rounded-lg border-[3px] border-ink px-0.5 py-1 font-display text-[11px] leading-none ${
                k === kind ? 'bg-mustard text-ink' : 'bg-toast-light text-white [text-shadow:0_1px_0_#3B1F0E]'
              }`}
            >
              {DRINK_CONFIG[k].short}
            </button>
          ))}
        </div>
      )}
      <div className="flex min-h-0 flex-1 gap-3">
        <div className="relative h-full shrink-0 self-start" style={{ aspectRatio: `${MACHINE.w} / ${MACHINE.h}`, maxHeight: '100%' }}>
          <SodaMachine className="absolute inset-0 h-full w-full" label={look.label} body={look.body} shade={look.shade} tier={tier} />
          <motion.div
            className="absolute rounded-full"
            style={{ left: pct(98, MACHINE.w), width: pct(4, MACHINE.w), top: pct(NOZZLE_BOTTOM, MACHINE.h), originY: 0, background: STREAM_COLOR[cup?.kind ?? kind] }}
            initial={false}
            animate={{
              height: pouring && cup ? pct(Math.max(4, surface - NOZZLE_BOTTOM), MACHINE.h) : '0%',
              opacity: pouring && cup ? 1 : 0,
            }}
            transition={{ duration: 0.08 }}
          />
          {cup && (
            <motion.div
              key={`${cup.kind}-${cup.size}`}
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
              <Cup id="machine" kind={cup.kind} size={cup.size} level={ratio} showMin className="h-full w-full overflow-visible" />
              {quality === 'spilled' &&
                [0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className="fx-drip absolute h-2 w-1.5 rounded-full"
                    style={{ left: i % 2 ? '86%' : '8%', top: `${14 + i * 3}%`, background: STREAM_COLOR[cup.kind], filter: 'brightness(1.5)', ['--delay' as string]: `${i * 0.18}s` }}
                  />
                ))}
            </motion.div>
          )}
          {quality === 'spilled' && (
            <motion.span
              className="absolute rounded-[50%]"
              style={{ left: '18%', width: '64%', bottom: '4.6%', height: '2.6%', background: STREAM_COLOR[cup?.kind ?? kind] }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
            />
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between gap-1.5">
          <div className="grid grid-cols-3 gap-2">
            {CUP_SIZES.map((size) => {
              const selected = cup?.kind === kind && cup.size === size
              const available = canChooseCup(session, kind, size) || selected
              return (
                <motion.button
                  key={size}
                  type="button"
                  aria-label={`Copo ${DRINKS.cups[size].name.toLowerCase()} de ${cfg.name.toLowerCase()}, ${DRINKS.cups[size].capacity} ml`}
                  aria-pressed={selected}
                  disabled={!available}
                  onClick={() => chooseCup(kind, size)}
                  className={`relative flex h-[66px] flex-col items-center justify-end rounded-xl border-4 border-ink px-1 pb-1 ${
                    selected ? 'bg-mustard' : 'bg-gradient-to-b from-[#FFF8EA] to-cream-dark'
                  } ${available ? '' : 'opacity-40 grayscale'}`}
                  style={{ boxShadow: '0 4px 0 #3B1F0E' }}
                  whileTap={{ y: 4, boxShadow: '0 0 0 #3B1F0E' }}
                >
                  <Cup id={`pick-${size}`} kind={kind} size={size} level={0} className="h-[36px] w-[36px] overflow-visible" />
                  <span className="font-display text-base leading-none text-ink">{DRINKS.cups[size].short}</span>
                  <span className="text-[10px] leading-tight text-ink/70">{available ? `${DRINKS.cups[size].capacity} ml` : 'Sem estoque'}</span>
                </motion.button>
              )
            })}
          </div>

          <p className={`text-center font-display text-lg leading-none [text-shadow:0_2px_0_#3B1F0E] ${status.cls}`}>{status.text}</p>
          <p className="-mt-1 text-center text-[11px] leading-none text-white [text-shadow:0_1px_0_#3B1F0E]">
            {cfg.name} no estoque: <b className={stock <= UI_LIMITS.lowStock ? 'text-mustard-light' : ''}>{stock}</b> un
          </p>

          <PourButton disabled={!cup} />

          <div className="grid grid-cols-2 gap-2">
            <Button variant="green" disabled={!cup || cup.fill <= 0 || trayFull} onClick={cupToTray} className="!rounded-xl !border-[3px] !px-1 !py-1.5 !text-sm">
              Pôr na bandeja
            </Button>
            <Button variant="brown" disabled={!cup} onClick={discardCup} className="!rounded-xl !border-[3px] !px-1 !py-1.5 !text-sm">
              Jogar fora
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
