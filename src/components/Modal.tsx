import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

/** `compact`: título menor e margens curtas, para janelas com conteúdo longo (rola por dentro). */
export function Modal({ title, children, compact = false }: { title: string; children: ReactNode; compact?: boolean }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-5 backdrop-blur-[2px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        role="dialog"
        aria-label={title}
        className={`w-full max-w-sm rounded-[28px] border-4 border-ink bg-cream text-center shadow-soft ${compact ? 'p-4' : 'p-6'}`}
        initial={{ scale: 0.6, y: 40, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <h2 className={`font-display text-tomato [text-shadow:0_3px_0_#3B1F0E] ${compact ? 'mb-2 text-3xl' : 'mb-4 text-4xl'}`}>{title}</h2>
        {children}
      </motion.div>
    </motion.div>
  )
}
