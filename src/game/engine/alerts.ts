import { cookStage } from './cookers'
import { pattyHint } from './grill'
import type { SessionState, Station } from './types'

export type StationAlert = 'none' | 'ready' | 'warn'

/** Pontinho de aviso das abas: 'warn' pede atenção agora (vire, passou, queimou); 'ready' tem algo pronto. */
export function grillAlert(session: SessionState): StationAlert {
  let alert: StationAlert = 'none'
  for (const p of session.grill) {
    if (!p) continue
    const hint = pattyHint(p, session.perks)
    if (hint === 'flip' || hint === 'alarm' || hint === 'overdone' || hint === 'burnt') return 'warn'
    if (hint === 'take') alert = 'ready'
  }
  return alert
}

/** Aviso da fritadeira ou do forno: queimou (atenção) ou tem algo pronto. */
export function cookerAlert(session: SessionState, station: Station): StationAlert {
  let alert: StationAlert = 'none'
  for (const b of station === 'fryer' ? session.fryer : session.oven) {
    if (!b) continue
    const stage = cookStage(b.kind, b.cook)
    if (stage === 'burnt') return 'warn'
    if (stage === 'ready') alert = 'ready'
  }
  return alert
}
