import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react-native';

import type { AlertLevel } from '@/components/mission/AlertCard';
import type { ProgressStep } from '@/components/mission/CurrentResidenceProgressCard';
import type { ResidenceTask } from '@/components/mission/ResidenceTasksCard';
import type { SyncState } from '@/types/sync';

// Sprint 004 (Phase 03): MissionScreen is data-driven by this single shape so
// the 4 operational variants are just different mock objects rendered by the
// exact same screen — "même structure de composants" (docs/11-Roadmap.md).
// MISSION ACTIVE and FIN DE MISSION are NOT variants of this shape — they are
// distinct standalone screens (Phase 11 "Écrans finaux"), out of scope here.
export type ActiveResidenceState = 'EN_ROUTE' | 'APPROACHING' | 'IN_PROGRESS' | 'PROBLEM';

export type MissionScreenAlert = {
  level: AlertLevel;
  icon: ComponentType<LucideProps>;
  text: string;
};

export type MissionScreenState = {
  activeState: ActiveResidenceState;
  // Functional colour for this state (docs/11 Phase 03: bleu EN ROUTE, ambre
  // EN APPROCHE, vert EN COURS, rouge FONCTIONNEL pour PROBLÈME — jamais le
  // rouge de marque).
  color: string;
  stateLabel: string; // "EN ROUTE" | "EN APPROCHE" | "EN COURS"

  mission: {
    missionId: string;
    secteur: string;
    index: number;
    total: number;
    progressPct: number;
    missionSeconds: number;
    syncState: SyncState;
    totalEtaLabel: string;
  };

  address: string;
  residenceDistanceLabel: string;
  residenceEtaLabel: string;

  // Phase timer semantics vary by state (docs/09-State-Machine.md, section
  // Chronomètres) — ignored when activeState === 'PROBLEM' (use `problem`
  // instead, which carries its own frozen time).
  timerSeconds: number;
  progressSteps?: ProgressStep[];

  // Only meaningful while IN_PROGRESS (a residence's services aren't "in
  // progress" before arrival) — omitted for the other states.
  tasks?: ResidenceTask[];
  estimatedTaskTime?: string;

  problem?: {
    type: string;
    note: string;
    frozenSeconds: number;
  };

  // Grouped per HANDOFF §5: 1 alert shown in full + a "+N instructions" chip
  // for the rest — never a stack of N full cards.
  alerts: MissionScreenAlert[];

  // Additive network overlay — can co-occur with ANY of the 4 states above,
  // not a 5th exclusive variant (docs/01 "Mode hors ligne").
  offline?: {
    pendingOperations: number;
  };
};
