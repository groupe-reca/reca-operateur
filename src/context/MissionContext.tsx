import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { systemClock } from '@/domain/clock';
import type { Mission, MissionAlertRecord, MissionItem, OperatorSession, StateTransition, SyncOperation } from '@/domain/entities';
import { generateId } from '@/domain/id';
import {
  createGpsEngine,
  createGpsSimulator,
  DEFAULT_GPS_THRESHOLDS,
  type GpsCoordinate,
  type GpsEngine,
  type GpsEngineEvent,
  type GpsFixOptions,
  type GpsSimulator,
  type GpsThresholds,
} from '@/engines/gps';
import { createOfflineEngine, type OfflineEngine, type OfflineEngineEvent, type OfflineEngineState } from '@/engines/offline';
import {
  createStateMachine,
  isActiveItemState,
  recoverOnStartup as recoverStateMachineOnStartup,
  type StateMachine,
  type TransitionResult,
} from '@/engines/state-machine';
import { createSynchronizationEngine, type SynchronizationEngine } from '@/engines/sync';
import type { NetworkStatusProvider, SyncEngineEvent, SynchronizationState } from '@/engines/sync/types';
import { createVoiceEngine, type VoiceEngine } from '@/engines/voice';
import type { VoiceEngineEvent } from '@/engines/voice/types';
import { createExpoLocationProvider, type LocationProvider } from '@/integrations/location/expoLocationProvider';
import { createNetInfoSensor, type NetworkSensor } from '@/integrations/network/expoNetInfoProvider';
import {
  createAsyncStorageDetectionRadii,
  type DetectionRadiiOverride,
  type DetectionRadiiStorage,
} from '@/integrations/settings/detectionRadiiStorage';
import { fetchAssignedMission } from '@/integrations/supabase/fetchAssignedMission';
import { createSupabaseSyncTransport } from '@/integrations/supabase/supabaseSyncTransport';
import { createExpoSpeaker } from '@/integrations/voice/expoSpeaker';
import { getDb } from '@/persistence/db';
import { createMissionAlertRepository } from '@/persistence/repositories/missionAlertRepository';
import { createMissionItemRepository } from '@/persistence/repositories/missionItemRepository';
import { createMissionRepository } from '@/persistence/repositories/missionRepository';
import { createOperatorSessionRepository } from '@/persistence/repositories/operatorSessionRepository';
import { createStateTransitionRepository } from '@/persistence/repositories/stateTransitionRepository';
import { createSyncOperationRepository } from '@/persistence/repositories/syncOperationRepository';
import { seedDemoMissionIfEmpty } from '@/persistence/seedDemoMission';
import type { Db } from '@/persistence/types';

// Sprint 017 (partie 2/N) — real `expo-location` sensor wired below
// (`createExpoLocationProvider`). `reason` distinguishes why no live fix is
// available (never invented — only what the provider itself can honestly
// report) from the nominal `{available: true}` once a fix is flowing.
// Bug found testing on a real device (2026-08-03): `gpsState` only ever
// carried `{available: true}` (a permission flag), never the actual fix —
// `deriveMissionScreenState.ts` fell back to drawing the tractor at the
// highlighted residence's own coordinate always, real sensor or not (a
// leftover from Sprint 017 partie 1/N, never revisited when the real sensor
// was wired in partie 2/N). `position` is the raw last fix (docs/04 never
// requires *position* itself to be validated, only the compass heading —
// CLAUDE.md "c'est la carte qui tourne... cap validé après temporisation,
// jamais le cap GPS brut" — so `headingDegrees` here is the GPS Engine's
// own validated `HeadingChanged` value, not the raw fix's heading).
export type GpsState =
  | {
      available: true;
      position: { latitude: number; longitude: number; headingDegrees: number } | null;
    }
  | { available: false; reason: 'permission_denied' | 'no_mission' | 'unavailable' };

// Sync/Offline now expose their real state shapes (docs/07/docs/08) instead
// of the Sprint 007-008 placeholders — no other component read the old
// placeholder shape yet, safe to change.
export type { SynchronizationState } from '@/engines/sync/types';
export type OfflineState = OfflineEngineState;

export type MissionContextValue = {
  loading: boolean;
  mission: Mission | null;
  activeMissionItem: MissionItem | null;
  nextMissionItems: MissionItem[];
  // Full item list (including COMPLETED/SKIPPED) — needed by
  // deriveMissionScreenState.ts for the "n/total" count and progress %,
  // which `nextMissionItems` alone can't provide (it only lists WAITING
  // items).
  allMissionItems: MissionItem[];
  // Sprint "Mission active" — loaded once at mount, filtered to the
  // selected mission's items. `mission_alerts` has no producer anywhere in
  // this repo yet (see deriveMissionScreenState.ts's own `alerts: []`) —
  // honestly empty rather than invented, ready for whenever one exists.
  missionAlerts: MissionAlertRecord[];
  gpsState: GpsState;
  synchronizationState: SynchronizationState;
  offlineState: OfflineState;
  session: OperatorSession | null;
  // Sprint « Paramètres » — the Voice Engine's own silent mode
  // (`setEnabled`/`isEnabled`, Sprint 016) existed since 2026-08-02 but had
  // no caller until SettingsScreen.tsx.
  voiceEnabled: boolean;
  setVoiceEnabled(enabled: boolean): void;
  // Sprint "Réglages du rayon de détection" — persisted (AsyncStorage,
  // survives a restart), applied live to the already-running GPS Engine
  // (`gpsEngine.setThresholds`, no engine recreation, no lost mission
  // progress). `setDetectionRadii` validates before applying (positive,
  // work radius < approach radius) rather than trusting the caller.
  detectionRadii: GpsThresholds;
  setDetectionRadii(update: DetectionRadiiOverride): { success: boolean; error?: string };
  // Sprint 017 (partie 1/N) — commands wired to the real State Machine,
  // bound to buttons that already exist in the UI (CurrentResidenceSheet
  // "Signaler", ProblemStateCard "Reprendre plus tard"/"Passer à la
  // suivante"). No "Terminer" command: finishing a residence stays
  // automatic via the GPS Engine (docs/09), never a manual button invented
  // here.
  reportProblem(missionItemId: string, code: string, note: string | null): Promise<void>;
  resolveProblem(missionItemId: string, target: 'EN_ROUTE' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED'): Promise<void>;
  skipItem(missionItemId: string): Promise<void>;
  // Sprint 018 — "Fermer la mission" (docs/11 Phase 11, écran Fin de
  // mission). Delegates to the same requestMissionComplete already built at
  // Sprint 009-010 (refuses if a MissionItem is still WAITING or active, a
  // PROBLEM/SKIPPED item does NOT block it — see
  // deriveEndOfMissionState.ts). Returns the raw TransitionResult (not just
  // void like the other commands) so the screen can surface a real error
  // instead of failing silently.
  closeMission(): Promise<TransitionResult>;
  // Sprint "Mission active" — "Démarrer la tournée" (docs/11, écran Mission
  // active). Delegates to requestMissionStart (State Machine, Sprint
  // 009-010) — only valid from READY (docs/09 Mission graph); ASSIGNED is
  // never produced anywhere in this repo, see plans.md. Same pattern as
  // closeMission: reloads `mission` (its own status changes, not an item),
  // returns the raw TransitionResult.
  startMission(): Promise<TransitionResult>;
  // Sprint 017 (partie 2/N) — "Actualiser" (NoMissionScreen.tsx, docs/11
  // "Aucune mission"). Re-checks whether a mission has since been assigned,
  // without restarting sensors/session (see the implementation below).
  refreshAssignment(): Promise<void>;
  // Sprint 019 — docs/11 Phase 11 "Développement" (simuler GPS/réseau, voir
  // états/file/événements/seuils, exporter les journaux). Always present in
  // the value (the data itself isn't sensitive) — access control is the
  // caller's job (`__DEV__`, see LiveMissionScreen.tsx), not this context's.
  dev: DevTools;
};

// Wraps the Sprint 011-012 GPS simulator: each call also reloads the
// context's own state afterwards (same `afterMutation` every other command
// uses) so a caller never has to know the simulator mutated the DB via the
// State Machine underneath it.
export type DevGpsSimulator = {
  moveTo(coordinate: GpsCoordinate, options?: GpsFixOptions): Promise<void>;
  advanceTime(seconds: number): Promise<void>;
  loseSignal(): void;
  recoverSignal(coordinate: GpsCoordinate, options?: GpsFixOptions): Promise<void>;
};

export type DevStatesSnapshot = {
  missionStatus: Mission['status'] | null;
  itemsByStatus: Record<string, number>;
  gpsPhase: string | null;
  synchronizationState: SynchronizationState;
  offlineState: OfflineEngineState;
};

export type DevEventsSnapshot = {
  gps: GpsEngineEvent[];
  sync: SyncEngineEvent[];
  offline: OfflineEngineEvent[];
  voice: VoiceEngineEvent[];
};

export type DevTools = {
  gps: DevGpsSimulator;
  // The GPS Engine's real active thresholds — includes the operator's own
  // detection-radii overrides (Sprint "Réglages du rayon de détection") once
  // set, not just the hardcoded defaults.
  thresholds: GpsThresholds;
  getStates(): DevStatesSnapshot;
  getEvents(): DevEventsSnapshot;
  getSyncQueue(): Promise<SyncOperation[]>;
  getTransitions(): Promise<StateTransition[]>;
  // `null` = real signal (always-online stub, current behaviour unchanged).
  setNetworkOverride(online: boolean | null): Promise<void>;
  exportLogs(): Promise<string>;
  // Sprint "dev.gps vs capteur réel" — the real `expo-location` sensor and
  // the GPS simulator both drive the same GPS Engine instance once a mission
  // is loaded (found competing on-device, memory.md 2026-08-03: a real fix
  // arriving mid-simulation could invalidate a pending simulated transition
  // before its confirmation delay elapsed). `DevScreen` pauses the real
  // sensor's effect on the engine while it's open — this flag lets it show
  // that state and offer an early manual resume.
  realGpsPaused: boolean;
  setRealGpsPaused(paused: boolean): void;
};

const MissionReactContext = createContext<MissionContextValue | null>(null);

// Pure — directly testable without React/DB. Sprint "Sélection de mission
// active déterministe" (2026-08-04): a demo mission (seeded once when the DB
// was empty) and a real Supabase mission can coexist locally (found on the
// test device — the demo was seeded before the real account/mission
// existed). `assignedId` already resolves the nominal case (a fresh
// `fetchAssignedMission` succeeded); this only matters once it's `null`
// (no `employeeId`, or a transient network failure) — falling back to
// `missions[0]` then would pick an arbitrary SQLite row order, possibly the
// demo mission even though the operator was last looking at a real one.
// Preferring the most recent operator session's mission instead preserves
// "what was actually being worked on", without ever deleting the demo
// mission or inventing a `source` field on `Mission` (see plans.md — no
// data cleanup without explicit confirmation, same stance as the "148 Rue
// Scott" residence question).
export function selectMissionId(params: {
  assignedId: string | null;
  missions: Mission[];
  sessions: OperatorSession[];
}): string | null {
  const { assignedId, missions, sessions } = params;
  if (assignedId) return assignedId;

  const missionIds = new Set(missions.map((m) => m.id));
  const lastKnownSession = [...sessions]
    .sort((a, b) => b.openedAt.localeCompare(a.openedAt))
    .find((session) => session.missionId !== null && missionIds.has(session.missionId));
  if (lastKnownSession) return lastKnownSession.missionId;

  return missions[0]?.id ?? null;
}

// Pure — directly testable without React/DB. docs/03: "une seule résidence
// active"; the rest of the waiting ones are shown as "next" in mission order.
// "Active" here is the state-machine engine's own rule (docs/09 "Résidence
// active"), not redefined here — single source of truth.
export function deriveActiveAndNext(items: MissionItem[]): {
  activeMissionItem: MissionItem | null;
  nextMissionItems: MissionItem[];
} {
  const activeMissionItem = items.find((item) => isActiveItemState(item.status)) ?? null;
  const nextMissionItems = items
    .filter((item) => item.id !== activeMissionItem?.id && item.status === 'WAITING')
    .sort((a, b) => a.ordre - b.ordre);
  return { activeMissionItem, nextMissionItems };
}

type Props = {
  children: ReactNode;
  // Injectable for tests — defaults to the real singleton connection.
  getDbOverride?: () => Promise<Db>;
  // Set once the operator is authenticated (AuthContext.employeeId). When
  // present, a real assigned mission is fetched from Supabase and takes
  // priority; seedDemoMissionIfEmpty stays the dev-only fallback (no
  // assigned mission found, or fetch failed — local-first, never blocks the
  // screen on a network error).
  employeeId?: string | null;
  // Injectable for tests — same reasoning as `getDbOverride`: without these,
  // a test that triggers a mutation would make `runSyncCycle()` hit the
  // real Supabase transport over the network (every other engine test in
  // this repo explicitly avoids that, see memory.md "jamais de vrai réseau
  // touché en test"). Default to the real integrations.
  syncTransportOverride?: () => ReturnType<typeof createSupabaseSyncTransport>;
  speakerOverride?: () => ReturnType<typeof createExpoSpeaker>;
  // Sprint 017 (partie 2/N) — same reasoning as the overrides above: without
  // these, a test would touch the real `expo-location`/NetInfo native
  // modules, which don't exist under Jest.
  locationProviderOverride?: () => LocationProvider;
  networkSensorOverride?: () => NetworkSensor;
  // Sprint "Réglages du rayon de détection" — same reasoning: without this, a
  // test would touch the real AsyncStorage native module.
  detectionRadiiStorageOverride?: () => DetectionRadiiStorage;
};

export function MissionProvider({
  children,
  getDbOverride,
  employeeId,
  syncTransportOverride,
  speakerOverride,
  locationProviderOverride,
  networkSensorOverride,
  detectionRadiiStorageOverride,
}: Props) {
  const [mission, setMission] = useState<Mission | null>(null);
  const [items, setItems] = useState<MissionItem[]>([]);
  const [missionAlerts, setMissionAlerts] = useState<MissionAlertRecord[]>([]);
  const [session, setSession] = useState<OperatorSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [synchronizationState, setSynchronizationState] = useState<SynchronizationState>({
    status: 'SYNCED',
    pendingCount: 0,
    failedCount: 0,
  });
  const [offlineState, setOfflineState] = useState<OfflineEngineState>({
    status: 'ONLINE',
    since: systemClock.now().toISOString(),
    lastOnlineAt: systemClock.now().toISOString(),
  });
  const [gpsState, setGpsState] = useState<GpsState>({ available: false, reason: 'unavailable' });
  const [voiceEnabled, setVoiceEnabledState] = useState(true);
  const [realGpsPaused, setRealGpsPausedState] = useState(false);
  // Mirrors gpsEngine.getThresholds() so SettingsScreen/DevScreen re-render
  // on change — the engine itself stays the single source of truth for
  // actual GPS Engine behaviour, this is just a React-visible copy of it.
  const [detectionRadii, setDetectionRadiiState] = useState<GpsThresholds>(DEFAULT_GPS_THRESHOLDS);

  const dbRef = useRef<Db | null>(null);
  const stateMachineRef = useRef<StateMachine | null>(null);
  const gpsEngineRef = useRef<GpsEngine | null>(null);
  const detectionRadiiStorageRef = useRef<DetectionRadiiStorage | null>(null);
  const locationProviderRef = useRef<LocationProvider | null>(null);
  // Read (not `realGpsPaused` state) inside the `onFix` closure below — a
  // ref stays current across renders without re-subscribing the sensor.
  const realGpsPausedRef = useRef(false);
  // Latest *validated* heading (see the HeadingChanged subscription below) —
  // read whenever a new position fix is recorded, never the raw fix heading.
  const headingRef = useRef<number>(0);
  const gpsSimulatorRef = useRef<GpsSimulator | null>(null);
  const syncEngineRef = useRef<SynchronizationEngine | null>(null);
  const offlineEngineRef = useRef<OfflineEngine | null>(null);
  const voiceEngineRef = useRef<VoiceEngine | null>(null);

  // Shared by the Sync and Offline engines so there is only one network
  // signal in the app, not two independently invented ones.
  // `networkOverrideRef` (Sprint 019) keeps priority — the dev-only
  // "Développement" screen must still be able to force a scenario even with
  // a real sensor present; `null` falls through to `realNetworkStatusRef`
  // (Sprint 017 partie 2/N, updated by the real NetInfo listener below,
  // starts `true` until the first event arrives — same "assume online until
  // told otherwise" default the stub always had).
  const networkOverrideRef = useRef<boolean | null>(null);
  const realNetworkStatusRef = useRef<boolean>(true);
  const networkStatus = useMemo<NetworkStatusProvider>(
    () => ({ isOnline: () => networkOverrideRef.current ?? realNetworkStatusRef.current }),
    []
  );

  useEffect(() => {
    let cancelled = false;
    // Set once `load()` starts the real GPS sensor — declared here (not
    // inside `load()`) so the effect's cleanup below can always reach it,
    // even though it's only assigned partway through the async function.
    let timeoutIntervalId: ReturnType<typeof setInterval> | null = null;

    async function load() {
      const db = await (getDbOverride ?? getDb)();
      dbRef.current = db;

      // Sprint 017 (partie 1/N) — engines instantiated once per DB
      // connection. The Sync Engine uses the real Supabase transport already
      // built for the Sprint 013-014 follow-up; GPS/network sensors are
      // wired further down (Sprint 017 partie 2/N).
      const stateMachine = createStateMachine(db, systemClock);
      stateMachineRef.current = stateMachine;
      // Sprint "Réglages du rayon de détection" — persisted overrides loaded
      // before the engine exists, so a returning operator's saved radii
      // apply from the very first `updatePosition`, not just after they
      // reopen Paramètres.
      const detectionRadiiStorage = (detectionRadiiStorageOverride ?? createAsyncStorageDetectionRadii)();
      detectionRadiiStorageRef.current = detectionRadiiStorage;
      const persistedRadii = await detectionRadiiStorage.load();
      gpsEngineRef.current = createGpsEngine({ stateMachine, clock: systemClock, thresholds: persistedRadii });
      gpsSimulatorRef.current = createGpsSimulator(gpsEngineRef.current, systemClock);
      if (!cancelled) {
        setDetectionRadiiState(gpsEngineRef.current.getThresholds());
      }
      // CLAUDE.md invariant: "c'est la carte qui tourne... cap validé après
      // temporisation, jamais le cap GPS brut" — the map's heading always
      // comes from the engine's own validated `HeadingChanged` event, never
      // a raw fix's heading.
      gpsEngineRef.current.on((event) => {
        if (event.type === 'HeadingChanged') {
          headingRef.current = event.headingDegrees;
        }
      });
      syncEngineRef.current = createSynchronizationEngine({
        db,
        clock: systemClock,
        transport: (syncTransportOverride ?? createSupabaseSyncTransport)(),
        network: networkStatus,
      });
      offlineEngineRef.current = createOfflineEngine({ clock: systemClock, networkStatus });
      voiceEngineRef.current = createVoiceEngine({ clock: systemClock, speaker: (speakerOverride ?? createExpoSpeaker)() });

      let assigned: Awaited<ReturnType<typeof fetchAssignedMission>> = null;
      if (employeeId) {
        try {
          assigned = await fetchAssignedMission(employeeId, db, systemClock);
        } catch {
          // Network/RLS failure — local-first (docs/07): never block the
          // screen, fall back to whatever is already on the device.
          assigned = null;
        }
      }
      if (!assigned) {
        await seedDemoMissionIfEmpty(db, systemClock);
      }

      const missionRepo = createMissionRepository(db);
      const itemRepo = createMissionItemRepository(db);
      const sessionRepo = createOperatorSessionRepository(db);

      const [missions, missionItems, existingSessions] = await Promise.all([
        missionRepo.getAll(),
        itemRepo.getAll(),
        sessionRepo.getAll(),
      ]);

      // Fix (2026-08-02, refined 2026-08-04 — see selectMissionId above and
      // memory.md "suivi ouvert") — `missions[0]` was ambiguous once a real
      // Supabase mission coexists locally with the demo seed. `assigned?.id`
      // resolves the nominal case; `existingSessions` (read before this
      // session's own upsert below) resolves the "no fresh assignment this
      // load" case without falling back to arbitrary row order.
      const selectedMissionId = selectMissionId({ assignedId: assigned?.id ?? null, missions, sessions: existingSessions });
      const selectedMission = missions.find((m) => m.id === selectedMissionId) ?? null;
      let selectedItems = selectedMissionId ? missionItems.filter((item) => item.missionId === selectedMissionId) : [];
      const selectedItemIds = new Set(selectedItems.map((item) => item.id));
      const alertRepo = createMissionAlertRepository(db);
      const allAlerts = await alertRepo.getAll();
      const selectedAlerts = allAlerts.filter((alert) => selectedItemIds.has(alert.missionItemId));

      // Bug found testing on a real device (2026-08-03): the State
      // Machine's own `recoverOnStartup` (docs/09 "Récupération après
      // redémarrage", Sprint 009-010 — activates the first WAITING item
      // when an IN_PROGRESS mission has zero active items) was built but
      // never actually called from this context. Went unnoticed because
      // the demo seed always pre-activates its first item as EN_ROUTE — a
      // real Supabase mission whose items are still all WAITING when
      // `startMission()` moves it to IN_PROGRESS had no screen to show
      // (not eligible for Fin de mission, not READY anymore, no active
      // item for the live screen). Not just startup recovery: it also
      // covers "just started, nothing activated yet" since the precondition
      // (IN_PROGRESS + zero active items) is the same either way.
      if (selectedMissionId) {
        await recoverStateMachineOnStartup(db, systemClock, stateMachine, selectedMissionId);
        selectedItems = (await itemRepo.getAll()).filter((item) => item.missionId === selectedMissionId);
      }

      const now = systemClock.now().toISOString();
      const newSession: OperatorSession = {
        id: generateId(),
        userId: null,
        missionId: selectedMissionId,
        openedAt: now,
        closedAt: null,
        appVersion: null,
        batteryLevel: null,
        offlineMode: null,
      };
      await sessionRepo.upsert(newSession);

      // Sprint 017 (partie 2/N) — real GPS sensor, foreground only (see
      // expoLocationProvider.ts). Only started once a mission is actually
      // selected: tracking a position nobody will use would just be a
      // battery cost for no documented benefit. `afterMutation` reuses the
      // exact same reload path `dev.gps`/`reportProblem`/… already use —
      // a real fix and a simulated one both end up calling the State
      // Machine underneath, so the context refreshes the same way either
      // way, only one code path to keep correct.
      if (selectedMissionId) {
        const locationProvider = (locationProviderOverride ?? createExpoLocationProvider)();
        locationProviderRef.current = locationProvider;
        const { granted } = await locationProvider.start(async (fix) => {
          // Sprint "dev.gps vs capteur réel" — while DevScreen is
          // simulating, a real fix is ignored entirely rather than reaching
          // the engine (see DevScreen.tsx's pause-on-mount/resume-on-unmount
          // effect) — the sensor itself keeps running, only its effect on
          // the engine/display is short-circuited.
          if (realGpsPausedRef.current) return;
          await gpsEngineRef.current?.updatePosition(fix);
          if (!cancelled) {
            setGpsState({
              available: true,
              position: { latitude: fix.latitude, longitude: fix.longitude, headingDegrees: headingRef.current },
            });
          }
          await afterMutation(selectedMissionId);
        });
        if (!cancelled) {
          setGpsState(granted ? { available: true, position: null } : { available: false, reason: 'permission_denied' });
        }
        // docs/04: "le moteur ne possède aucun timer propre" — same
        // principle as every other engine in this repo, the caller must
        // provide the periodic tick that detects a lost signal.
        // `checkTimeout` itself is a no-op until a first real fix has
        // arrived (see gpsEngine.ts), so it's always safe to start this
        // even before/without permission being granted.
        timeoutIntervalId = setInterval(() => {
          gpsEngineRef.current?.checkTimeout(systemClock.now());
        }, 5000);
      } else if (!cancelled) {
        setGpsState({ available: false, reason: 'no_mission' });
      }

      await offlineEngineRef.current.checkConnectivity();
      await syncEngineRef.current.recoverOnStartup();
      await syncEngineRef.current.runSyncCycle();

      if (!cancelled) {
        setMission(selectedMission);
        setItems(selectedItems);
        setMissionAlerts(selectedAlerts);
        setSession(newSession);
        setOfflineState(offlineEngineRef.current.getState());
        setSynchronizationState(await syncEngineRef.current.getSynchronizationState());
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
      locationProviderRef.current?.stop();
      if (timeoutIntervalId) clearInterval(timeoutIntervalId);
    };
    // `afterMutation` is a new function identity every render (it's declared
    // in the component body, not memoized) but only ever closes over refs
    // and state setters, never over `mission`/`items` themselves — including
    // it here would restart GPS tracking (and the whole load effect) on
    // every unrelated re-render instead of once per DB connection.
  }, [getDbOverride, employeeId, syncTransportOverride, speakerOverride, locationProviderOverride, networkStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sprint 017 (partie 2/N) — real network sensor. Independent of the
  // mission-loading effect above (network state is meaningful even before a
  // mission is selected) — started once per provider identity, not
  // re-subscribed on every render.
  useEffect(() => {
    const sensor = (networkSensorOverride ?? createNetInfoSensor)();
    return sensor.start((online) => {
      realNetworkStatusRef.current = online;
    });
  }, [networkSensorOverride]);

  const { activeMissionItem, nextMissionItems } = useMemo(() => deriveActiveAndNext(items), [items]);

  // GPS Engine kept aware of the active residence even without a live
  // position feed — real wiring, just no sensor behind it yet (see
  // GpsState above).
  useEffect(() => {
    if (activeMissionItem && activeMissionItem.latitude !== null && activeMissionItem.longitude !== null) {
      const startingPhase = activeMissionItem.status === 'APPROACHING' || activeMissionItem.status === 'IN_PROGRESS'
        ? activeMissionItem.status
        : 'EN_ROUTE';
      gpsEngineRef.current?.setActiveResidence(
        {
          missionItemId: activeMissionItem.id,
          coordinate: { latitude: activeMissionItem.latitude, longitude: activeMissionItem.longitude },
          detectionRadiusMeters: activeMissionItem.detectionRadiusMeters,
        },
        null,
        startingPhase
      );
    }
  }, [activeMissionItem]);

  async function reloadMissionItems(missionId: string): Promise<void> {
    const db = dbRef.current;
    if (!db) return;
    const itemRepo = createMissionItemRepository(db);
    const missionItems = await itemRepo.getAll();
    setItems(missionItems.filter((item) => item.missionId === missionId));
  }

  async function afterMutation(missionId: string): Promise<void> {
    await reloadMissionItems(missionId);
    const syncEngine = syncEngineRef.current;
    if (syncEngine) {
      await syncEngine.runSyncCycle();
      setSynchronizationState(await syncEngine.getSynchronizationState());
    }
    const voiceEngine = voiceEngineRef.current;
    if (voiceEngine) {
      let result: Awaited<ReturnType<VoiceEngine['processNext']>>;
      do {
        result = await voiceEngine.processNext();
      } while (result === 'spoke');
    }
  }

  async function reportProblem(missionItemId: string, code: string, note: string | null): Promise<void> {
    const stateMachine = stateMachineRef.current;
    if (!stateMachine || !mission) return;
    const result = await stateMachine.reportProblem(missionItemId, code, note, { source: 'MANUAL' });
    if (result.success) {
      voiceEngineRef.current?.handleEvent({ type: 'VOICE_PROBLEM_RECORDED', missionId: mission.id, missionItemId });
      await afterMutation(mission.id);
    }
  }

  async function resolveProblem(
    missionItemId: string,
    target: 'EN_ROUTE' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED'
  ): Promise<void> {
    const stateMachine = stateMachineRef.current;
    if (!stateMachine || !mission) return;
    const result = await stateMachine.resolveProblem(missionItemId, target, { source: 'MANUAL' });
    if (result.success) {
      await afterMutation(mission.id);
    }
  }

  async function skipItem(missionItemId: string): Promise<void> {
    const stateMachine = stateMachineRef.current;
    if (!stateMachine || !mission) return;
    const result = await stateMachine.skipItem(missionItemId, { source: 'MANUAL' });
    if (result.success) {
      await afterMutation(mission.id);
    }
  }

  async function reloadMission(missionId: string): Promise<void> {
    const db = dbRef.current;
    if (!db) return;
    const missionRepo = createMissionRepository(db);
    const updated = await missionRepo.getById(missionId);
    if (updated) setMission(updated);
  }

  async function closeMission(): Promise<TransitionResult> {
    const stateMachine = stateMachineRef.current;
    if (!stateMachine || !mission) {
      return { success: false, errorCode: 'MISSION_NOT_FOUND', errorMessage: 'no active mission' };
    }
    const result = await stateMachine.requestMissionComplete(mission.id);
    if (result.success) {
      // Unlike reportProblem/resolveProblem/skipItem, this mutates the
      // Mission itself (not just a MissionItem) — afterMutation alone only
      // reloads items, so `mission.status` must be refreshed separately or
      // the screen would never observe its own success.
      await reloadMission(mission.id);
      await afterMutation(mission.id);
    }
    return result;
  }

  async function startMission(): Promise<TransitionResult> {
    const stateMachine = stateMachineRef.current;
    if (!stateMachine || !mission) {
      return { success: false, errorCode: 'MISSION_NOT_FOUND', errorMessage: 'no active mission' };
    }
    const result = await stateMachine.requestMissionStart(mission.id);
    if (result.success) {
      await reloadMission(mission.id);
      // The mount-time recovery call (see `load()`) ran while the mission
      // was still READY (a no-op, its precondition is IN_PROGRESS) — now
      // that it just became IN_PROGRESS, run it again to activate the
      // first WAITING item immediately rather than leaving the operator on
      // a blank screen until the next app restart.
      const db = dbRef.current;
      if (db) {
        await recoverStateMachineOnStartup(db, systemClock, stateMachine, mission.id);
      }
      await afterMutation(mission.id);
    }
    return result;
  }

  // Sprint « Paramètres » — "Voix" toggle on SettingsScreen.tsx.
  function setVoiceEnabled(enabled: boolean): void {
    voiceEngineRef.current?.setEnabled(enabled);
    setVoiceEnabledState(enabled);
  }

  // Sprint "Réglages du rayon de détection" — "Détection GPS" section on
  // SettingsScreen.tsx. `workRadiusMeters < approachRadiusMeters` is a
  // physical consequence of the EN_ROUTE→APPROACHING→IN_PROGRESS graph
  // (docs/09) — you can't validly be "in work range" farther away than "in
  // approach range" — not a new business rule, just input sanity.
  function setDetectionRadiiCommand(update: DetectionRadiiOverride): { success: boolean; error?: string } {
    const gpsEngine = gpsEngineRef.current;
    if (!gpsEngine) {
      return { success: false, error: 'GPS Engine indisponible.' };
    }
    const next: GpsThresholds = { ...gpsEngine.getThresholds(), ...update };
    if (next.approachRadiusMeters <= 0 || next.workRadiusMeters <= 0) {
      return { success: false, error: 'Les rayons doivent être positifs.' };
    }
    if (next.workRadiusMeters >= next.approachRadiusMeters) {
      return { success: false, error: 'Le rayon « en cours » doit être plus petit que le rayon « en approche ».' };
    }
    gpsEngine.setThresholds(update);
    setDetectionRadiiState(next);
    detectionRadiiStorageRef.current
      ?.save({ approachRadiusMeters: next.approachRadiusMeters, workRadiusMeters: next.workRadiusMeters })
      .catch(() => {
        // Best-effort persistence — a save failure shouldn't undo the live
        // change already applied to the running GPS Engine this session.
      });
    return { success: true };
  }

  // Sprint 017 (partie 2/N) — "Actualiser" button on NoMissionScreen.tsx
  // (docs/11 "Aucune mission"). Re-runs the same assignment lookup the
  // mount effect does (`fetchAssignedMission` if authenticated, else keep
  // whatever's already selected) — does NOT restart GPS tracking/the sync
  // recovery sequence, this is a lightweight "did a new mission appear?"
  // check, not a full reconnect.
  async function refreshAssignment(): Promise<void> {
    const db = dbRef.current;
    if (!db) return;
    setLoading(true);
    let assigned: Awaited<ReturnType<typeof fetchAssignedMission>> = null;
    if (employeeId) {
      try {
        assigned = await fetchAssignedMission(employeeId, db, systemClock);
      } catch {
        assigned = null;
      }
    }
    const missionRepo = createMissionRepository(db);
    const itemRepo = createMissionItemRepository(db);
    const sessionRepo = createOperatorSessionRepository(db);
    const [missions, missionItems, sessions] = await Promise.all([
      missionRepo.getAll(),
      itemRepo.getAll(),
      sessionRepo.getAll(),
    ]);
    // `mission?.id` (already on screen) wins over the session-history
    // fallback inside selectMissionId — no reason to jump away from what's
    // currently displayed just because refreshAssignment found no new
    // assignment this call.
    const selectedMissionId = assigned?.id ?? mission?.id ?? selectMissionId({ assignedId: null, missions, sessions });
    const selectedMission = missions.find((m) => m.id === selectedMissionId) ?? null;
    const selectedItems = selectedMissionId ? missionItems.filter((item) => item.missionId === selectedMissionId) : [];
    setMission(selectedMission);
    setItems(selectedItems);
    setLoading(false);
  }

  // Sprint "dev.gps vs capteur réel" — see DevTools.realGpsPaused above.
  function setRealGpsPaused(paused: boolean): void {
    realGpsPausedRef.current = paused;
    setRealGpsPausedState(paused);
  }

  // Sprint 019 — see DevTools/DevGpsSimulator above for the "why" of each
  // piece. `moveTo`/`advanceTime`/`recoverSignal` all reload the context
  // afterwards, exactly like reportProblem/resolveProblem/skipItem, since
  // the simulator can trigger real State Machine transitions underneath it.
  // Mirrors the real sensor's `setGpsState` update (see `load()`) — the dev
  // simulator drives the same map position display, not a second code path.
  function recordDevGpsPosition(coordinate: GpsCoordinate) {
    setGpsState({
      available: true,
      position: { latitude: coordinate.latitude, longitude: coordinate.longitude, headingDegrees: headingRef.current },
    });
  }

  const devGps: DevGpsSimulator = {
    async moveTo(coordinate, options) {
      await gpsSimulatorRef.current?.moveTo(coordinate, options);
      recordDevGpsPosition(coordinate);
      if (mission) await afterMutation(mission.id);
    },
    async advanceTime(seconds) {
      await gpsSimulatorRef.current?.advanceTime(seconds);
      if (mission) await afterMutation(mission.id);
    },
    loseSignal() {
      gpsSimulatorRef.current?.loseSignal();
    },
    async recoverSignal(coordinate, options) {
      await gpsSimulatorRef.current?.recoverSignal(coordinate, options);
      recordDevGpsPosition(coordinate);
      if (mission) await afterMutation(mission.id);
    },
  };

  function getDevStates(): DevStatesSnapshot {
    return {
      missionStatus: mission?.status ?? null,
      itemsByStatus: items.reduce<Record<string, number>>((acc, item) => {
        acc[item.status] = (acc[item.status] ?? 0) + 1;
        return acc;
      }, {}),
      gpsPhase: gpsEngineRef.current?.getPhase() ?? null,
      synchronizationState,
      offlineState,
    };
  }

  function getDevEvents(): DevEventsSnapshot {
    return {
      gps: gpsEngineRef.current?.getEvents() ?? [],
      sync: syncEngineRef.current?.getEvents() ?? [],
      offline: offlineEngineRef.current?.getEvents() ?? [],
      voice: voiceEngineRef.current?.getEvents() ?? [],
    };
  }

  async function getDevSyncQueue(): Promise<SyncOperation[]> {
    const db = dbRef.current;
    if (!db) return [];
    return createSyncOperationRepository(db).getAll();
  }

  async function getDevTransitions(): Promise<StateTransition[]> {
    const db = dbRef.current;
    if (!db) return [];
    return createStateTransitionRepository(db).getAll();
  }

  async function setNetworkOverride(online: boolean | null): Promise<void> {
    networkOverrideRef.current = online;
    const offlineEngine = offlineEngineRef.current;
    const syncEngine = syncEngineRef.current;
    if (offlineEngine) {
      await offlineEngine.checkConnectivity();
      setOfflineState(offlineEngine.getState());
    }
    if (syncEngine) {
      await syncEngine.runSyncCycle();
      setSynchronizationState(await syncEngine.getSynchronizationState());
    }
  }

  async function exportLogs(): Promise<string> {
    const [syncQueue, transitions] = await Promise.all([getDevSyncQueue(), getDevTransitions()]);
    return JSON.stringify(
      {
        exportedAt: systemClock.now().toISOString(),
        missionId: mission?.id ?? null,
        states: getDevStates(),
        events: getDevEvents(),
        thresholds: detectionRadii,
        syncQueue,
        transitions,
      },
      null,
      2
    );
  }

  const dev: DevTools = {
    gps: devGps,
    // Sprint "Réglages du rayon de détection" — reflects the GPS Engine's
    // real active thresholds (React-state mirror, see `detectionRadii`
    // above), not always the hardcoded defaults now that they can change.
    thresholds: detectionRadii,
    getStates: getDevStates,
    getEvents: getDevEvents,
    getSyncQueue: getDevSyncQueue,
    getTransitions: getDevTransitions,
    setNetworkOverride,
    exportLogs,
    realGpsPaused,
    setRealGpsPaused,
  };

  const value: MissionContextValue = {
    loading,
    mission,
    activeMissionItem,
    nextMissionItems,
    allMissionItems: items,
    missionAlerts,
    gpsState,
    synchronizationState,
    offlineState,
    session,
    voiceEnabled,
    setVoiceEnabled,
    detectionRadii,
    setDetectionRadii: setDetectionRadiiCommand,
    reportProblem,
    resolveProblem,
    skipItem,
    dev,
    closeMission,
    startMission,
    refreshAssignment,
  };

  return <MissionReactContext.Provider value={value}>{children}</MissionReactContext.Provider>;
}

export function useMissionContext(): MissionContextValue {
  const context = useContext(MissionReactContext);
  if (!context) {
    throw new Error('useMissionContext must be used within a MissionProvider');
  }
  return context;
}
