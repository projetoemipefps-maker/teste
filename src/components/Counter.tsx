import { Awning } from '@/art'
import { CUSTOMERS } from '@/game/config'
import { CustomerSlot } from './CustomerSlot'

/** Balcão da hamburgueria: toldo, clientes e a bancada de madeira na frente. */
export function Counter() {
  return (
    <section
      className="relative min-h-[262px] flex-[1.1] overflow-hidden border-b-4 border-ink"
      style={{
        background:
          'linear-gradient(rgba(59,31,14,.07) 2px, transparent 2px) 0 0/44px 44px, linear-gradient(90deg, rgba(59,31,14,.07) 2px, transparent 2px) 0 0/44px 44px, #FFF3DC',
      }}
    >
      <Awning className="absolute inset-x-0 top-0 z-10 h-[40px] w-full drop-shadow-[0_4px_0_rgba(59,31,14,.25)]" />
      <div
        className="absolute inset-x-0 top-[6px] bottom-[34px] z-[15] grid px-2"
        style={{ gridTemplateColumns: `repeat(${CUSTOMERS.maxSlots}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: CUSTOMERS.maxSlots }, (_, i) => (
          <CustomerSlot key={i} slot={i} />
        ))}
      </div>
      {/* tampo do balcão */}
      <div className="absolute inset-x-0 bottom-0 z-20 h-[34px] border-t-4 border-ink bg-toast-light">
        <div className="h-2.5 bg-[#E3A86A]" />
        <div className="h-full bg-toast shadow-[inset_0_6px_0_rgba(0,0,0,.12)]" />
      </div>
    </section>
  )
}
