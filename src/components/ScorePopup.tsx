import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Star } from '@/art'
import { UI_TIMING } from '@/game/config'
import type { GameEvent, ServiceNote } from '@/game/engine'
import { onGameEvent } from '@/game/loop/eventBus'

type Served = Extract<GameEvent, { type: 'customerServed' }>

const NOTE_TEXT: Record<ServiceNote, { text: string; good: boolean }> = {
  burgerMissing: { text: 'Faltou o lanche', good: false },
  burgerWrong: { text: 'Lanche errado', good: false },
  pattyRaw: { text: 'Carne crua', good: false },
  pattyOverdone: { text: 'Carne passada', good: false },
  pattyPerfect: { text: 'Carne no ponto!', good: true },
  friesMissing: { text: 'Faltou a batata', good: false },
  friesStale: { text: 'Batata murcha', good: false },
  drinkMissing: { text: 'Faltou a bebida', good: false },
  drinkWrongSize: { text: 'Copo de outro tamanho', good: false },
  drinkLow: { text: 'Refri pela metade', good: false },
  drinkSpilled: { text: 'Refri derramou', good: false },
  fast: { text: 'Atendimento rápido!', good: true },
  slow: { text: 'Demorou demais', good: false },
}

const HEADLINE = ['Que desastre!', 'Podia ser melhor', 'Tudo bem', 'Muito bom!', 'Perfeito!']

function Row({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${strong ? 'font-display text-xl text-tomato' : 'text-sm text-ink'}`}>
      <span>{label}</span>
      <span className="whitespace-nowrap tabular-nums">R$ {value}</span>
    </div>
  )
}

/** Popup animado com a nota do atendimento, o valor recebido e a gorjeta. */
export function ScorePopup() {
  const [served, setServed] = useState<(Served & { key: number }) | null>(null)

  useEffect(() => {
    let key = 0
    let timer: ReturnType<typeof setTimeout> | undefined
    const off = onGameEvent((e) => {
      if (e.type !== 'customerServed') return
      clearTimeout(timer)
      setServed({ ...e, key: ++key })
      timer = setTimeout(() => setServed(null), UI_TIMING.scorePopupMs)
    })
    return () => {
      off()
      clearTimeout(timer)
    }
  }, [])

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[38%] z-[45] flex justify-center px-6">
      <AnimatePresence mode="wait">
        {served && (
          <motion.div
            key={served.key}
            role="status"
            aria-live="polite"
            className="w-full max-w-[270px] rounded-[26px] border-4 border-ink bg-cream px-4 pb-3 pt-2.5 shadow-soft"
            initial={{ scale: 0.4, y: 40, opacity: 0, rotate: -4 }}
            animate={{ scale: 1, y: 0, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.8, y: -30, opacity: 0, transition: { duration: 0.25 } }}
            transition={{ type: 'spring', stiffness: 320, damping: 16 }}
          >
            <p className="text-center font-display text-lg leading-none text-ink">{HEADLINE[served.stars - 1]}</p>
            <div className="mt-1 flex justify-center">
              {Array.from({ length: 5 }, (_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 12, delay: 0.15 + i * 0.1 }}
                >
                  <Star id={`score-${served.key}-${i}`} amount={i < served.stars ? 1 : 0} className="h-9 w-9" />
                </motion.div>
              ))}
            </div>
            <div className="mt-1 flex flex-col gap-0.5 rounded-xl border-[3px] border-ink bg-white px-2.5 py-1.5">
              <Row label="Itens" value={served.itemsPaid} />
              <Row label="Gorjeta" value={served.tip} />
              {served.bonus > 0 && <Row label="Carne no ponto" value={served.bonus} />}
              <div className="my-0.5 h-0.5 rounded bg-ink/15" />
              <Row label="Total" value={served.total} strong />
            </div>
            <div className="mt-1.5 flex flex-wrap justify-center gap-1">
              {served.notes.slice(0, 5).map((n, i) => (
                <motion.span
                  key={n}
                  className={`rounded-full border-2 border-ink px-2 py-0.5 text-[11px] leading-none ${NOTE_TEXT[n].good ? 'bg-leaf text-white' : 'bg-tomato text-white'}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 14, delay: 0.5 + i * 0.07 }}
                >
                  {NOTE_TEXT[n].text}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
