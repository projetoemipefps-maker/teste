import { useLayoutEffect, useRef, useState } from 'react'
import { DecorArt, SceneFloor, SceneWall } from '@/art'
import { useGameStore } from '@/game/store'
import { CustomerSlot } from './CustomerSlot'
import { COUNTER_HEIGHT, COUNTER_TOP_HEIGHT, Canopy, CounterTop, FacadeStrip } from './scene/Facade'

const FLOOR_HEIGHT = 50
/** Margem lateral da fileira de clientes (px). */
const SIDE_PADDING = 8

/** Largura do elemento (px de projeto), acompanhando redimensionamentos. */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(390)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setWidth(el.clientWidth || 390)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, width] as const
}

/**
 * Balcão da hamburgueria: a fachada com a decoração, a parede e o piso da fase, os clientes
 * (de 3 a 6 lugares, conforme as melhorias) e o tampo do balcão na frente.
 */
export function Counter() {
  const seats = useGameStore((s) => s.session.slots.length)
  const venue = useGameStore((s) => s.player.venue)
  const decor = useGameStore((s) => s.player.decor)
  const [ref, width] = useWidth<HTMLElement>()
  const slotWidth = (width - SIDE_PADDING * 2) / seats

  return (
    <>
      <FacadeStrip />
      <section ref={ref} className="relative flex-none overflow-hidden border-b-4 border-ink" style={{ height: COUNTER_HEIGHT }}>
        <SceneWall venue={venue} tier={decor.wall} className="absolute inset-0 z-0" />
        <div className="absolute inset-x-0 z-[1] border-t-4 border-ink" style={{ bottom: COUNTER_TOP_HEIGHT, height: FLOOR_HEIGHT }}>
          <SceneFloor venue={venue} tier={decor.floor} className="absolute inset-0" />
        </div>
        {decor.tables > 0 &&
          ['33%', '67%'].map((left) => (
            <DecorArt
              key={left}
              id="tables"
              tier={decor.tables}
              className="absolute z-[2] h-[48px] w-[58px] -translate-x-1/2"
              style={{ left, bottom: COUNTER_TOP_HEIGHT + 2 }}
            />
          ))}
        <Canopy venue={venue} />
        <div
          className="absolute inset-x-0 top-[6px] z-[15] grid"
          style={{ bottom: COUNTER_TOP_HEIGHT, paddingInline: SIDE_PADDING, gridTemplateColumns: `repeat(${seats}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: seats }, (_, i) => (
            <CustomerSlot key={i} slot={i} seats={seats} slotWidth={slotWidth} />
          ))}
        </div>
        <CounterTop />
      </section>
    </>
  )
}
