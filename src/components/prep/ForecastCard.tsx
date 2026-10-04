import { motion } from 'framer-motion'
import { DEMAND, SHIFT } from '@/game/config'
import {
  computePerks,
  dayMultiplier,
  demandFactorForReputation,
  demandFactorFromPrices,
  effectiveReputation,
  expectedCustomers,
  forecastOf,
  type Forecast,
  type PlayerState,
} from '@/game/engine'

const LABEL: Record<Forecast, { text: string; cls: string }> = {
  weak: { text: 'Dia fraco', cls: 'bg-[#6FA8DC] text-white' },
  normal: { text: 'Dia normal', cls: 'bg-mustard text-ink' },
  strong: { text: 'Dia movimentado!', cls: 'bg-tomato text-white' },
}

const peakName = (hour: number) => (hour < 16 ? 'Almoço' : 'Jantar')

/** Previsão de movimento do dia: classificação, clientes esperados e o gráfico hora a hora. */
export function ForecastCard({ player }: { player: PlayerState }) {
  const mult = dayMultiplier(player.day)
  const forecast = forecastOf(mult)
  const perks = computePerks(player)
  const factor =
    mult *
    player.dayBoost *
    perks.demandFactor *
    demandFactorForReputation(effectiveReputation(player.reputation, perks)) *
    demandFactorFromPrices(player.prices, player.level)
  const hours = SHIFT.closeHour - SHIFT.openHour
  const peak = Math.max(...DEMAND.hourly)

  return (
    <section className="rounded-2xl border-4 border-ink bg-white px-3 pb-2 pt-2.5 shadow-[0_4px_0_rgba(59,31,14,.3)]">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-display text-lg leading-none text-ink">Previsão do dia</p>
          <p className="mt-1 text-sm text-ink/70">
            ≈ <b className="text-ink">{expectedCustomers(player)}</b> clientes · {SHIFT.openHour}h–{SHIFT.closeHour}h
          </p>
        </div>
        <span className={`shrink-0 whitespace-nowrap rounded-full border-[3px] border-ink px-2.5 py-1 font-display text-sm leading-none ${LABEL[forecast].cls}`}>
          {LABEL[forecast].text}
        </span>
      </div>

      {player.dayBoost > 1 && (
        <p className="mt-1.5 rounded-lg bg-[#FFD6E4] px-2 py-1 text-xs leading-tight text-ink">
          Um influenciador falou bem de você: <b>+{Math.round((player.dayBoost - 1) * 100)}%</b> de movimento hoje!
        </p>
      )}
      <div className="mt-1.5 flex h-[52px] items-end gap-[3px]" role="img" aria-label="Movimento por hora">
        {DEMAND.hourly.map((m, i) => {
          const isPeak = m >= DEMAND.peakThreshold
          const h = Math.max(6, ((m * factor) / (peak * Math.max(1, factor))) * 100)
          return (
            <motion.div
              key={i}
              className={`flex-1 rounded-t-md border-[2.5px] border-b-0 border-ink ${isPeak ? 'bg-tomato' : 'bg-mustard-light'}`}
              initial={{ height: 0 }}
              animate={{ height: `${Math.min(100, h)}%` }}
              transition={{ type: 'spring', stiffness: 200, damping: 18, delay: i * 0.03 }}
            />
          )
        })}
      </div>
      <div className="flex gap-[3px] border-t-[3px] border-ink pt-0.5">
        {Array.from({ length: hours }, (_, i) => {
          const hour = SHIFT.openHour + i
          const m = DEMAND.hourly[i] ?? 0
          const first = m >= DEMAND.peakThreshold && (DEMAND.hourly[i - 1] ?? 0) < DEMAND.peakThreshold
          return (
            <div key={i} className="relative flex-1 text-center text-[9px] leading-none text-ink/70">
              {hour}
              {first && (
                <span className="absolute left-0 top-3 whitespace-nowrap font-display text-[10px] text-tomato">{peakName(hour)}</span>
              )}
            </div>
          )
        })}
      </div>
      <div className="h-3" />
    </section>
  )
}
