import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Coin } from '@/art'
import { onGameEvent } from '@/game/loop/eventBus'

interface Fx {
  id: number
  kind: 'coin' | 'text'
  x: number
  y: number
  dx: number
  dy: number
  delay: number
  text?: string
  tone?: 'good' | 'bad'
}

let seq = 0

function center(selector: string): { x: number; y: number } | null {
  const el = document.querySelector(selector)
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}

/** Camada acima de tudo: moedas voando até o contador e textos flutuantes. */
export function EffectsLayer() {
  const [fx, setFx] = useState<Fx[]>([])
  const remove = (id: number) => setFx((list) => list.filter((f) => f.id !== id))

  useEffect(
    () =>
      onGameEvent((e) => {
        if (e.type === 'customerServed' || e.type === 'customerLost') {
          const from = center(`[data-slot="${e.slot}"]`)
          if (!from) return
          const start = { x: from.x, y: from.y - 10 }
          const added: Fx[] = []
          if (e.type === 'customerServed') {
            const target = center('[data-money]')
            if (target && e.total > 0) {
              const coins = Math.min(8, Math.max(3, Math.ceil(e.total / 4)))
              for (let i = 0; i < coins; i++) {
                added.push({
                  id: ++seq,
                  kind: 'coin',
                  ...start,
                  dx: target.x - start.x,
                  dy: target.y - start.y,
                  delay: i * 0.07,
                })
              }
            }
            added.push({
              id: ++seq,
              kind: 'text',
              ...start,
              dx: 0,
              dy: -50,
              delay: 0,
              text: e.correct ? `+R$ ${e.total}` : 'Pedido errado!',
              tone: e.correct ? 'good' : 'bad',
            })
          } else {
            added.push({ id: ++seq, kind: 'text', ...start, dx: 0, dy: -50, delay: 0, text: 'Foi embora!', tone: 'bad' })
          }
          setFx((list) => [...list, ...added])
        }
        if (e.type === 'leveledUp') {
          setFx((list) => [
            ...list,
            { id: ++seq, kind: 'text', x: window.innerWidth / 2, y: window.innerHeight * 0.3, dx: 0, dy: -60, delay: 0.3, text: `Nível ${e.level}!`, tone: 'good' },
          ])
        }
      }),
    [],
  )

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      <AnimatePresence>
        {fx.map((f) =>
          f.kind === 'coin' ? (
            <motion.div
              key={f.id}
              className="absolute h-8 w-8"
              style={{ left: f.x - 16, top: f.y - 16 }}
              initial={{ x: 0, y: 0, scale: 0.4, opacity: 0 }}
              animate={{
                x: [0, f.dx * 0.35 + (f.id % 3 - 1) * 30, f.dx],
                y: [0, -70 - (f.id % 4) * 10, f.dy],
                scale: [0.4, 1.1, 0.7],
                opacity: [0, 1, 1],
                rotate: [0, 180, 360],
              }}
              transition={{ duration: 0.85, delay: f.delay, ease: 'easeInOut' }}
              onAnimationComplete={() => remove(f.id)}
            >
              <Coin className="h-full w-full drop-shadow-[0_2px_0_rgba(59,31,14,.4)]" />
            </motion.div>
          ) : (
            <motion.div
              key={f.id}
              className={`absolute -translate-x-1/2 whitespace-nowrap font-display text-2xl ${f.tone === 'good' ? 'text-mustard-light' : 'text-tomato-light'}`}
              style={{ left: f.x, top: f.y, WebkitTextStroke: '6px #3B1F0E', paintOrder: 'stroke fill' }}
              initial={{ y: 0, scale: 0.4, opacity: 0 }}
              animate={{ y: f.dy, scale: [0.4, 1.2, 1], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 1.3, delay: f.delay, times: [0, 0.2, 0.7, 1] }}
              onAnimationComplete={() => remove(f.id)}
            >
              {f.text}
            </motion.div>
          ),
        )}
      </AnimatePresence>
    </div>
  )
}
