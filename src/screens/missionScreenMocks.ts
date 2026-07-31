import { DoorClosed, Footprints, Mail, Route, Tractor, TriangleAlert } from 'lucide-react-native';

import type { MapResidence } from '@/components/map/ResidenceMarkerLayer';
import { colors } from '@/config/theme';

import type { MissionScreenState } from './missionScreenState';

// Sprint 004 (Phase 03) mock data — one object per operational variant, fed
// to the same MissionScreen. Base mission stats reuse the Roadmap's own
// Phase 02 example (Mission 24-01-15, Saint-Jérôme, 3/28, 10%); phase-timer
// values reuse docs/01-Design-System.md's own worked example ("EN ROUTE
// 04:37", "EN APPROCHE 00:08", "EN COURS 03:41") for fidelity. Illustrative
// only — no real engine or business rule behind these numbers.
const BASE_MISSION = {
  missionId: '24-01-15',
  secteur: 'Saint-Jérôme',
  index: 3,
  total: 28,
  progressPct: 10,
  syncState: 'synced' as const,
  totalEtaLabel: '1h 45 min (est.)',
};

// Sprint 005-006 (Phase 04): simulated GPS scene — a small residential loop
// near Saint-Jérôme, QC, matching the "224 rue Scott" narrative. Illustrative
// coordinates only (Roadmap Phase 04: "commencer avec des coordonnées
// simulées, ne pas connecter immédiatement le GPS réel"), shared by all 4
// operational-variant mocks — only the zoom level (derived from
// `activeState`) actually changes what the map shows.
const MOCK_MAP_RESIDENCES: MapResidence[] = [
  { n: 3, rank: 1, coordinate: [-74.0037, 45.7809] },
  { n: 4, rank: 2, coordinate: [-74.0032, 45.7815] },
  { n: 5, rank: 3, coordinate: [-74.0041, 45.7821] },
  { n: 6, rank: 4, coordinate: [-74.005, 45.7827] },
  { n: 7, rank: 5, coordinate: [-74.0044, 45.7833] },
];

const MOCK_TRACTOR_POSITION = { longitude: -74.0035, latitude: 45.7803, heading: 15 };

const MOCK_MAP: MissionScreenState['map'] = {
  position: MOCK_TRACTOR_POSITION,
  residences: MOCK_MAP_RESIDENCES,
  routeWaypoints: [
    [MOCK_TRACTOR_POSITION.longitude, MOCK_TRACTOR_POSITION.latitude],
    ...MOCK_MAP_RESIDENCES.map((residence) => residence.coordinate),
  ],
};

export const EN_ROUTE_MOCK: MissionScreenState = {
  activeState: 'EN_ROUTE',
  color: colors.navigation,
  stateLabel: 'EN ROUTE',
  mission: { ...BASE_MISSION, missionSeconds: 645 },
  address: '224 rue Scott',
  residenceDistanceLabel: '2,4 km',
  residenceEtaLabel: '6 min',
  timerSeconds: 277, // 04:37
  progressSteps: [
    { kind: 'current', n: 3, label: 'EN ROUTE' },
    { kind: 'upcoming', n: 4, label: 'À venir' },
    { kind: 'upcoming', n: 5, label: 'À venir' },
  ],
  alerts: [],
  map: MOCK_MAP,
};

export const APPROACHING_MOCK: MissionScreenState = {
  activeState: 'APPROACHING',
  color: colors.warning,
  stateLabel: 'EN APPROCHE',
  mission: { ...BASE_MISSION, missionSeconds: 920 },
  address: '224 rue Scott',
  residenceDistanceLabel: '180 m',
  residenceEtaLabel: '1 min',
  timerSeconds: 8, // 00:08
  progressSteps: [
    { kind: 'done', label: 'EN ROUTE' },
    { kind: 'current', n: 3, label: 'EN APPROCHE' },
    { kind: 'upcoming', n: 4, label: 'À venir' },
    { kind: 'upcoming', n: 5, label: 'À venir' },
  ],
  alerts: [
    { level: 'warning', icon: TriangleAlert, text: 'Plate-bande au fond' },
    { level: 'info', icon: Mail, text: 'Boîte aux lettres à droite de l’entrée' },
    { level: 'danger', icon: DoorClosed, text: 'Entrée étroite — soyez prudent' },
  ],
  map: MOCK_MAP,
};

export const IN_PROGRESS_MOCK: MissionScreenState = {
  activeState: 'IN_PROGRESS',
  color: colors.success,
  stateLabel: 'EN COURS',
  mission: { ...BASE_MISSION, missionSeconds: 1112 },
  address: '224 rue Scott',
  residenceDistanceLabel: '1,2 km',
  residenceEtaLabel: '3 min',
  timerSeconds: 221, // 03:41
  progressSteps: [
    { kind: 'done', label: 'EN ROUTE' },
    { kind: 'done', label: 'EN APPROCHE' },
    { kind: 'current', n: 3, label: 'EN COURS' },
    { kind: 'upcoming', n: 4, label: 'À venir' },
    { kind: 'upcoming', n: 5, label: 'À venir' },
  ],
  tasks: [
    { icon: Tractor, label: 'Déneigement', status: 'Entrée principale' },
    { icon: Route, label: 'Allée', status: 'Complété' },
    { icon: Footprints, label: 'Trottoir', status: 'Complété' },
  ],
  estimatedTaskTime: '12:00',
  alerts: [{ level: 'info', icon: Mail, text: 'Boîte aux lettres à droite de l’entrée' }],
  // Demonstrates the offline overlay is additive to any state, not a 5th one.
  offline: { pendingOperations: 3 },
  map: MOCK_MAP,
};

export const PROBLEM_MOCK: MissionScreenState = {
  activeState: 'PROBLEM',
  color: colors.danger,
  stateLabel: 'PROBLÈME',
  mission: { ...BASE_MISSION, missionSeconds: 1340 },
  address: '224 rue Scott',
  residenceDistanceLabel: '0 m',
  residenceEtaLabel: '—',
  timerSeconds: 143,
  problem: {
    type: 'Accès bloqué',
    note: 'Entrée de garage obstruée par un véhicule stationné.',
    frozenSeconds: 143,
  },
  alerts: [],
  map: MOCK_MAP,
};
