import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import { App } from './App'
import { useGameStore } from './game/store'

// Só no modo de desenvolvimento: permite inspecionar/avançar o jogo pelo console (window.__game).
if (import.meta.env.DEV) (window as unknown as { __game: typeof useGameStore }).__game = useGameStore

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
