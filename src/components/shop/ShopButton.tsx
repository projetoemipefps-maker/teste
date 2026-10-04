import { motion, useAnimationControls } from 'framer-motion'
import { Coin, LockIcon } from '@/art'
import type { Blocker } from '@/game/engine'
import { formatMoney } from '../format'

interface Props {
  cost: number
  blocker: Blocker | null
  /** Quanto falta de dinheiro (só quando o bloqueio é dinheiro). */
  missing?: number
  /** Texto do requisito quando falta nível ou fase (ex.: "Nível 10"). */
  requirement?: string
  onBuy: () => void
  label?: string
}

/** Botão de compra: verde quando dá, treme (sem comprar) quando falta dinheiro e vira cadeado quando falta nível ou fase. */
export function ShopButton({ cost, blocker, missing = 0, requirement, onBuy, label = 'Comprar' }: Props) {
  const controls = useAnimationControls()

  if (blocker === 'maxed') {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-xl border-[3px] border-ink bg-leaf px-2.5 py-1.5 font-display text-sm leading-none text-white">
        Máximo
      </span>
    )
  }
  if (blocker === 'level' || blocker === 'venue' || blocker === 'closed') {
    return (
      <span
        className="inline-flex shrink-0 items-center gap-1 rounded-xl border-[3px] border-ink bg-cream-dark px-2 py-1.5 font-display text-[13px] leading-tight text-ink"
        aria-label={`Bloqueado: ${requirement ?? ''}`}
      >
        <LockIcon className="h-4 w-4" /> {requirement}
      </span>
    )
  }

  const short = blocker === 'money'
  const press = () => {
    if (short) {
      void controls.start({ x: [0, -9, 9, -7, 7, -3, 0], transition: { duration: 0.38 } })
      return
    }
    onBuy()
  }
  return (
    <motion.button
      type="button"
      onClick={press}
      animate={controls}
      whileTap={{ y: short ? 0 : 3, boxShadow: '0 0 0 #3B1F0E' }}
      aria-label={`${label} por ${formatMoney(cost)}${short ? `. Faltam ${formatMoney(missing)}` : ''}`}
      className={`flex shrink-0 flex-col items-center rounded-xl border-[3px] border-ink px-2.5 py-1 ${short ? 'bg-tomato/15 text-ink' : 'bg-leaf text-white'}`}
      style={{ boxShadow: '0 3px 0 #3B1F0E' }}
    >
      <span className="flex items-center gap-1 font-display text-base leading-none">
        <Coin className="h-4 w-4" />
        {formatMoney(cost).replace('R$ ', '')}
      </span>
      <span className={`text-[10px] font-bold leading-tight ${short ? 'text-tomato-dark' : 'text-white/90'}`}>
        {short ? `faltam ${formatMoney(missing)}` : label}
      </span>
    </motion.button>
  )
}
