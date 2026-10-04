import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

export function Modal({ title, children }: { title: string; children: ReactNode }) {
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
        className="w-full max-w-sm rounded-[28px] border-4 border-ink bg-cream p-6 text-center shadow-soft"
        initial={{ scale: 0.6, y: 40, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <h2 className="mb-4 font-display text-4xl text-tomato [text-shadow:0_3px_0_#3B1F0E]">{title}</h2>
        {children}
      </motion.div>
    </motion.div>
  )
}
