import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  addPattyToBurger,
  addToBurger,
  buyDecor,
  buyUpgrade,
  chooseCup,
  closeDay,
  computePerks,
  createPlayer,
  createSession,
  cupToTray,
  discardBurger,
  discardCup,
  discardTrayItem,
  effectiveDayMultiplier,
  expandVenue,
  flipPatty,
  isClosed,
  openDay,
  placeCookable,
  placeRawPatty,
  purchaseStock,
  restoreDayStart,
  scoopIceCream,
  selectSlot,
  sendBurgerToTray,
  serveOrder,
  setPouring,
  setPrice,
  step,
  storedToTray,
  swapBench,
  takeCookable,
  takeLoan,
  takePatty,
  type ActionResult,
  type Cart,
  type CookableId,
  type CupSize,
  type DaySummary,
  type DecorId,
  type DrinkKind,
  type GameEvent,
  type PlayerState,
  type ProteinId,
  type SessionState,
  type Station,
  type TrayCategory,
  type UnlockEntry,
  type UpgradeId,
  type VenueId,
} from '../engine'
import { emitGameEvents } from '../loop/eventBus'
import { SAVE_VERSION, defaultSave, migrateSave, sanitizeSave } from './migrations'
import { createThrottledStorage } from './storage'
import { UI_TIMING, type IngredientId } from '../config'

export type Screen = 'title' | 'prep' | 'kitchen' | 'summary' | 'bankrupt' | 'settings' | 'recipes'

/** Subida de nível à espera de ser mostrada (pode juntar vários níveis seguidos). */
export interface PendingLevelUp {
  from: number
  level: number
  unlocks: UnlockEntry[]
}

/** Reforma em andamento: a animação da expansão mostra a fase antiga virando a nova. */
export interface Renovation {
  from: VenueId
  to: VenueId
}

interface GameState {
  screen: Screen
  hasSave: boolean
  player: PlayerState
  settings: { reduceMotion: boolean }
  session: SessionState
  paused: boolean
  /** Resumo do último dia fechado (não vai para o save). */
  summary: DaySummary | null
  /** Aviso mostrado na preparação (ex.: dia interrompido). */
  notice: string | null
  reviewsOpen: boolean
  levelUp: PendingLevelUp | null
  /** Vaga do cliente cujo pedido está sendo mostrado como referência de montagem. */
  referenceSlot: number | null
  /** Tela para onde o Livro de Receitas volta. */
  recipeBookFrom: Screen
  renovation: Renovation | null

  goTo: (screen: Screen) => void
  openRecipeBook: () => void
  closeRecipeBook: () => void
  newGame: () => void
  continueGame: () => void
  openShop: () => void
  afterSummary: () => void
  setPaused: (paused: boolean) => void
  setReviewsOpen: (open: boolean) => void
  dismissLevelUp: () => void
  openReference: (slot: number) => void
  closeReference: () => void
  dismissNotice: () => void
  setReduceMotion: (value: boolean) => void
  eraseSave: () => void

  buyStock: (cart: Cart) => void
  buyUpgrade: (id: UpgradeId) => void
  buyDecor: (id: DecorId) => void
  expandVenue: () => void
  finishRenovation: () => void
  setPrice: (key: string, value: number) => void
  takeLoan: () => void

  tick: (dt: number) => void
  selectSlot: (slot: number) => void
  addIngredient: (id: IngredientId) => void
  addHeldPatty: (index: number) => void
  discard: () => void
  swapBench: () => void
  discardTray: (category: TrayCategory) => void
  serve: () => void

  placePatty: (slot: number, kind: ProteinId) => void
  flipPatty: (slot: number) => void
  takePatty: (slot: number) => void
  placeCookable: (station: Station, index: number, kind: CookableId) => void
  takeCookable: (station: Station, index: number) => void
  storedToTray: (station: Station, index: number) => void
  chooseCup: (kind: DrinkKind, size: CupSize) => void
  setPouring: (pouring: boolean) => void
  cupToTray: () => void
  discardCup: () => void
  scoopIceCream: () => void
}

const newSeed = () => (Math.random() * 0xffffffff) >>> 0

const INTERRUPTED_NOTICE = 'O dia anterior foi interrompido. Ele recomeça do início, com o estoque e o caixa de antes.'

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => {
      /** Junta subidas de nível seguidas numa só tela e pausa o jogo enquanto ela aparece. */
      const levelUpFrom = (events: GameEvent[], current: PendingLevelUp | null): PendingLevelUp | null => {
        let pending = current
        for (const e of events) {
          if (e.type !== 'leveledUp') continue
          pending = pending
            ? { from: pending.from, level: e.level, unlocks: [...pending.unlocks, ...e.unlocks] }
            : { from: e.from, level: e.level, unlocks: e.unlocks }
        }
        return pending
      }

      const apply = (r: { session?: SessionState; player?: PlayerState; events: GameEvent[] }) => {
        if (r.events.length === 0 && !r.session && !r.player) return
        const levelUp = levelUpFrom(r.events, get().levelUp)
        set({
          ...(r.session && { session: r.session }),
          ...(r.player && { player: r.player }),
          ...(levelUp !== get().levelUp && { levelUp, paused: true }),
        })
        emitGameEvents(r.events)
      }
      /** Aplica uma ação do engine sobre a sessão atual (ignora se nada mudou). */
      const act = (fn: (session: SessionState) => ActionResult) => {
        const r = fn(get().session)
        if (r.session !== get().session) apply(r)
      }
      const emptySession = () => createSession(newSeed())

      /** Fecha o dia uma única vez: só vale com a cozinha aberta e o turno acabado. */
      const finishDay = () => {
        const { player, session, screen } = get()
        if (screen !== 'kitchen' || !session.ended) return
        const closed = closeDay(player, session)
        set({
          player: closed.player,
          summary: closed.summary,
          screen: 'summary',
          paused: false,
          reviewsOpen: false,
          referenceSlot: null,
          levelUp: null,
        })
      }

      return {
        screen: 'title',
        hasSave: false,
        player: createPlayer(),
        settings: defaultSave().settings,
        session: emptySession(),
        paused: false,
        summary: null,
        notice: null,
        reviewsOpen: false,
        levelUp: null,
        referenceSlot: null,
        recipeBookFrom: 'prep',
        renovation: null,

        goTo: (screen) => set({ screen }),
        openRecipeBook: () => set((s) => ({ recipeBookFrom: s.screen === 'recipes' ? s.recipeBookFrom : s.screen, screen: 'recipes' })),
        closeRecipeBook: () => set((s) => ({ screen: s.recipeBookFrom })),
        newGame: () =>
          set({
            hasSave: true,
            player: createPlayer(),
            session: emptySession(),
            paused: false,
            summary: null,
            notice: null,
            reviewsOpen: false,
            levelUp: null,
            referenceSlot: null,
            renovation: null,
            screen: 'prep',
          }),
        continueGame: () => {
          const { player } = get()
          if (player.bankrupt) return set({ screen: 'bankrupt', summary: null })
          const interrupted = player.phase === 'open'
          set({
            player: restoreDayStart(player),
            notice: interrupted ? INTERRUPTED_NOTICE : null,
            session: emptySession(),
            paused: false,
            reviewsOpen: false,
            levelUp: null,
            referenceSlot: null,
            screen: 'prep',
          })
        },
        openShop: () => {
          const { player } = get()
          if (player.bankrupt) return
          const opened = openDay(player)
          set({
            player: opened,
            session: createSession(newSeed(), {
              stock: opened.stock,
              level: opened.level,
              dayMultiplier: effectiveDayMultiplier(opened),
              perks: computePerks(opened),
            }),
            paused: false,
            notice: null,
            summary: null,
            levelUp: null,
            referenceSlot: null,
            screen: 'kitchen',
          })
        },
        afterSummary: () => set((s) => ({ screen: s.player.bankrupt ? 'bankrupt' : 'prep' })),
        setPaused: (paused) => set((s) => ({ paused, session: paused ? setPouring(s.session, false) : s.session })),
        setReviewsOpen: (reviewsOpen) => set({ reviewsOpen }),
        dismissLevelUp: () => set((s) => ({ levelUp: null, paused: s.reviewsOpen || s.referenceSlot !== null ? s.paused : false })),
        openReference: (slot) => set((s) => ({ referenceSlot: slot, paused: true, session: setPouring(s.session, false) })),
        closeReference: () => set((s) => ({ referenceSlot: null, paused: s.levelUp !== null || s.reviewsOpen })),
        dismissNotice: () => set({ notice: null }),
        setReduceMotion: (reduceMotion) => set((s) => ({ settings: { ...s.settings, reduceMotion } })),
        eraseSave: () =>
          set({
            hasSave: false,
            player: createPlayer(),
            session: emptySession(),
            paused: false,
            summary: null,
            notice: null,
            levelUp: null,
          }),

        buyStock: (cart) => set((s) => ({ player: purchaseStock(s.player, cart) })),
        buyUpgrade: (id) => set((s) => ({ player: buyUpgrade(s.player, id) })),
        buyDecor: (id) => set((s) => ({ player: buyDecor(s.player, id) })),
        expandVenue: () => {
          const { player } = get()
          const next = expandVenue(player)
          if (next !== player) set({ player: next, renovation: { from: player.venue, to: next.venue } })
        },
        finishRenovation: () => set({ renovation: null }),
        setPrice: (key, value) => set((s) => ({ player: setPrice(s.player, key, value) })),
        takeLoan: () => set((s) => ({ player: takeLoan(s.player) })),

        tick: (dt) => {
          const { session, player } = get()
          const r = step(session, player, dt)
          set({ session: r.session, ...(r.player !== player && { player: r.player }) })
          if (r.events.length) emitGameEvents(r.events)
          if (r.session.ended && !session.ended) finishDay()
        },
        selectSlot: (slot) => set((s) => ({ session: selectSlot(s.session, slot) })),
        addIngredient: (id) => {
          act((s) => addToBurger(s, id))
          // Lanche fechado: depois do pão de cima cair, ele vai para a bandeja.
          if (isClosed(get().session.burger)) {
            setTimeout(() => act(sendBurgerToTray), UI_TIMING.burgerToTrayMs)
          }
        },
        addHeldPatty: (index) => act((s) => addPattyToBurger(s, index)),
        discard: () => act(discardBurger),
        swapBench: () => act(swapBench),
        discardTray: (category) => act((s) => discardTrayItem(s, category)),
        placePatty: (slot, kind) => act((s) => placeRawPatty(s, slot, kind)),
        flipPatty: (slot) => act((s) => flipPatty(s, slot)),
        takePatty: (slot) => act((s) => takePatty(s, slot)),
        placeCookable: (station, index, kind) => act((s) => placeCookable(s, station, index, kind)),
        takeCookable: (station, index) => act((s) => takeCookable(s, station, index)),
        storedToTray: (station, index) => act((s) => storedToTray(s, station, index)),
        chooseCup: (kind, size) => act((s) => chooseCup(s, kind, size)),
        setPouring: (pouring) => {
          const next = setPouring(get().session, pouring)
          if (next !== get().session) set({ session: next })
        },
        cupToTray: () => act(cupToTray),
        discardCup: () => act(discardCup),
        scoopIceCream: () => act(scoopIceCream),
        serve: () => {
          const { session, player } = get()
          const r = serveOrder(session, player)
          if (r.session !== session) apply(r)
        },
      }
    },
    {
      name: 'brasa-burger-save',
      version: SAVE_VERSION,
      storage: createThrottledStorage(),
      partialize: (s) => ({ hasSave: s.hasSave, player: s.player, settings: s.settings }),
      migrate: (persisted, version) => migrateSave(persisted, version),
      merge: (persisted, current) => ({ ...current, ...sanitizeSave(persisted) }),
    },
  ),
)
