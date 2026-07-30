// Mission item lifecycle states (business vocabulary — English).
// The visual tone (colour) for each state lives in the UI layer
// (`src/config/theme/statusTone.ts`), never here.
export type MissionItemState =
  | 'WAITING'
  | 'EN_ROUTE'
  | 'APPROACHING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'PROBLEM'
  | 'SKIPPED'
  | 'CANCELLED';

// French labels for display (UI is French).
export const STATE_LABELS_FR: Record<MissionItemState, string> = {
  WAITING: 'En attente',
  EN_ROUTE: 'En route',
  APPROACHING: 'En approche',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminée',
  PROBLEM: 'Problème',
  SKIPPED: 'Ignorée',
  CANCELLED: 'Annulée',
};
