import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { systemClock } from '@/domain/clock';
import type { Mission, MissionItem, OperatorSession } from '@/domain/entities';
import { generateId } from '@/domain/id';
import { getDb } from '@/persistence/db';
import { createMissionItemRepository } from '@/persistence/repositories/missionItemRepository';
import { createMissionRepository } from '@/persistence/repositories/missionRepository';
import { createOperatorSessionRepository } from '@/persistence/repositories/operatorSessionRepository';
import { seedDemoMissionIfEmpty } from '@/persistence/seedDemoMission';
import type { Db } from '@/persistence/types';

// Placeholders — no real engine exists yet for these (GPS: Sprint 011-012,
// Synchronization: 013-014, Offline: 015). Typed now to match the Roadmap's
// own MissionContext example shape (docs/11 Phase 05); real values arrive
// with their engines, this context never invents their behaviour.
export type GpsState = { available: false };
export type SynchronizationState = { pendingOperations: number };
export type OfflineState = { isOffline: boolean };

export type MissionContextValue = {
  loading: boolean;
  mission: Mission | null;
  activeMissionItem: MissionItem | null;
  nextMissionItems: MissionItem[];
  gpsState: GpsState;
  synchronizationState: SynchronizationState;
  offlineState: OfflineState;
  session: OperatorSession | null;
};

const MissionReactContext = createContext<MissionContextValue | null>(null);

// docs/09-State-Machine.md "Résidence active": états considérés actifs.
const ACTIVE_STATES = new Set(['EN_ROUTE', 'APPROACHING', 'IN_PROGRESS']);

// Pure — directly testable without React/DB. docs/03: "une seule résidence
// active"; the rest of the waiting ones are shown as "next" in mission order.
export function deriveActiveAndNext(items: MissionItem[]): {
  activeMissionItem: MissionItem | null;
  nextMissionItems: MissionItem[];
} {
  const activeMissionItem = items.find((item) => ACTIVE_STATES.has(item.status)) ?? null;
  const nextMissionItems = items
    .filter((item) => item.id !== activeMissionItem?.id && item.status === 'WAITING')
    .sort((a, b) => a.ordre - b.ordre);
  return { activeMissionItem, nextMissionItems };
}

type Props = {
  children: ReactNode;
  // Injectable for tests — defaults to the real singleton connection.
  getDbOverride?: () => Promise<Db>;
};

export function MissionProvider({ children, getDbOverride }: Props) {
  const [mission, setMission] = useState<Mission | null>(null);
  const [items, setItems] = useState<MissionItem[]>([]);
  const [session, setSession] = useState<OperatorSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const db = await (getDbOverride ?? getDb)();
      await seedDemoMissionIfEmpty(db, systemClock);

      const missionRepo = createMissionRepository(db);
      const itemRepo = createMissionItemRepository(db);
      const sessionRepo = createOperatorSessionRepository(db);

      const [missions, missionItems] = await Promise.all([missionRepo.getAll(), itemRepo.getAll()]);

      const now = systemClock.now().toISOString();
      const newSession: OperatorSession = {
        id: generateId(),
        userId: null,
        missionId: missions[0]?.id ?? null,
        openedAt: now,
        closedAt: null,
        appVersion: null,
        batteryLevel: null,
        offlineMode: null,
      };
      await sessionRepo.upsert(newSession);

      if (!cancelled) {
        setMission(missions[0] ?? null);
        setItems(missionItems);
        setSession(newSession);
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [getDbOverride]);

  const { activeMissionItem, nextMissionItems } = useMemo(() => deriveActiveAndNext(items), [items]);

  const value: MissionContextValue = {
    loading,
    mission,
    activeMissionItem,
    nextMissionItems,
    gpsState: { available: false },
    synchronizationState: { pendingOperations: 0 },
    offlineState: { isOffline: false },
    session,
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
