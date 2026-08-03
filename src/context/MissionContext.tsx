import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { systemClock } from '@/domain/clock';
import type { Mission, MissionItem, OperatorSession } from '@/domain/entities';
import { generateId } from '@/domain/id';
import { createGpsEngine, type GpsEngine } from '@/engines/gps';
import { createOfflineEngine, type OfflineEngine, type OfflineEngineState } from '@/engines/offline';
import { createStateMachine, isActiveItemState, type StateMachine } from '@/engines/state-machine';
import { createSynchronizationEngine, type SynchronizationEngine } from '@/engines/sync';
import type { NetworkStatusProvider, SynchronizationState } from '@/engines/sync/types';
import { createVoiceEngine, type VoiceEngine } from '@/engines/voice';
import { fetchAssignedMission } from '@/integrations/supabase/fetchAssignedMission';
import { createSupabaseSyncTransport } from '@/integrations/supabase/supabaseSyncTransport';
import { createExpoSpeaker } from '@/integrations/voice/expoSpeaker';
import { getDb } from '@/persistence/db';
import { createMissionItemRepository } from '@/persistence/repositories/missionItemRepository';
import { createMissionRepository } from '@/persistence/repositories/missionRepository';
import { createOperatorSessionRepository } from '@/persistence/repositories/operatorSessionRepository';
import { seedDemoMissionIfEmpty } from '@/persistence/seedDemoMission';
import type { Db } from '@/persistence/types';

// GPS position is not wired to a real sensor yet (expo-location — deferred,
// see plans.md "Sprint 017, partie 1/N": same "logique d'abord, capteur
// ensuite" principle already applied to every engine in this repo). The
// engine itself IS real and instantiated below (setActiveResidence is
// called whenever the active residence changes), it just never receives a
// position update, so it can never truthfully report a live fix.
export type GpsState = { available: false };

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
  gpsState: GpsState;
  synchronizationState: SynchronizationState;
  offlineState: OfflineState;
  session: OperatorSession | null;
  // Sprint 017 (partie 1/N) — commands wired to the real State Machine,
  // bound to buttons that already exist in the UI (CurrentResidenceSheet
  // "Signaler", ProblemStateCard "Reprendre plus tard"/"Passer à la
  // suivante"). No "Terminer" command: finishing a residence stays
  // automatic via the GPS Engine (docs/09), never a manual button invented
  // here.
  reportProblem(missionItemId: string, code: string, note: string | null): Promise<void>;
  resolveProblem(missionItemId: string, target: 'EN_ROUTE' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED'): Promise<void>;
  skipItem(missionItemId: string): Promise<void>;
};

const MissionReactContext = createContext<MissionContextValue | null>(null);

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

// docs/08/docs/07 — real sensor deferred (see GpsState above), same
// principle applied here: a simple always-online stub rather than the real
// NetInfo integration. Shared by the Sync and Offline engines so there is
// only one "not real yet" network signal in the app, not two independently
// invented ones.
const STUB_NETWORK_STATUS: NetworkStatusProvider = { isOnline: () => true };

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
};

export function MissionProvider({
  children,
  getDbOverride,
  employeeId,
  syncTransportOverride,
  speakerOverride,
}: Props) {
  const [mission, setMission] = useState<Mission | null>(null);
  const [items, setItems] = useState<MissionItem[]>([]);
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

  const dbRef = useRef<Db | null>(null);
  const stateMachineRef = useRef<StateMachine | null>(null);
  const gpsEngineRef = useRef<GpsEngine | null>(null);
  const syncEngineRef = useRef<SynchronizationEngine | null>(null);
  const offlineEngineRef = useRef<OfflineEngine | null>(null);
  const voiceEngineRef = useRef<VoiceEngine | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const db = await (getDbOverride ?? getDb)();
      dbRef.current = db;

      // Sprint 017 (partie 1/N) — engines instantiated once per DB
      // connection. GPS/network stay injected stubs (see above); the Sync
      // Engine uses the real Supabase transport already built for the
      // Sprint 013-014 follow-up.
      const stateMachine = createStateMachine(db, systemClock);
      stateMachineRef.current = stateMachine;
      gpsEngineRef.current = createGpsEngine({ stateMachine, clock: systemClock });
      syncEngineRef.current = createSynchronizationEngine({
        db,
        clock: systemClock,
        transport: (syncTransportOverride ?? createSupabaseSyncTransport)(),
        network: STUB_NETWORK_STATUS,
      });
      offlineEngineRef.current = createOfflineEngine({ clock: systemClock, networkStatus: STUB_NETWORK_STATUS });
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

      const [missions, missionItems] = await Promise.all([missionRepo.getAll(), itemRepo.getAll()]);

      // Fix (2026-08-02, see memory.md "suivi ouvert") — `missions[0]` was
      // ambiguous once a real Supabase mission coexists locally with the
      // demo seed. When a real mission was fetched this session, its id is
      // the source of truth; the demo-only case (fresh dev environment,
      // exactly one mission) is unaffected.
      const selectedMissionId = assigned?.id ?? missions[0]?.id ?? null;
      const selectedMission = missions.find((m) => m.id === selectedMissionId) ?? null;
      const selectedItems = selectedMissionId ? missionItems.filter((item) => item.missionId === selectedMissionId) : [];

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

      await offlineEngineRef.current.checkConnectivity();
      await syncEngineRef.current.recoverOnStartup();
      await syncEngineRef.current.runSyncCycle();

      if (!cancelled) {
        setMission(selectedMission);
        setItems(selectedItems);
        setSession(newSession);
        setOfflineState(offlineEngineRef.current.getState());
        setSynchronizationState(await syncEngineRef.current.getSynchronizationState());
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [getDbOverride, employeeId, syncTransportOverride, speakerOverride]);

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

  const value: MissionContextValue = {
    loading,
    mission,
    activeMissionItem,
    nextMissionItems,
    allMissionItems: items,
    gpsState: { available: false },
    synchronizationState,
    offlineState,
    session,
    reportProblem,
    resolveProblem,
    skipItem,
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
