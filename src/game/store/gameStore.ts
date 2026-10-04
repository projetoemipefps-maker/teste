import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  addPattyToBurger,
  addToBurger,
  chooseCup,
  createSession,
  cupToTray,
  discardBurger,
  discardCup,
  discardTrayItem,
  flipPatty,
  friesToTray,
  isClosed,
  placeFries,
  placeRawPatty,
  selectSlot,
  sendBurgerToTray,
  serveOrder,
  setPouring,
  step,
  takeFries,
  takePatty,
  type ActionResult,
  type CupSize,
  type GameEvent,
  type PlayerState,
  type SessionState,
  type TrayItem,
} from '../engine'
import { emitGameEvents } from '../loop/eventBus'
import { SAVE_VERSION, defaultPlayer, defaultSave, migrateSave, sanitizeSave } from './migrations'
import { UI_TIMING, type IngredientId } from '../config'

export type Screen = 'title' | 'kitchen' | 'settings'

interface GameState {
  screen: Screen
  hasSave: boolean
  player: PlayerState
  settings: { reduceMotion: boolean }
  session: SessionState
  paused: boolean

  goTo: (screen: Screen) => void
  newGame: () => void
  continueGame: () => void
  nextDay: () => void
  setPaused: (paused: boolean) => void
  setReduceMotion: (value: boolean) => void
  eraseSave: () => void

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

      return {
        screen: 'title',
        hasSave: false,
        player: defaultPlayer(),
        settings: defaultSave().settings,
        session: createSession(newSeed()),
        paused: false,

        goTo: (screen) => set({ screen }),
        newGame: () =>
          set({
            hasSave: true,
            player: defaultPlayer(),
            session: createSession(newSeed()),
            paused: false,
            screen: 'kitchen',
          }),
        continueGame: () => set({ session: createSession(newSeed()), paused: false, screen: 'kitchen' }),
        nextDay: () =>
          set((s) => ({
            player: { ...s.player, day: s.player.day + 1 },
            session: createSession(newSeed()),
            paused: false,
          })),
        setPaused: (paused) =>
          set((s) => ({ paused, session: paused ? setPouring(s.session, false) : s.session })),
        setReduceMotion: (reduceMotion) => set((s) => ({ settings: { ...s.settings, reduceMotion } })),
        eraseSave: () =>
          set({ hasSave: false, player: defaultPlayer(), session: createSession(newSeed()), paused: false }),

        tick: (dt) => {
          const { session, player } = get()
          const r = step(session, player, dt)
          set({ session: r.session, ...(r.player !== player && { player: r.player }) })
          if (r.events.length) emitGameEvents(r.events)
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
      partialize: (s) => ({ hasSave: s.hasSave, player: s.player, settings: s.settings }),
      migrate: (persisted, version) => migrateSave(persisted, version),
      merge: (persisted, current) => ({ ...current, ...sanitizeSave(persisted) }),
    },
  ),
)
