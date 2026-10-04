import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { useEffect } from 'react'

interface Props {
  value: number
  delay?: number
  duration?: number
  format?: (v: number) => string
  className?: string
}

/** Número que "sobe" até o valor final (usado no resumo do dia). */
export function CountUp({ value, delay = 0, duration = 0.9, format = (v) => String(Math.round(v)), className }: Props) {
  const mv = useMotionValue(0)
  const text = useTransform(mv, format)
  useEffect(() => {
    const controls = animate(mv, value, { duration, delay, ease: 'easeOut' })
    return () => controls.stop()
  }, [value, duration, delay, mv])
  return <motion.span className={`tabular-nums ${className ?? ''}`}>{text}</motion.span>
}
