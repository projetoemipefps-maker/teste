import { motion } from 'framer-motion'
import { BUY_BUNDLES, STOCK_CATEGORIES, STOCK_IDS, STOCK_ITEMS, type StockId } from '@/game/config'
import { cartCost, computePerks, daysUntilSpoil, isStockUnlocked, roomFor, type Cart, type PlayerState } from '@/game/engine'
import { StockArt } from '../ItemArt'
import { Button } from '../Button'

interface Props {
  player: PlayerState
  cart: Cart
  setCart: (cart: Cart) => void
  onBuy: () => void
}

function Row({ id, player, cart, setCart }: { id: StockId; player: PlayerState; cart: Cart; setCart: (c: Cart) => void }) {
  const item = STOCK_ITEMS[id]
  const inCart = cart[id] ?? 0
  const perks = computePerks(player)
  const room = roomFor(player.stock, id, perks.stockCap) - inCart
  const spoil = daysUntilSpoil(id, player.stock, player.stockAge, perks.spoilBonus)
  const empty = player.stock[id] <= 0
  const add = (qty: number) => setCart({ ...cart, [id]: inCart + Math.min(qty, room) })

  return (
    <div className="rounded-2xl border-[3px] border-ink bg-white p-2 shadow-[0_3px_0_rgba(59,31,14,.25)]">
      <div className="flex items-center gap-2">
        <div className="grid h-12 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-cream-dark/60">
          <StockArt id={id} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-baseline gap-1.5 font-display text-lg leading-none text-ink">
            {item.name}
            <span className="font-body text-xs font-bold text-ink/60">R$ {item.unitCost}/un</span>
          </p>
          <p className="mt-1 text-sm leading-none text-ink">
            Estoque:{' '}
            <b className={empty ? 'text-tomato' : ''}>{player.stock[id]}</b>
            {inCart > 0 && <b className="ml-1 text-leaf-dark">+{inCart}</b>}
          </p>
          {spoil !== null && (
            <p className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] leading-none ${spoil === 0 ? 'bg-tomato text-white' : 'bg-leaf/20 text-leaf-dark'}`}>
              {spoil === 0 ? 'Estraga hoje à noite!' : `Fresco · estraga em ${spoil} ${spoil === 1 ? 'dia' : 'dias'}`}
            </p>
          )}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        {BUY_BUNDLES.map((n) => (
          <motion.button
            key={n}
            type="button"
            aria-label={`Adicionar ${n} ${item.name} ao carrinho`}
            disabled={room <= 0}
            onClick={() => add(n)}
            whileTap={{ y: 3, boxShadow: '0 0 0 #3B1F0E' }}
            className="flex flex-1 items-center justify-between rounded-xl border-[3px] border-ink bg-mustard px-2.5 py-1 disabled:opacity-40"
            style={{ boxShadow: '0 3px 0 #3B1F0E' }}
          >
            <span className="font-display text-base leading-none text-ink">+{n}</span>
            <span className="text-xs leading-none text-ink/80">R$ {Math.min(n, Math.max(room, 0)) * item.unitCost}</span>
          </motion.button>
        ))}
        <button
          type="button"
          aria-label={`Limpar ${item.name} do carrinho`}
          disabled={inCart === 0}
          onClick={() => setCart({ ...cart, [id]: 0 })}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border-[3px] border-ink bg-cream-dark font-display text-lg leading-none text-ink disabled:opacity-30"
        >
          ×
        </button>
      </div>
    </div>
  )
}

/** Tela de compra: +10 e +50 por item (carrinho) e o custo total. */
export function StockTab({ player, cart, setCart, onBuy }: Props) {
  const total = cartCost(cart)
  const missing = total - player.money
  return (
    <div className="flex min-h-full flex-col gap-2">
      <p className="px-1 text-sm text-ink/70">Cada lanche gasta ingredientes. Cabem até {computePerks(player).stockCap} de cada item. Alface e tomate estragam se ficarem parados.</p>
      {STOCK_CATEGORIES.map((category) => {
        const ids = STOCK_IDS.filter((id) => STOCK_ITEMS[id].category === category.id && isStockUnlocked(id, player.level))
        if (ids.length === 0) return null
        return (
          <section key={category.id} className="flex flex-col gap-2" aria-label={category.name}>
            <h3 className="px-1 pt-1 font-display text-lg leading-none text-tomato [text-shadow:0_1px_0_#3B1F0E]">{category.name}</h3>
            {ids.map((id) => (
              <Row key={id} id={id} player={player} cart={cart} setCart={setCart} />
            ))}
          </section>
        )
      })}
      <div className="sticky bottom-0 -mx-1 mt-auto flex items-center gap-3 rounded-2xl border-4 border-ink bg-cream px-3 py-2 shadow-[0_-4px_0_rgba(59,31,14,.15)]">
        <div className="flex-1">
          <p className="text-xs leading-none text-ink/70">Custo total</p>
          <p className={`font-display text-2xl leading-tight ${missing > 0 ? 'text-tomato' : 'text-ink'}`}>R$ {total}</p>
          {missing > 0 && <p className="text-[11px] leading-none text-tomato">Faltam R$ {missing}</p>}
        </div>
        <Button variant="secondary" className="!px-3 !py-2 !text-base" disabled={total === 0} onClick={() => setCart({})}>
          Limpar
        </Button>
        <Button variant="green" className="!px-4 !py-2 !text-lg" disabled={total === 0 || missing > 0} onClick={onBuy}>
          Comprar
        </Button>
      </div>
    </div>
  )
}
