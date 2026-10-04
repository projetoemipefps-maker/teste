import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { KitchenScreen } from './screens/KitchenScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { TitleScreen } from './screens/TitleScreen'
import { useGameStore } from './game/store'

export function App() {
  const screen = useGameStore((s) => s.screen)
  const reduceMotion = useGameStore((s) => s.settings.reduceMotion)

  return (
    <MotionConfig reducedMotion={reduceMotion ? 'always' : 'user'}>
      <AnimatePresence mode="wait">
        <motion.main
          key={screen}
          className="h-full"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          {screen === 'title' && <TitleScreen />}
          {screen === 'kitchen' && <KitchenScreen />}
          {screen === 'settings' && <SettingsScreen />}
        </motion.main>
      </AnimatePresence>
    </MotionConfig>
  )
}
