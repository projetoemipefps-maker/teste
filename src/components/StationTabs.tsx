import { motion } from 'framer-motion'
import type { ComponentType, SVGProps } from 'react'
import { TabBurgerIcon, TabCupIcon, TabFriesIcon, TabGrillIcon } from '@/art'
import { fryerAlert, grillAlert, type StationAlert } from '@/game/engine'
import { useGameStore } from '@/game/store'

export type Station = 'assembly' | 'grill' | 'fryer' | 'drinks'

const TABS: { id: Station; label: string; Icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { id: 'assembly', label: 'Montagem', Icon: TabBurgerIcon },
  { id: 'grill', label: 'Chapa', Icon: TabGrillIcon },
  { id: 'fryer', label: 'Fritadeira', Icon: TabFriesIcon },
  { id: 'drinks', label: 'Bebidas', Icon: TabCupIcon },
]

function AlertDot({ alert }: { alert: StationAlert }) {
  if (alert === 'none') return null
  return (
    <span
      className={`fx-pulse absolute right-1.5 top-1 h-3.5 w-3.5 rounded-full border-[3px] border-ink ${alert === 'warn' ? 'bg-tomato' : 'bg-leaf'}`}
      aria-label={alert === 'warn' ? 'Precisa de atenção' : 'Pronto'}
    />
  )
}

export function StationTabs({ active, onChange }: { active: Station; onChange: (s: Station) => void }) {
  const alerts: Record<Station, StationAlert> = {
    assembly: 'none',
    grill: useGameStore((s) => grillAlert(s.session)),
    fryer: useGameStore((s) => fryerAlert(s.session)),
    drinks: 'none',
  }
  return (
    <nav className="relative z-30 grid grid-cols-4 gap-1.5 border-t-4 border-ink bg-toast-dark px-2 pb-2 pt-2" aria-label="Estações da cozinha">
      {TABS.map(({ id, label, Icon }) => {
        const on = active === id
        return (
          <motion.button
            key={id}
            type="button"
            aria-label={label}
            aria-current={on}
            onClick={() => onChange(id)}
            className={`relative flex h-[50px] flex-col items-center justify-center gap-0.5 rounded-xl border-4 border-ink ${on ? 'bg-mustard' : 'bg-toast-light'}`}
            style={{ boxShadow: on ? '0 0 0 #3B1F0E' : '0 4px 0 #3B1F0E' }}
            animate={{ y: on ? 4 : 0 }}
            whileTap={{ y: 4 }}
            transition={{ type: 'spring', stiffness: 600, damping: 30 }}
          >
            <Icon className="h-6 w-6" />
            <span className="font-display text-[11px] leading-none text-ink">{label}</span>
            <AlertDot alert={alerts[id]} />
          </motion.button>
        )
      })}
    </nav>
  )
}
