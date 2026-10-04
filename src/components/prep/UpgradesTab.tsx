import { motion, useAnimationControls } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { DecorArt, EquipmentArt, LockIcon, TIER_NAMES, VenueArt } from '@/art'
import {
  BONUS_LABEL,
  DECOR,
  DECOR_IDS,
  EQUIPMENT,
  EQUIPMENT_IDS,
  SHOP,
  UPGRADES,
  VENUES,
  VENUE_IDS,
  type DecorId,
  type EquipmentId,
  type UpgradeId,
} from '@/game/config'
import {
  affordableCount,
  decorOffer,
  decorTotals,
  equipmentProgress,
  equipmentTier,
  shopUnlocked,
  upgradeOffer,
  venueOffer,
  currentEffect,
  type Blocker,
  type PlayerState,
} from '@/game/engine'
import { useGameStore } from '@/game/store'
import { formatBonus, formatMoney } from '../format'
import { Pips, ProgressBar } from '../shop/Pips'
import { ShopButton } from '../shop/ShopButton'

type Section = 'equipment' | 'decor' | 'venue'
const SECTIONS: { id: Section; label: string }[] = [
  { id: 'equipment', label: 'Equipamentos' },
  { id: 'decor', label: 'Decoração' },
  { id: 'venue', label: 'Expansão' },
]

const venueName = (order: number) => Object.values(VENUES).find((v) => v.order === order)?.name ?? ''

/** Texto do que falta quando a compra está bloqueada por nível ou fase. */
function requirementText(blocker: Blocker | null, next: { minLevel: number; minVenue: number } | null): string | undefined {
  if (!next) return undefined
  if (blocker === 'level') return `Nível ${next.minLevel}`
  if (blocker === 'venue') return venueName(next.minVenue)
  if (blocker === 'closed') return `Nível ${SHOP.unlockLevel}`
  return undefined
}

/** Dá um "pulinho" no card quando um valor sobe (compra feita). */
function useBump(value: number) {
  const controls = useAnimationControls()
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    void controls.start({ scale: [1, 1.035, 1], transition: { duration: 0.35 } })
  }, [value, controls])
  return controls
}

function UpgradeRow({ player, id }: { player: PlayerState; id: UpgradeId }) {
  const buy = useGameStore((s) => s.buyUpgrade)
  const cfg = UPGRADES[id]
  const offer = upgradeOffer(player, id)
  const bump = useBump(offer.level)
  const next = offer.next
  return (
    <motion.div animate={bump} className="flex items-center gap-2 rounded-xl bg-cream-dark/55 px-2 py-1.5">
      <div className="min-w-0 flex-1">
        <p className="font-display text-sm leading-none text-ink">{cfg.name}</p>
        <p className="mt-1 text-[13px] font-bold leading-tight text-ink">{currentEffect(player, id)}</p>
        {next && <p className="text-[12px] leading-tight text-leaf-dark">Próximo: {cfg.effect(next.value)}</p>}
        <div className="mt-1">
          <Pips level={offer.level} max={offer.max} label={cfg.name} />
        </div>
      </div>
      <ShopButton
        cost={next?.cost ?? 0}
        blocker={offer.blocker}
        missing={next ? next.cost - player.money : 0}
        requirement={requirementText(offer.blocker, next)}
        onBuy={() => buy(id)}
      />
    </motion.div>
  )
}

function EquipmentCard({ player, id }: { player: PlayerState; id: EquipmentId }) {
  const eq = EQUIPMENT[id]
  const tier = equipmentTier(player, id)
  const { done, total } = equipmentProgress(player, id)
  const bump = useBump(done)
  return (
    <motion.section animate={bump} className="rounded-2xl border-4 border-ink bg-white p-2.5 shadow-[0_4px_0_rgba(59,31,14,.3)]" aria-label={eq.name}>
      <div className="flex items-center gap-2.5">
        <div className="grid h-[62px] w-[74px] shrink-0 place-items-center rounded-xl bg-cream-dark/70">
          <EquipmentArt id={id} tier={tier} className="h-full w-full" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <h3 className="font-display text-xl leading-none text-ink">{eq.name}</h3>
            <span className="rounded-full border-2 border-ink bg-mustard px-1.5 py-px font-display text-[11px] leading-tight text-ink">
              Nível {done}
            </span>
          </div>
          <p className="mt-0.5 text-[12px] leading-tight text-ink/65">
            {eq.description} Aparência: <b>{TIER_NAMES[tier]}</b>
          </p>
          <div className="mt-1.5">
            <ProgressBar done={done} total={total} />
          </div>
        </div>
      </div>
      <div className="mt-2 flex flex-col gap-1.5">
        {eq.upgrades.map((u) => (
          <UpgradeRow key={u} player={player} id={u} />
        ))}
      </div>
    </motion.section>
  )
}

function DecorCard({ player, id }: { player: PlayerState; id: DecorId }) {
  const buy = useGameStore((s) => s.buyDecor)
  const cfg = DECOR[id]
  const offer = decorOffer(player, id)
  const bump = useBump(offer.tier)
  const current = offer.tier > 0 ? cfg.tiers[offer.tier - 1]! : null
  const shown = offer.next ? offer.tier + 1 : offer.tier
  return (
    <motion.section animate={bump} className="rounded-2xl border-4 border-ink bg-white p-2.5 shadow-[0_4px_0_rgba(59,31,14,.3)]" aria-label={cfg.name}>
      <div className="flex items-center gap-2.5">
        <div className={`relative grid h-[62px] w-[74px] shrink-0 place-items-center rounded-xl bg-cream-dark/70 ${offer.tier === 0 ? 'opacity-90' : ''}`}>
          <DecorArt id={id} tier={shown} className="h-full w-full" />
          {offer.tier === 0 && (
            <span className="absolute -right-1 -top-1 rounded-full border-2 border-ink bg-cream px-1 text-[9px] font-bold leading-tight text-ink">prévia</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-xl leading-none text-ink">{cfg.name}</h3>
          <p className="mt-1 text-[13px] font-bold leading-tight text-ink">
            {current ? `${current.name} · ${formatBonus(cfg.bonusKind, current.bonus)}` : 'Ainda sem decoração'}
          </p>
          {offer.next && (
            <p className="text-[12px] leading-tight text-leaf-dark">
              Próximo: {offer.next.name} · {formatBonus(cfg.bonusKind, offer.next.bonus)}
            </p>
          )}
          <div className="mt-1">
            <Pips level={offer.tier} max={offer.max} label={cfg.name} />
          </div>
        </div>
        <ShopButton
          cost={offer.next?.cost ?? 0}
          blocker={offer.blocker}
          missing={offer.next ? offer.next.cost - player.money : 0}
          requirement={requirementText(offer.blocker, offer.next)}
          onBuy={() => buy(id)}
        />
      </div>
    </motion.section>
  )
}

function DecorSummary({ player }: { player: PlayerState }) {
  const t = decorTotals(player.decor)
  const items = [
    { kind: 'patience' as const, value: t.patience },
    { kind: 'tip' as const, value: t.tip },
    { kind: 'reputation' as const, value: t.reputation },
  ]
  return (
    <div className="rounded-2xl border-4 border-ink bg-[#FFF8EA] px-3 py-2">
      <p className="text-sm leading-snug text-ink/80">Cada item deixa a lanchonete mais bonita e dá um bônus pequeno. Comprar um visual novo substitui o anterior.</p>
      <div className="mt-1.5 flex gap-1.5">
        {items.map(({ kind, value }) => (
          <div key={kind} className="flex flex-1 flex-col items-center rounded-xl border-[3px] border-ink bg-white px-1 py-1">
            <span className="text-[11px] capitalize leading-none text-ink/70">{BONUS_LABEL[kind]}</span>
            <span className={`font-display text-lg leading-tight ${value > 0 ? 'text-leaf-dark' : 'text-ink'}`}>
              {value > 0 ? (kind === 'reputation' ? `+${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}` : `+${Math.round(value * 100)}%`) : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function VenueCard({ player, id }: { player: PlayerState; id: (typeof VENUE_IDS)[number] }) {
  const buy = useGameStore((s) => s.expandVenue)
  const v = VENUES[id]
  const offer = venueOffer(player)
  const current = VENUES[player.venue]
  const here = v.id === player.venue
  const past = v.order < current.order
  const isNext = offer.next?.id === id
  return (
    <motion.section
      layout
      className={`rounded-2xl border-4 border-ink p-2.5 shadow-[0_4px_0_rgba(59,31,14,.3)] ${here ? 'bg-[#FFF3C4]' : past ? 'bg-white' : 'bg-white'} ${!here && !past && !isNext ? 'opacity-70' : ''}`}
      aria-label={v.name}
    >
      <div className="flex items-center gap-2.5">
        <div className={`relative h-[74px] w-[104px] shrink-0 overflow-hidden rounded-xl bg-[#BEE3F8] ${!here && !past && !isNext ? 'grayscale' : ''}`}>
          <VenueArt id={id} className="h-full w-full" />
          {!here && !past && (
            <span className="absolute inset-0 grid place-items-center bg-ink/25">
              <LockIcon className="h-7 w-7" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold leading-none text-ink/60">Fase {v.order}</p>
          <h3 className="font-display text-xl leading-tight text-ink">{v.name}</h3>
          <p className="text-[12px] leading-tight text-ink/70">{v.description}</p>
        </div>
      </div>
      {v.perks.length > 0 && (
        <ul className="mt-1.5 flex flex-wrap gap-1">
          {v.perks.map((p) => (
            <li key={p} className="rounded-full bg-cream-dark px-2 py-0.5 text-[11px] font-bold leading-tight text-ink">
              {p}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-2 flex items-center justify-between gap-2">
        {here ? (
          <span className="rounded-full border-[3px] border-ink bg-mustard px-2.5 py-1 font-display text-sm leading-none text-ink">Você está aqui</span>
        ) : past ? (
          <span className="rounded-full border-[3px] border-ink bg-leaf px-2.5 py-1 font-display text-sm leading-none text-white">Conquistada</span>
        ) : isNext ? (
          <>
            <span className="text-[12px] leading-tight text-ink/70">
              Exige nível {v.minLevel} e {formatMoney(v.cost)}
            </span>
            <ShopButton
              cost={v.cost}
              blocker={offer.blocker}
              missing={v.cost - player.money}
              requirement={offer.blocker === 'level' ? `Nível ${v.minLevel}` : offer.blocker === 'closed' ? `Nível ${SHOP.unlockLevel}` : undefined}
              onBuy={buy}
              label="Reformar"
            />
          </>
        ) : (
          <span className="text-[12px] leading-tight text-ink/60">Compre a fase anterior primeiro.</span>
        )}
      </div>
    </motion.section>
  )
}

/** Aba "Melhorias" da preparação: equipamentos, decoração e expansão da hamburgueria. */
export function UpgradesTab({ player }: { player: PlayerState }) {
  const [section, setSection] = useState<Section>('equipment')

  if (!shopUnlocked(player.level)) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border-4 border-dashed border-ink/40 bg-white/60 px-4 py-8 text-center">
        <LockIcon className="h-14 w-14" />
        <p className="font-display text-2xl leading-none text-ink">Loja de melhorias</p>
        <p className="text-sm text-ink/70">Liberada no nível {SHOP.unlockLevel}. Atenda os clientes para chegar lá!</p>
      </div>
    )
  }

  const available = affordableCount(player)
  return (
    <div className="flex flex-col gap-2.5">
      <p className="px-1 text-sm text-ink/70">
        Melhore a cozinha entre um dia e outro.{' '}
        {available > 0 ? <b className="text-leaf-dark">{available} {available === 1 ? 'item pode' : 'itens podem'} ser comprados agora.</b> : 'Junte dinheiro para as próximas melhorias.'}
      </p>
      <div className="grid grid-cols-3 gap-1.5" role="tablist" aria-label="Seções da loja">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={section === s.id}
            onClick={() => setSection(s.id)}
            className={`rounded-lg border-[3px] border-ink px-1 py-1.5 font-display text-[13px] leading-none ${
              section === s.id ? 'bg-mustard text-ink' : 'bg-toast-light text-white [text-shadow:0_1px_0_#3B1F0E]'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      {section === 'equipment' && EQUIPMENT_IDS.map((id) => <EquipmentCard key={id} player={player} id={id} />)}
      {section === 'decor' && (
        <>
          <DecorSummary player={player} />
          {DECOR_IDS.map((id) => (
            <DecorCard key={id} player={player} id={id} />
          ))}
        </>
      )}
      {section === 'venue' && VENUE_IDS.map((id) => <VenueCard key={id} player={player} id={id} />)}
    </div>
  )
}
