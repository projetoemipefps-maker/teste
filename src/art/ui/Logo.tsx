import { motion } from 'framer-motion'
import { BunBottom, BunTop, Cheese, Lettuce, Patty, Tomato } from '../ingredients'

const LAYERS = [
  { C: BunTop, h: 72, x: 0 },
  { C: Lettuce, h: 34, x: 0 },
  { C: Cheese, h: 30, x: 0 },
  { C: Tomato, h: 26, x: 0 },
  { C: Patty, h: 38, x: 0 },
  { C: BunBottom, h: 40, x: 0 },
]

/** Logo animado: hambúrguer que respira e título em fonte grossa. */
export function Logo() {
  return (
    <div className="flex flex-col items-center">
      <motion.div
        className="relative w-40"
        animate={{ y: [0, -8, 0], rotate: [-2, 2, -2] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="flex flex-col items-center">
          {LAYERS.map(({ C, h }, i) => (
            <motion.div
              key={i}
              className="w-full"
              style={{ height: h * 0.9, marginTop: i === 0 ? 0 : -6, zIndex: 10 - i }}
              initial={{ y: -220, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.15 * (LAYERS.length - i) }}
            >
              <C className="h-full w-full overflow-visible" />
            </motion.div>
          ))}
        </div>
      </motion.div>
      <motion.h1
        className="mt-3 text-center font-display text-6xl leading-[0.95] text-mustard sm:text-7xl"
        style={{
          WebkitTextStroke: '8px #3B1F0E',
          paintOrder: 'stroke fill',
          textShadow: '0 6px 0 #3B1F0E, 0 10px 14px rgba(0,0,0,.35)',
        }}
        initial={{ scale: 0, rotate: -8 }}
        animate={{ scale: 1, rotate: -3 }}
        transition={{ type: 'spring', stiffness: 220, damping: 10, delay: 1.1 }}
      >
        Brasa
        <br />
        <span className="text-tomato-light">Burger</span>
      </motion.h1>
    </div>
  )
}
