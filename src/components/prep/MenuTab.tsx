import { motion } from 'framer-motion'
import { PRICING } from '@/game/config'
import {
  demandFactorFromPrices,
  itemPrice,
  menuItems,
  menuPriceRatio,
  patienceFactorFromPrice,
  priceLimits,
  tipFactorFromPrice,
  type MenuItem,
  type PlayerState,
} from '@/game/engine'
import { MenuArt } from '../ItemArt'

const pct = (factor: number) => {
  const v = Math.round((factor - 1) * 100)
  return v === 0 ? '±0%' : `${v > 0 ? '+' : ''}${v}%`
}

function Effect({ label, factor }: { label: string; factor: number }) {
  const good = factor >= 1
  return (
    <div className="flex flex-1 flex-col items-center rounded-xl border-[3px] border-ink bg-white px-1 py-1">
      <span className="text-[11px] leading-none text-ink/70">{label}</span>
      <span className={`font-display text-lg leading-tight ${Math.abs(factor - 1) < 0.005 ? 'text-ink' : good ? 'text-leaf-dark' : 'text-tomato'}`}>
        {pct(factor)}
      </span>
    </div>
  )
}

function Row({ item, price, onChange }: { item: MenuItem; price: number; onChange: (v: number) => void }) {
  const { min, max } = priceLimits(item.key)
  const ratio = price / item.basePrice
  const profit = price - item.cost
  const tag =
    ratio <= PRICING.cheapRatio
      ? { text: 'Atrai clientes', cls: 'bg-leaf text-white' }
      : ratio >= PRICING.priceyRatio
        ? { text: 'Clientes menos pacientes', cls: 'bg-orange text-white' }
        : { text: 'Preço justo', cls: 'bg-cream-dark text-ink' }

  const stepBtn = (label: string, delta: number, disabled: boolean) => (
    <motion.button
      type="button"
      aria-label={`${delta > 0 ? 'Aumentar' : 'Diminuir'} preço de ${item.name}`}
      disabled={disabled}
      onClick={() => onChange(price + delta)}
      whileTap={{ y: 3, boxShadow: '0 0 0 #3B1F0E' }}
      className={`grid h-10 w-10 place-items-center rounded-xl border-[3px] border-ink font-display text-2xl leading-none text-ink disabled:opacity-35 ${delta > 0 ? 'bg-mustard' : 'bg-cream-dark'}`}
      style={{ boxShadow: '0 3px 0 #3B1F0E' }}
    >
      {label}
    </motion.button>
  )

  return (
    <div className="flex items-center gap-2 rounded-2xl border-[3px] border-ink bg-white p-2 shadow-[0_3px_0_rgba(59,31,14,.25)]">
      <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-cream-dark/60">
        <MenuArt item={item} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-lg leading-none text-ink">{item.name}</p>
        <p className="mt-1 text-xs leading-none text-ink/70">
          Custo R$ {item.cost} · Lucro <b className={profit > 0 ? 'text-leaf-dark' : 'text-tomato'}>R$ {profit}</b>
        </p>
        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] leading-none ${tag.cls}`}>{tag.text}</span>
      </div>
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-1.5">
          {stepBtn('−', -1, price <= min)}
          <span className="min-w-[3.1rem] text-center font-display text-xl leading-none text-ink tabular-nums" aria-label={`Preço de ${item.name}`}>
            R$ {price}
          </span>
          {stepBtn('+', 1, price >= max)}
        </div>
        <span className="mt-1 text-[10px] leading-none text-ink/50">
          limite R$ {min}–{max}
        </span>
      </div>
    </div>
  )
}

/** Cardápio: o jogador ajusta o preço de cada item dentro dos limites. */
export function MenuTab({ player, setPrice }: { player: PlayerState; setPrice: (key: string, value: number) => void }) {
  const ratio = menuPriceRatio(player.prices, player.level)
  const groups: { kind: MenuItem['kind']; title: string }[] = [
    { kind: 'burger', title: 'Lanches' },
    { kind: 'side', title: 'Acompanhamentos' },
    { kind: 'drink', title: 'Bebidas' },
    { kind: 'dessert', title: 'Sobremesas' },
  ]
  const items = menuItems().filter((i) => i.unlockLevel <= player.level)
  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-2xl border-4 border-ink bg-cream-dark/60 p-2">
        <p className="px-1 pb-1.5 text-sm leading-snug text-ink">
          Preço alto rende mais por pedido, mas deixa os clientes menos pacientes e reduz a gorjeta. Preço baixo atrai mais clientes.
        </p>
        <div className="flex gap-2">
          <Effect label="Movimento" factor={demandFactorFromPrices(player.prices, player.level)} />
          <Effect label="Paciência" factor={patienceFactorFromPrice(ratio)} />
          <Effect label="Gorjeta" factor={tipFactorFromPrice(ratio)} />
        </div>
      </div>
      {groups.map((g) => {
        const rows = items.filter((i) => i.kind === g.kind)
        if (rows.length === 0) return null
        return (
          <section key={g.kind} className="flex flex-col gap-2" aria-label={g.title}>
            <h3 className="px-1 pt-1 font-display text-lg leading-none text-tomato [text-shadow:0_1px_0_#3B1F0E]">{g.title}</h3>
            {rows.map((item) => (
              <Row key={item.key} item={item} price={itemPrice(player.prices, item.key)} onChange={(v) => setPrice(item.key, v)} />
            ))}
          </section>
        )
      })}
    </div>
  )
}
