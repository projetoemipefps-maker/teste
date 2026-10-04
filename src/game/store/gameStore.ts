import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  addPattyToBurger,
  addToBurger,
  chooseCup,
  closeDay,
  createPlayer,
  createSession,
  cupToTray,
  dayMultiplier,
  discardBurger,
  discardCup,
  discardTrayItem,
  flipPatty,
  friesToTray,
  isClosed,
  openDay,
  placeFries,
  placeRawPatty,
  purchaseStock,
  restoreDayStart,
  selectSlot,
  sendBurgerToTray,
  serveOrder,
  setPouring,
  setPrice,
  step,
  takeFries,
  takeLoan,
  takePatty,
  type ActionResult,
  type Cart,
  type CupSize,
  type DaySummary,
  type GameEvent,
  type PlayerState,
  type SessionState,
  type TrayItem,
} from '../engine'
import { emitGameEvents } from '../loop/eventBus'
import { SAVE_VERSION, defaultSave, migrateSave, sanitizeSave } from './migrations'
import { createThrottledStorage } from './storage'
import { UI_TIMING, type IngredientId } from '../config'

export type Screen = 'title' | 'prep' | 'kitchen' | 'summary' | 'bankrupt' | 'settings'

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

  goTo: (screen: Screen) => void
  newGame: () => void
  continueGame: () => void
  openShop: () => void
  afterSummary: () => void
  setPaused: (paused: boolean) => void
  setReviewsOpen: (open: boolean) => void
  dismissNotice: () => void
  setReduceMotion: (value: boolean) => void
  eraseSave: () => void

  buyStock: (cart: Cart) => void
  setPrice: (key: string, value: number) => void
  takeLoan: () => void

  tick: (dt: number) => void
  selectSlot: (slot: number) => void
  addIngredient: (id: IngredientId) => void
  addHeldPatty: (index: number) => void
  discard: () => void
  discardTray: (item: TrayItem) => void
  serve: () => void

  placePatty: (slot: number) => void
  flipPatty: (slot: number) => void
  takePatty: (slot: number) => void
  placeFries: (basket: number) => void
  takeFries: (basket: number) => void
  friesToTray: (warmerIndex: number) => void
  chooseCup: (size: CupSize) => void
  setPouring: (pouring: boolean) => void
  cupToTray: () => void
  discardCup: () => void
}

const newSeed = () => (Math.random() * 0xffffffff) >>> 0

const INTERRUPTED_NOTICE = 'O dia anterior foi interrompido. Ele recomeça do início, com o estoque e o caixa de antes.'

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => {
      const apply = (r: { session?: SessionState; player?: PlayerState; events: GameEvent[] }) => {
        if (r.events.length === 0 && !r.session && !r.player) return
        set({ ...(r.session && { session: r.session }), ...(r.player && { player: r.player }) })
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
        set({ player: closed.player, summary: closed.summary, screen: 'summary', paused: false, reviewsOpen: false })
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

        goTo: (screen) => set({ screen }),
        newGame: () =>
          set({
            hasSave: true,
            player: createPlayer(),
            session: emptySession(),
            paused: false,
            summary: null,
            notice: null,
            reviewsOpen: false,
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
            screen: 'prep',
          })
        },
        openShop: () => {
          const { player } = get()
          if (player.bankrupt) return
          const opened = openDay(player)
          set({
            player: opened,
            session: createSession(newSeed(), { stock: opened.stock, dayMultiplier: dayMultiplier(opened.day) }),
            paused: false,
            notice: null,
            summary: null,
            screen: 'kitchen',
          })
        },
        afterSummary: () => set((s) => ({ screen: s.player.bankrupt ? 'bankrupt' : 'prep' })),
        setPaused: (paused) =>
          set((s) => ({ paused, session: paused ? setPouring(s.session, false) : s.session })),
        setReviewsOpen: (reviewsOpen) => set({ reviewsOpen }),
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
          }),

        buyStock: (cart) => set((s) => ({ player: purchaseStock(s.player, cart) })),
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
        discardTray: (item) => act((s) => discardTrayItem(s, item)),
        placePatty: (slot) => act((s) => placeRawPatty(s, slot)),
        flipPatty: (slot) => act((s) => flipPatty(s, slot)),
        takePatty: (slot) => act((s) => takePatty(s, slot)),
        placeFries: (basket) => act((s) => placeFries(s, basket)),
        takeFries: (basket) => act((s) => takeFries(s, basket)),
        friesToTray: (index) => act((s) => friesToTray(s, index)),
        chooseCup: (size) => act((s) => chooseCup(s, size)),
        setPouring: (pouring) => {
          const next = setPouring(get().session, pouring)
          if (next !== get().session) set({ session: next })
        },
        cupToTray: () => act(cupToTray),
        discardCup: () => act(discardCup),
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
