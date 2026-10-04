import { friesStage } from './fryer'
import { pattyHint } from './grill'
import type { SessionState } from './types'

export type StationAlert = 'none' | 'ready' | 'warn'

/** Pontinho de aviso das abas: 'warn' pede atenção agora (vire, passou, queimou); 'ready' tem algo pronto. */
export function grillAlert(session: SessionState): StationAlert {
  let alert: StationAlert = 'none'
  for (const p of session.grill) {
    if (!p) continue
    const hint = pattyHint(p)
    if (hint === 'flip' || hint === 'overdone' || hint === 'burnt') return 'warn'
    if (hint === 'take') alert = 'ready'
  }
  return alert
}

export function fryerAlert(session: SessionState): StationAlert {
  let alert: StationAlert = 'none'
  for (const b of session.fryer) {
    if (!b) continue
    const stage = friesStage(b.cook)
    if (stage === 'burnt') return 'warn'
    if (stage === 'ready') alert = 'ready'
  }
  return alert
}
