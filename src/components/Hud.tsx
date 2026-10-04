import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { Coin, ClockIcon, PauseIcon, Star, SunIcon } from '@/art'
import { PROGRESSION } from '@/game/config'
import { formatClock, isClosing, isPeak, starFill, xpProgress, xpToNext } from '@/game/engine'
import { useGameStore } from '@/game/store'

function Chip({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border-[3px] border-ink bg-cream px-2.5 py-px font-display text-base text-ink shadow-[0_3px_0_rgba(59,31,14,.4)] ${className}`}>
      {children}
    </div>
  )
}

/** Dinheiro com contagem animada; espera as moedas chegarem para somar. */
function Money() {
  const money = useGameStore((s) => s.player.money)
  const mv = useMotionValue(money)
  const text = useTransform(mv, (v) => Math.round(v).toString())
  const controls = useRef<ReturnType<typeof animate> | null>(null)
  const bump = useMotionValue(1)
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    controls.current?.stop()
    controls.current = animate(mv, money, { duration: 0.5, delay: 0.75, ease: 'easeOut' })
    animate(bump, [1, 1.3, 1], { duration: 0.35, delay: 0.75 })
  }, [money, mv, bump])

  return (
    <motion.div style={{ scale: bump }} data-money>
      <Chip>
        <Coin className="h-6 w-6" />
        <span className={money < 0 ? 'text-tomato-dark' : 'text-ink'}>R$</span>
        <motion.span className={`min-w-[1.5ch] tabular-nums ${money < 0 ? 'text-tomato-dark' : ''}`}>{text}</motion.span>
      </Chip>
    </motion.div>
  )
}

function Level() {
  const level = useGameStore((s) => s.player.level)
  const xp = useGameStore((s) => s.player.xp)
  const progress = xpProgress(level, xp)
  return (
    <div className="flex min-w-0 flex-1 items-center">
      <motion.div
        key={level}
        initial={{ scale: 1.6, rotate: -15 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 12 }}
        className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border-4 border-ink bg-mustard font-display text-xl text-ink shadow-[0_3px_0_rgba(59,31,14,.4)]"
        aria-label={`Nível ${level}`}
      >
        {level}
      </motion.div>
      <div className="-ml-3 flex-1 pl-3">
        <div className="relative h-5 overflow-hidden rounded-full border-[3px] border-ink bg-ink/40">
          <motion.div
            className="h-full rounded-full bg-gradient-to-b from-[#9BE06F] to-leaf"
            animate={{ width: `${progress * 100}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          />
          <span className="absolute inset-0 grid place-items-center font-display text-[11px] leading-none text-white [text-shadow:0_1px_0_#3B1F0E,1px_0_0_#3B1F0E,-1px_0_0_#3B1F0E]">
            {level >= PROGRESSION.maxLevel ? 'MÁX' : `${Math.floor(xp)} / ${xpToNext(level)} XP`}
          </span>
        </div>
      </div>
    </div>
  )
}

function Stars() {
  const rep = useGameStore((s) => s.player.reputation)
  const setPaused = useGameStore((s) => s.setPaused)
  const setReviewsOpen = useGameStore((s) => s.setReviewsOpen)
  return (
    <motion.button
      type="button"
      aria-label={`Reputação ${rep.toFixed(1)} de 5 estrelas. Ver avaliações`}
      onClick={() => {
        setPaused(true)
        setReviewsOpen(true)
      }}
      whileTap={{ scale: 0.92 }}
      className="flex"
    >
      {Array.from({ length: PROGRESSION.maxReputation }, (_, i) => (
        <Star key={i} id={`hud-star-${i}`} amount={starFill(rep, i)} className="-mx-px h-6 w-6" />
      ))}
    </motion.button>
  )
}

function Clock() {
  const text = useGameStore((s) => formatClock(s.session.elapsed))
  const peak = useGameStore((s) => isPeak(s.session.elapsed) && !isClosing(s.session.elapsed))
  const closing = useGameStore((s) => isClosing(s.session.elapsed))
  return (
    <div className="relative">
      <Chip>
        <ClockIcon className="h-6 w-6" />
        <span className="tabular-nums">{text}</span>
      </Chip>
      {(peak || closing) && (
        <motion.span
          key={closing ? 'closing' : 'peak'}
          className={`absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border-2 border-ink px-2 py-px font-display text-[10px] leading-tight ${closing ? 'bg-cream text-ink' : 'fx-pulse bg-mustard text-ink'}`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          {closing ? 'Fechando!' : 'Hora do pico!'}
        </motion.span>
      )}
    </div>
  )
}

export function Hud() {
  const day = useGameStore((s) => s.player.day)
  const setPaused = useGameStore((s) => s.setPaused)
  return (
    <header className="relative z-30 rounded-b-[26px] border-b-4 border-ink bg-gradient-to-b from-tomato-light to-tomato px-3 pb-2 pt-2 shadow-[0_5px_0_rgba(59,31,14,.35)]">
      <div className="flex items-center gap-2">
        <Level />
        <Money />
        <motion.button
          type="button"
          aria-label="Pausar"
          onClick={() => setPaused(true)}
          whileTap={{ scale: 0.88, y: 3 }}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border-4 border-ink bg-toast shadow-[0_4px_0_#3B1F0E]"
        >
          <PauseIcon className="h-6 w-6" />
        </motion.button>
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <Chip>
          <SunIcon className="h-6 w-6" />
          <span>Dia {day}</span>
        </Chip>
        <Clock />
        <Stars />
      </div>
    </header>
  )
}
