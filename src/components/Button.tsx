import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'green' | 'brown'

const COLORS: Record<Variant, string> = {
  primary: 'bg-tomato text-white',
  secondary: 'bg-mustard text-ink',
  green: 'bg-leaf text-white',
  brown: 'bg-toast text-white',
}

interface Props {
  children: ReactNode
  onClick?: () => void
  variant?: Variant
  disabled?: boolean
  className?: string
  'aria-label'?: string
}

/** Botão "gordinho" que afunda ao clicar. */
export function Button({ children, onClick, variant = 'primary', disabled, className = '', ...rest }: Props) {
  return (
    <motion.button
      type="button"
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled}
      aria-label={rest['aria-label']}
      className={`relative flex items-center justify-center gap-2 rounded-2xl border-4 border-ink px-6 py-3 font-display text-xl tracking-wide ${COLORS[variant]} ${
        disabled ? 'opacity-50 grayscale' : ''
      } ${className}`}
      style={{ boxShadow: '0 6px 0 #3B1F0E' }}
      whileHover={disabled ? undefined : { scale: 1.03 }}
      whileTap={disabled ? undefined : { y: 6, boxShadow: '0 0px 0 #3B1F0E' }}
      transition={{ type: 'spring', stiffness: 600, damping: 30 }}
    >
      <span className={variant === 'secondary' ? '' : '[text-shadow:0_2px_0_rgba(59,31,14,.55)]'}>{children}</span>
      <span className="pointer-events-none absolute inset-x-3 top-1 h-2 rounded-full bg-white/30" />
    </motion.button>
  )
}
