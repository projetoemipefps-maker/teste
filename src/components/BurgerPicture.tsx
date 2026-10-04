import { AnimatePresence, motion } from 'framer-motion'
import type { IngredientId } from '@/game/config'
import type { PattyQuality } from '@/game/engine'
import { ART_HEIGHT, ART_OVERLAP, ART_WIDTH, IngredientArt } from '@/art'

interface Props {
  ingredients: readonly IngredientId[]
  /** Ponto de cada carne, na ordem em que aparecem (padrão: no ponto). */
  patties?: readonly PattyQuality[]
  width: number
  /** Ingredientes caem de cima e saem animados (usado na bancada). */
  animated?: boolean
  className?: string
}

/** Desenho do lanche: camadas empilhadas de baixo para cima, alinhadas pela base. */
export function BurgerPicture({ ingredients, patties = [], width, animated = false, className = '' }: Props) {
  const scale = width / ART_WIDTH
  // Renderiza de cima para baixo (a última camada vem primeiro no DOM).
  let pattyCount = 0
  const layers = ingredients
    .map((id, i) => ({ id, i, quality: id === 'patty' ? (patties[pattyCount++] ?? 'perfect') : undefined }))
    .reverse()

  const item = ({ id, i, quality }: { id: IngredientId; i: number; quality: PattyQuality | undefined }) => {
    const style = {
      height: ART_HEIGHT[id] * scale,
      // A camada de cima se sobrepõe à de baixo; o margin vai na camada de cima.
      marginBottom: -ART_OVERLAP[id] * scale,
      zIndex: i,
      position: 'relative' as const,
    }
    const art = <IngredientArt id={id} quality={quality} className="h-full w-full overflow-visible drop-shadow-[0_2px_0_rgba(59,31,14,.25)]" />
    if (!animated) return <div key={i} style={style}>{art}</div>
    return (
      <motion.div
        key={`${i}-${id}-${quality ?? ''}`}
        style={style}
        initial={{ y: -280, opacity: 0, rotate: i % 2 ? 8 : -8, scaleY: 0.8 }}
        animate={{ y: 0, opacity: 1, rotate: 0, scaleY: 1 }}
        exit={{ y: -30, opacity: 0, scale: 0.5, transition: { duration: 0.25 } }}
        transition={{ type: 'spring', stiffness: 420, damping: 17 }}
      >
        {art}
      </motion.div>
    )
  }

  return (
    <div className={`flex flex-col items-center justify-end ${className}`} style={{ width }}>
      {animated ? <AnimatePresence>{layers.map(item)}</AnimatePresence> : layers.map(item)}
    </div>
  )
}
