import { motion } from 'framer-motion'
import { Coin, Star } from '@/art'
import { BurgerPicture } from '@/components/BurgerPicture'
import { Button } from '@/components/Button'
import { formatMoney } from '@/components/format'
import { CountUp } from '@/components/CountUp'
import { ECONOMY, STOCK_ITEMS } from '@/game/config'
import { getRecipe } from '@/game/engine'
import { useGameStore } from '@/game/store'

const money = formatMoney
const signed = (v: number) => `${v < 0 ? '−' : '+'}R$ ${Math.abs(Math.round(v))}`

/** Cada bloco entra em sequência, como uma contagem de caixa de fim de expediente. */
const reveal = (i: number) => ({
  initial: { opacity: 0, y: 28, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { type: 'spring' as const, stiffness: 220, damping: 20, delay: 0.25 + i * 0.4 },
})
const at = (i: number) => 0.25 + i * 0.4 + 0.15

function Tile({ label, children, i }: { label: string; children: React.ReactNode; i: number }) {
  return (
    <motion.div {...reveal(i)} className="flex flex-col items-center rounded-2xl border-4 border-ink bg-white px-2 py-2 shadow-[0_4px_0_rgba(59,31,14,.3)]">
      <span className="text-xs leading-none text-ink/70">{label}</span>
      <span className="mt-1 font-display text-3xl leading-none text-ink">{children}</span>
    </motion.div>
  )
}

function Line({ label, value, bad }: { label: string; value: number; bad?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm text-ink">
      <span>{label}</span>
      <span className={`tabular-nums ${bad ? 'text-tomato' : 'text-leaf-dark'}`}>{signed(bad ? -value : value)}</span>
    </div>
  )
}

export function SummaryScreen() {
  const summary = useGameStore((s) => s.summary)
  const afterSummary = useGameStore((s) => s.afterSummary)
  const levelNow = useGameStore((s) => s.player.level)
  if (!summary) return null

  const profit = summary.netProfit
  const bestRecipe = summary.bestSeller ? getRecipe(summary.bestSeller.recipeId) : null
  const negative = summary.moneyAfter < 0
  const levelsGained = Math.max(0, levelNow - summary.level)

  return (
    <div
      className="h-full overflow-y-auto"
      style={{ background: 'radial-gradient(circle at 50% 0%, #FFE9B8, #FFF3DC 55%, #F5DFB5)' }}
    >
      <div className="mx-auto flex max-w-[460px] flex-col gap-3 px-4 pb-6 pt-5">
        <motion.header
          initial={{ scale: 0.4, rotate: -6, opacity: 0 }}
          animate={{ scale: 1, rotate: -2, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 12 }}
          className="text-center"
        >
          <p className="font-body text-sm text-ink/70">Lanchonete fechada</p>
          <h1
            className="font-display text-[2.6rem] leading-none text-mustard min-[400px]:text-5xl"
            style={{ WebkitTextStroke: '7px #3B1F0E', paintOrder: 'stroke fill', textShadow: '0 5px 0 #3B1F0E' }}
          >
            Fim do dia {summary.day}
          </h1>
        </motion.header>

        <div className="grid grid-cols-2 gap-2.5">
          <Tile i={0} label="Clientes atendidos">
            <CountUp value={summary.served} delay={at(0)} />
          </Tile>
          <Tile i={1} label="Clientes perdidos">
            <span className={summary.lost > 0 ? 'text-tomato' : ''}>
              <CountUp value={summary.lost} delay={at(1)} />
            </span>
          </Tile>
          <Tile i={2} label="Nota média">
            {summary.avgStars === null ? (
              '—'
            ) : (
              <span className="flex items-center gap-1">
                <CountUp value={summary.avgStars} delay={at(2)} format={(v) => v.toFixed(1)} />
                <Star id="sum-avg" amount={1} className="h-6 w-6" />
              </span>
            )}
          </Tile>
          <Tile i={3} label="XP ganho">
            <span className="text-leaf-dark">
              +<CountUp value={summary.xpGained} delay={at(3)} />
            </span>
          </Tile>
        </div>

        <motion.section {...reveal(4)} className="rounded-2xl border-4 border-ink bg-white p-3 shadow-[0_4px_0_rgba(59,31,14,.3)]">
          <div className="flex items-center justify-between font-display text-lg text-ink">
            <span>Faturamento</span>
            <span className="text-leaf-dark">
              <CountUp value={summary.revenue} delay={at(4)} format={(v) => money(v)} />
            </span>
          </div>
          <div className="flex items-center justify-between font-display text-lg text-ink">
            <span>Gorjetas</span>
            <span className="text-leaf-dark">
              <CountUp value={summary.tips} delay={at(4) + 0.2} format={(v) => money(v)} />
            </span>
          </div>
          <div className="my-1.5 h-0.5 rounded bg-ink/15" />
          <div className="flex items-center justify-between font-display text-lg text-ink">
            <span>Gastos</span>
            <span className="text-tomato">
              −<CountUp value={summary.expenses} delay={at(4) + 0.4} format={(v) => money(v)} />
            </span>
          </div>
          <div className="mt-1 flex flex-col gap-0.5 rounded-xl bg-cream-dark/50 px-2 py-1.5">
            {summary.purchases > 0 && <Line label="Estoque comprado" value={summary.purchases} bad />}
            {summary.fixedCosts.map((c) => (
              <Line key={c.id} label={c.name} value={c.amount} bad />
            ))}
            {summary.loanPayment > 0 && <Line label="Parcela do empréstimo" value={summary.loanPayment} bad />}
          </div>
        </motion.section>

        <motion.section
          {...reveal(5)}
          className={`rounded-2xl border-4 border-ink px-3 py-3 text-center shadow-[0_5px_0_rgba(59,31,14,.35)] ${profit >= 0 ? 'bg-leaf' : 'bg-tomato'}`}
        >
          <p className="font-body text-sm text-white/90">Lucro líquido do dia</p>
          <p className="flex items-center justify-center gap-2 font-display text-5xl leading-tight text-white [text-shadow:0_3px_0_rgba(59,31,14,.6)]">
            <motion.span initial={{ rotate: -180, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ delay: at(5), type: 'spring', stiffness: 260, damping: 12 }}>
              <Coin className="h-10 w-10" />
            </motion.span>
            <span>
              {profit < 0 ? '−' : ''}R$ <CountUp value={Math.abs(profit)} delay={at(5)} duration={1.2} />
            </span>
          </p>
          <p className="text-sm text-white/90">
            Caixa agora: <b>{money(summary.moneyAfter)}</b>
          </p>
        </motion.section>

        {bestRecipe && summary.bestSeller && (
          <motion.section {...reveal(6)} className="flex items-center gap-3 rounded-2xl border-4 border-ink bg-white p-3 shadow-[0_4px_0_rgba(59,31,14,.3)]">
            <div className="grid h-16 w-20 shrink-0 place-items-center">
              <BurgerPicture ingredients={bestRecipe.ingredients} width={64} />
            </div>
            <div>
              <p className="text-xs leading-none text-ink/70">Lanche mais vendido</p>
              <p className="font-display text-2xl leading-tight text-ink">{bestRecipe.name}</p>
              <p className="text-sm text-ink/70">{summary.bestSeller.count} vendidos</p>
            </div>
          </motion.section>
        )}

        <motion.div {...reveal(7)} className="flex flex-col gap-2">
          {levelsGained > 0 && (
            <div className="rounded-2xl border-4 border-ink bg-mustard px-3 py-2 text-center font-display text-lg text-ink">
              Você subiu para o nível {levelNow}!
            </div>
          )}
          {summary.spoiled.length > 0 && (
            <div className="rounded-2xl border-4 border-ink bg-[#FFE0B8] px-3 py-2 text-sm text-ink">
              <b>Estragou no estoque:</b>{' '}
              {summary.spoiled.map((s) => `${s.qty} ${STOCK_ITEMS[s.id].name.toLowerCase()}`).join(', ')}.
            </div>
          )}
          {negative && !summary.bankrupt && (
            <div className="rounded-2xl border-4 border-ink bg-tomato px-3 py-2 text-sm text-white">
              <b>Caixa no vermelho!</b> Dias seguidos: {summary.debtDays}/{ECONOMY.bankruptcyDays}. Na preparação do dia você pode pedir um empréstimo.
            </div>
          )}
          {summary.bankrupt && (
            <div className="rounded-2xl border-4 border-ink bg-tomato px-3 py-2 text-center font-display text-lg text-white">
              {ECONOMY.bankruptcyDays} dias no vermelho… a lanchonete faliu.
            </div>
          )}
          <Button variant="green" className="w-full !py-3 !text-2xl" onClick={afterSummary}>
            {summary.bankrupt ? 'Continuar' : 'Próximo dia'}
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
