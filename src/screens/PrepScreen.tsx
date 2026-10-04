import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { Coin, Star } from '@/art'
import { Button } from '@/components/Button'
import { formatMoney } from '@/components/format'
import { ForecastCard } from '@/components/prep/ForecastCard'
import { MenuTab } from '@/components/prep/MenuTab'
import { StockTab } from '@/components/prep/StockTab'
import { ReviewsList } from '@/components/ReviewsList'
import { LOAN } from '@/game/config'
import { ECONOMY } from '@/game/config'
import { canTakeLoan, loanInstallment, loanTotal, starFill, type Cart } from '@/game/engine'
import { useGameStore } from '@/game/store'

type Tab = 'stock' | 'menu' | 'reviews'
const TABS: { id: Tab; label: string }[] = [
  { id: 'stock', label: 'Estoque' },
  { id: 'menu', label: 'Cardápio' },
  { id: 'reviews', label: 'Avaliações' },
]

function Banner({ tone, children }: { tone: 'bad' | 'info' | 'warn'; children: React.ReactNode }) {
  const cls = tone === 'bad' ? 'bg-tomato text-white' : tone === 'warn' ? 'bg-mustard text-ink' : 'bg-white text-ink'
  return (
    <motion.div
      role="alert"
      className={`rounded-2xl border-4 border-ink px-3 py-2 text-sm leading-snug shadow-[0_4px_0_rgba(59,31,14,.3)] ${cls}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {children}
    </motion.div>
  )
}

function Alerts() {
  const player = useGameStore((s) => s.player)
  const notice = useGameStore((s) => s.notice)
  const dismiss = useGameStore((s) => s.dismissNotice)
  const takeLoan = useGameStore((s) => s.takeLoan)
  const [confirming, setConfirming] = useState(false)
  const negative = player.money < 0

  return (
    <div className="flex flex-col gap-2">
      {notice && (
        <Banner tone="info">
          <div className="flex items-start gap-2">
            <span className="flex-1">{notice}</span>
            <button type="button" aria-label="Fechar aviso" onClick={dismiss} className="font-display text-lg leading-none">
              ×
            </button>
          </div>
        </Banner>
      )}
      {negative && (
        <Banner tone="bad">
          <p className="font-display text-lg leading-none">Caixa no vermelho: {formatMoney(player.money)}</p>
          <p className="mt-1">
            Dias seguidos no vermelho: <b>{player.debtDays}/{ECONOMY.bankruptcyDays}</b>. Se chegar a {ECONOMY.bankruptcyDays}, é falência!
          </p>
          {canTakeLoan(player) && (
            <div className="mt-2">
              {confirming ? (
                <div className="flex gap-2">
                  <Button
                    variant="green"
                    className="flex-1 !rounded-xl !border-[3px] !px-2 !py-1 !text-sm"
                    onClick={() => {
                      takeLoan()
                      setConfirming(false)
                    }}
                  >
                    Confirmar empréstimo
                  </Button>
                  <Button variant="brown" className="!rounded-xl !border-[3px] !px-2 !py-1 !text-sm" onClick={() => setConfirming(false)}>
                    Voltar
                  </Button>
                </div>
              ) : (
                <Button variant="secondary" className="w-full !rounded-xl !border-[3px] !px-2 !py-1.5 !text-sm" onClick={() => setConfirming(true)}>
                  Pedir empréstimo de R$ {LOAN.amount}
                </Button>
              )}
              <p className="mt-1 text-xs">
                Você paga R$ {loanTotal()} ({Math.round(LOAN.interestRate * 100)}% de juros) em {LOAN.installments} parcelas de R$ {loanInstallment()}, descontadas ao fechar cada dia. Só dá para pedir uma vez.
              </p>
            </div>
          )}
        </Banner>
      )}
      {player.loan.installmentsLeft > 0 && (
        <Banner tone="warn">
          Empréstimo: faltam <b>{player.loan.installmentsLeft}</b> parcelas de R$ {player.loan.installment} (descontadas ao fechar o dia).
        </Banner>
      )}
    </div>
  )
}

export function PrepScreen() {
  const player = useGameStore((s) => s.player)
  const buyStock = useGameStore((s) => s.buyStock)
  const setPrice = useGameStore((s) => s.setPrice)
  const openShop = useGameStore((s) => s.openShop)
  const goTo = useGameStore((s) => s.goTo)
  const [tab, setTab] = useState<Tab>('stock')
  const [cart, setCart] = useState<Cart>({})

  return (
    <div
      className="mx-auto flex h-full max-w-[640px] flex-col"
      style={{
        background:
          'linear-gradient(rgba(59,31,14,.06) 2px, transparent 2px) 0 0/44px 44px, linear-gradient(90deg, rgba(59,31,14,.06) 2px, transparent 2px) 0 0/44px 44px, #FFF3DC',
      }}
    >
      <header className="relative z-10 rounded-b-[26px] border-b-4 border-ink bg-gradient-to-b from-tomato-light to-tomato px-3 pb-2.5 pt-2 shadow-[0_5px_0_rgba(59,31,14,.35)]">
        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            aria-label="Voltar ao menu"
            onClick={() => goTo('title')}
            whileTap={{ scale: 0.9, y: 3 }}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border-4 border-ink bg-toast font-display text-lg leading-none text-white shadow-[0_4px_0_#3B1F0E]"
          >
            ‹
          </motion.button>
          <div className="min-w-0 flex-1">
            <p className="text-xs leading-none text-white/90">Preparação do dia</p>
            <h1 className="font-display text-2xl leading-tight text-white [text-shadow:0_2px_0_#3B1F0E]">Dia {player.day}</h1>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div
              className={`flex items-center gap-1.5 rounded-full border-[3px] border-ink px-2.5 py-px font-display text-base ${player.money < 0 ? 'bg-[#FFD0CB] text-tomato-dark' : 'bg-cream text-ink'}`}
              aria-label={`Dinheiro: ${formatMoney(player.money)}`}
            >
              <Coin className="h-6 w-6" />
              {formatMoney(player.money)}
            </div>
            <div className="flex" role="img" aria-label={`Reputação ${player.reputation.toFixed(1)} de 5`}>
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} id={`prep-star-${i}`} amount={starFill(player.reputation, i)} className="-mx-px h-5 w-5" />
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-3 pb-3 pt-3">
        <Alerts />
        <ForecastCard player={player} />

        <nav className="sticky top-0 z-10 -mx-3 grid grid-cols-3 gap-1.5 bg-[#FFF3DC] px-3 py-1.5" aria-label="Seções da preparação">
          {TABS.map((t) => {
            const on = tab === t.id
            return (
              <motion.button
                key={t.id}
                type="button"
                aria-pressed={on}
                onClick={() => setTab(t.id)}
                animate={{ y: on ? 3 : 0 }}
                whileTap={{ y: 3 }}
                className={`rounded-xl border-4 border-ink px-1 py-1.5 font-display text-base leading-none ${on ? 'bg-mustard text-ink' : 'bg-toast-light text-white [text-shadow:0_1px_0_#3B1F0E]'}`}
                style={{ boxShadow: on ? '0 0 0 #3B1F0E' : '0 4px 0 #3B1F0E' }}
              >
                {t.label}
              </motion.button>
            )
          })}
        </nav>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            className="flex-1"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.06 } }}
            transition={{ duration: 0.14 }}
          >
            {tab === 'stock' && (
              <StockTab
                player={player}
                cart={cart}
                setCart={setCart}
                onBuy={() => {
                  buyStock(cart)
                  setCart({})
                }}
              />
            )}
            {tab === 'menu' && <MenuTab player={player} setPrice={setPrice} />}
            {tab === 'reviews' && <ReviewsList reviews={player.reviews} reputation={player.reputation} idPrefix="prep-rv" />}
          </motion.div>
        </AnimatePresence>
      </div>

      <footer className="border-t-4 border-ink bg-toast-dark px-3 py-2.5">
        <Button variant="green" className="w-full !py-3 !text-2xl" onClick={openShop}>
          Abrir a lanchonete
        </Button>
      </footer>
    </div>
  )
}
