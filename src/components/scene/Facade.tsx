import { Awning, BulbBeam, ChainCanopy, DecorArt, FacadeSign, SceneWall } from '@/art'
import type { VenueId } from '@/game/config'
import { equipmentTier } from '@/game/engine'
import { useGameStore } from '@/game/store'

/** Altura da faixa da fachada (parede com letreiro e decoração) e da área dos clientes; a cozinha é projetada para isso. */
export const FACADE_HEIGHT = 52
export const COUNTER_HEIGHT = 232
/** Altura do tampo do balcão na frente dos clientes. */
export const COUNTER_TOP_HEIGHT = 34

const CANOPY: Record<VenueId, 'awning' | 'awning2' | 'beam' | 'chain'> = { stall: 'awning', snackbar: 'awning2', craft: 'beam', chain: 'chain' }

/** Cobertura da frente do balcão: toldo, viga com lâmpadas ou marquise, conforme a fase. */
export function Canopy({ venue }: { venue: VenueId }) {
  const cls = 'absolute inset-x-0 top-0 z-10 h-[40px] w-full drop-shadow-[0_4px_0_rgba(59,31,14,.25)]'
  switch (CANOPY[venue]) {
    case 'awning':
      return <Awning className={cls} />
    case 'awning2':
      return <Awning className={cls} primary="#3E86D6" secondary="#FFF3DC" />
    case 'beam':
      return <BulbBeam className={cls} />
    case 'chain':
      return <ChainCanopy className={cls} />
  }
}

/**
 * Faixa da fachada, acima do balcão: a parede da fase com o letreiro no meio e a decoração comprada
 * (jukebox, TV, plantas, lâmpadas e neon). Quanto mais itens, mais bonita a cena.
 */
export function FacadeStrip() {
  const venue = useGameStore((s) => s.player.venue)
  const decor = useGameStore((s) => s.player.decor)
  return (
    <div className="relative flex-none overflow-hidden border-b-4 border-ink" style={{ height: FACADE_HEIGHT }} data-facade>
      <SceneWall venue={venue} tier={decor.wall} className="absolute inset-0" />
      <div className="absolute inset-x-0 top-0 h-[7px] bg-ink/15" />
      <div className="absolute inset-x-0 top-[9px] flex justify-center">
        <FacadeSign venue={venue} neonTier={decor.neon} />
      </div>
      {decor.lighting > 0 &&
        [{ left: 74 }, { right: 74 }].map((pos, i) => (
          <DecorArt key={i} id="lighting" tier={decor.lighting} className="absolute top-[-2px] h-[44px] w-[52px]" style={pos} />
        ))}
      {decor.jukebox > 0 && <DecorArt id="jukebox" tier={decor.jukebox} className="absolute bottom-[-6px] left-[6px] h-[52px] w-[44px]" />}
      {decor.plants > 0 && <DecorArt id="plants" tier={decor.plants} className="absolute bottom-[-4px] left-[48px] h-[40px] w-[44px]" />}
      {decor.tv > 0 && <DecorArt id="tv" tier={decor.tv} className="absolute right-[4px] top-[2px] h-[48px] w-[62px]" />}
      {decor.plants > 0 && <DecorArt id="plants" tier={decor.plants} className="absolute bottom-[-4px] right-[64px] h-[40px] w-[44px]" />}
    </div>
  )
}

/** Tampo do balcão na frente dos clientes; o acabamento muda com as melhorias do balcão. */
export function CounterTop() {
  const tier = useGameStore((s) => equipmentTier(s.player, 'counter'))
  const look = [
    { top: '#E3A86A', body: '#9A5B2B', line: 'transparent' },
    { top: '#D6DAE2', body: '#6FA8DC', line: 'rgba(255,255,255,.35)' },
    { top: '#FFFFFF', body: '#EDE9E2', line: 'rgba(120,110,90,.25)' },
    { top: '#F5B82E', body: '#2B3A55', line: 'rgba(245,184,46,.5)' },
  ][tier]!
  return (
    <div className="absolute inset-x-0 bottom-0 z-20 border-t-4 border-ink" style={{ height: COUNTER_TOP_HEIGHT, background: look.body }} data-counter-tier={tier}>
      <div className="h-2.5" style={{ background: look.top }} />
      <div
        className="h-full shadow-[inset_0_6px_0_rgba(0,0,0,.12)]"
        style={{ background: `repeating-linear-gradient(90deg, ${look.line} 0 2px, transparent 2px 22px), ${look.body}` }}
      />
    </div>
  )
}
