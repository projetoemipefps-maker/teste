import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  addToBurger,
  createSession,
  discardBurger,
  selectSlot,
  serveOrder,
  step,
  type GameEvent,
  type PlayerState,
  type SessionState,
} from '../engine'
import { emitGameEvents } from '../loop/eventBus'
import { SAVE_VERSION, defaultPlayer, defaultSave, migrateSave, sanitizeSave } from './migrations'
import type { IngredientId } from '../config'

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
  discard: () => void
  serve: () => void
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
        setPaused: (paused) => set({ paused }),
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
        addIngredient: (id) => apply({ ...addToBurger(get().session, id) }),
        discard: () => apply({ ...discardBurger(get().session) }),
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
