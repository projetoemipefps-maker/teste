import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { useEffect } from 'react'
import { BankruptScreen } from './screens/BankruptScreen'
import { KitchenScreen } from './screens/KitchenScreen'
import { PrepScreen } from './screens/PrepScreen'
import { RecipeBookScreen } from './screens/RecipeBookScreen'
import { SummaryScreen } from './screens/SummaryScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { TitleScreen } from './screens/TitleScreen'
import { useGameStore } from './game/store'

export function App() {
  const screen = useGameStore((s) => s.screen)
  const reduceMotion = useGameStore((s) => s.settings.reduceMotion)

  // Os efeitos em CSS (fumaça, chiado, faíscas) também respeitam a configuração.
  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reduceMotion)
  }, [reduceMotion])

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
          {screen === 'prep' && <PrepScreen />}
          {screen === 'kitchen' && <KitchenScreen />}
          {screen === 'summary' && <SummaryScreen />}
          {screen === 'bankrupt' && <BankruptScreen />}
          {screen === 'recipes' && <RecipeBookScreen />}
          {screen === 'settings' && <SettingsScreen />}
        </motion.main>
      </AnimatePresence>
    </MotionConfig>
  )
}
