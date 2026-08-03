import { act, renderHook, waitFor } from '@testing-library/react-native';

import type { GpsPosition } from '@/engines/gps';
import type { Speaker } from '@/engines/voice';
import type { SyncOperationOutcome, SyncTransport } from '@/engines/sync/types';
import type { SyncOperation } from '@/domain/entities';
import { MissionProvider, useMissionContext } from '@/context/MissionContext';
import type { LocationProvider } from '@/integrations/location/expoLocationProvider';
import type { NetworkSensor } from '@/integrations/network/expoNetInfoProvider';
import { createMissionItemRepository } from '@/persistence/repositories/missionItemRepository';

import { createFakeDb } from './testFakeDb';

// Sprint 017 (partie 1/N) integration test: MissionProvider wired to the
// real State Machine/GPS/Sync/Offline/Voice engines over a fake in-memory DB
// (expo-sqlite can't run under Jest, see testFakeDb.ts). `syncTransportOverride`/
// `speakerOverride`/`locationProviderOverride`/`networkSensorOverride` keep
// this test from ever touching the real network, a native speech module, or
// `expo-location`/NetInfo (Sprint 017 partie 2/N) — same "jamais de vrai
// réseau/capteur touché en test" rule as every other engine test in this
// repo (memory.md).
function createFakeTransport(): SyncTransport & { sent: SyncOperation[] } {
  const sent: SyncOperation[] = [];
  return {
    sent,
    async send(operations: SyncOperation[]): Promise<SyncOperationOutcome[]> {
      sent.push(...operations);
      return operations.map((operation) => ({ operationId: operation.id, success: true }));
    },
  };
}

function createFakeSpeaker(): Speaker {
  return {
    isAvailable: () => true,
    speak: () => Promise.resolve(),
    stop: () => {},
  };
}

// Never grants/never emits a fix — the GPS-driven test below exercises the
// engine chain through `dev.gps` (the Sprint 011-012 simulator) instead,
// exactly like a real device would coexist with the dev tool.
function createFakeLocationProvider(): LocationProvider {
  return {
    start: async () => ({ granted: false }),
    stop: () => {},
  };
}

// Never fires — tests that care about network state drive it through
// `dev.setNetworkOverride` instead, the same override a real sensor would
// have to yield priority to.
function createFakeNetworkSensor(): NetworkSensor {
  return { start: () => () => {} };
}

// A location provider whose fixes are driven by the test itself, exercising
// the *real* sensor code path (as opposed to `dev.gps`, the Sprint 011-012
// simulator's path) — the two are independent callers of the same GPS
// Engine, both need coverage.
function createControllableLocationProvider() {
  let onFix: ((fix: GpsPosition) => void | Promise<void>) | null = null;
  const provider: LocationProvider = {
    start: async (fix) => {
      onFix = fix;
      return { granted: true };
    },
    stop: () => {
      onFix = null;
    },
  };
  return {
    provider,
    async emit(position: GpsPosition) {
      await onFix?.(position);
    },
  };
}

function renderMissionContext() {
  const db = createFakeDb();
  const transport = createFakeTransport();
  return {
    db,
    transport,
    ...renderHook(() => useMissionContext(), {
      wrapper: ({ children }) => (
        <MissionProvider
          getDbOverride={() => Promise.resolve(db)}
          syncTransportOverride={() => transport}
          speakerOverride={() => createFakeSpeaker()}
          locationProviderOverride={() => createFakeLocationProvider()}
          networkSensorOverride={() => createFakeNetworkSensor()}
        >
          {children}
        </MissionProvider>
      ),
    }),
  };
}

describe('MissionContext — real engines wired over a fake DB', () => {
  it('loads the seeded demo mission with its first item EN_ROUTE and active', async () => {
    const { result } = renderMissionContext();

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.mission).not.toBeNull();
    expect(result.current.activeMissionItem?.status).toBe('EN_ROUTE');
    expect(result.current.allMissionItems.length).toBeGreaterThan(0);
    expect(result.current.nextMissionItems.every((item) => item.status === 'WAITING')).toBe(true);
  });

  it('reportProblem moves the active item to PROBLEM and clears activeMissionItem', async () => {
    const { result } = renderMissionContext();
    await waitFor(() => expect(result.current.loading).toBe(false));

    const activeId = result.current.activeMissionItem?.id;
    expect(activeId).toBeTruthy();

    await act(async () => {
      await result.current.reportProblem(activeId as string, 'ACCES_BLOQUE', 'Entrée bloquée');
    });

    await waitFor(() => {
      const item = result.current.allMissionItems.find((candidate) => candidate.id === activeId);
      expect(item?.status).toBe('PROBLEM');
    });
    // PROBLEM is excluded from ACTIVE_ITEM_STATES (docs/09) — the context
    // must not surface it as the active item.
    expect(result.current.activeMissionItem).toBeNull();
  });

  it('resolveProblem brings the item back to an active state', async () => {
    const { result } = renderMissionContext();
    await waitFor(() => expect(result.current.loading).toBe(false));

    const activeId = result.current.activeMissionItem?.id as string;
    await act(async () => {
      await result.current.reportProblem(activeId, 'ACCES_BLOQUE', null);
    });
    await waitFor(() => {
      expect(result.current.allMissionItems.find((i) => i.id === activeId)?.status).toBe('PROBLEM');
    });

    await act(async () => {
      await result.current.resolveProblem(activeId, 'EN_ROUTE');
    });

    await waitFor(() => {
      expect(result.current.activeMissionItem?.id).toBe(activeId);
    });
    expect(result.current.activeMissionItem?.status).toBe('EN_ROUTE');
  });

  it('skipItem moves a WAITING item to SKIPPED and queues a sync operation for it', async () => {
    const { result, transport } = renderMissionContext();
    await waitFor(() => expect(result.current.loading).toBe(false));

    const waitingId = result.current.nextMissionItems[0]?.id as string;
    expect(waitingId).toBeTruthy();

    await act(async () => {
      await result.current.skipItem(waitingId);
    });

    await waitFor(() => {
      expect(result.current.allMissionItems.find((i) => i.id === waitingId)?.status).toBe('SKIPPED');
    });
    expect(transport.sent.some((operation) => operation.entityId === waitingId)).toBe(true);
  });

  it('closeMission refuses while a MissionItem is still WAITING/active', async () => {
    const { result } = renderMissionContext();
    await waitFor(() => expect(result.current.loading).toBe(false));

    let outcome: Awaited<ReturnType<typeof result.current.closeMission>> | undefined;
    await act(async () => {
      outcome = await result.current.closeMission();
    });

    expect(outcome?.success).toBe(false);
    expect(result.current.mission?.status).not.toBe('COMPLETED');
  });

  it('closeMission completes the mission once every item is resolved (SKIPPED/PROBLEM allowed)', async () => {
    const { result } = renderMissionContext();
    await waitFor(() => expect(result.current.loading).toBe(false));

    // The seeded demo Mission starts READY (docs/09 Mission graph: only
    // IN_PROGRESS -> COMPLETED is allowed) — `startMission()` (the "Mission
    // active" screen's "démarrer" command) moves it to IN_PROGRESS first.
    await act(async () => {
      await result.current.startMission();
    });
    await waitFor(() => expect(result.current.mission?.status).toBe('IN_PROGRESS'));

    // Skip every item (the active one is EN_ROUTE -> SKIPPED directly
    // allowed, docs/09 transition graph; the rest are WAITING -> SKIPPED).
    for (const item of result.current.allMissionItems) {
      const id = item.id;
      await act(async () => {
        await result.current.skipItem(id);
      });
      await waitFor(() => {
        expect(result.current.allMissionItems.find((i) => i.id === id)?.status).toBe('SKIPPED');
      });
    }

    let outcome: Awaited<ReturnType<typeof result.current.closeMission>> | undefined;
    await act(async () => {
      outcome = await result.current.closeMission();
    });

    expect(outcome?.success).toBe(true);
    await waitFor(() => expect(result.current.mission?.status).toBe('COMPLETED'));
  });

  it('dev.setNetworkOverride(false) forces the Offline Engine OFFLINE, null lets it recover', async () => {
    const { result } = renderMissionContext();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.offlineState.status).toBe('ONLINE');

    await act(async () => {
      await result.current.dev.setNetworkOverride(false);
    });
    await waitFor(() => expect(result.current.offlineState.status).toBe('OFFLINE'));

    await act(async () => {
      await result.current.dev.setNetworkOverride(null);
    });
    // docs/08: OFFLINE -> RECOVERING as soon as the network signal comes
    // back, never straight back to ONLINE without validation — same rule
    // tested directly in offlineEngine.test.ts.
    await waitFor(() => expect(result.current.offlineState.status).toBe('RECOVERING'));
  });

  it('dev.gps drives the real GPS Engine -> State Machine -> context chain (EN_ROUTE -> APPROACHING)', async () => {
    const { result, db } = renderMissionContext();
    await waitFor(() => expect(result.current.loading).toBe(false));

    const activeId = result.current.activeMissionItem?.id as string;
    const coordinate = { latitude: 45.78, longitude: -73.95 };

    // The demo seed has no coordinates (seedDemoMission.ts) — GPS Engine
    // never receives an active residence for a null-coordinate item (see the
    // guard in MissionContext.tsx's own useEffect). Setting them directly
    // simulates what a real Supabase mission_item already has.
    const itemRepo = createMissionItemRepository(db);
    const activeItem = await itemRepo.getById(activeId);
    await itemRepo.upsert({ ...(activeItem as NonNullable<typeof activeItem>), ...coordinate });

    // First moveTo is a no-op for the engine (it has no active residence
    // yet) but its internal afterMutation reloads the item with its new
    // coordinates — which re-triggers MissionContext's own effect and
    // finally calls gpsEngine.setActiveResidence with the real coordinate.
    await act(async () => {
      await result.current.dev.gps.moveTo(coordinate);
    });

    // Now the engine has an active residence at exactly `coordinate` (0 m
    // away, well within the default 250 m approach radius) — one more fix
    // starts the entry-validation window, advancing time past the default
    // 5 s validation delay confirms it (see gpsEngine.test.ts for the
    // detailed radius/delay behaviour, not re-tested here).
    await act(async () => {
      await result.current.dev.gps.moveTo(coordinate);
      await result.current.dev.gps.advanceTime(5);
    });

    await waitFor(() => {
      expect(result.current.allMissionItems.find((i) => i.id === activeId)?.status).toBe('APPROACHING');
    });
  });

  it('gpsState reflects a real location provider granting permission, and its fixes drive the same engine chain as dev.gps', async () => {
    const { provider, emit } = createControllableLocationProvider();
    const db = createFakeDb();
    const transport = createFakeTransport();
    const { result } = renderHook(() => useMissionContext(), {
      wrapper: ({ children }) => (
        <MissionProvider
          getDbOverride={() => Promise.resolve(db)}
          syncTransportOverride={() => transport}
          speakerOverride={() => createFakeSpeaker()}
          locationProviderOverride={() => provider}
          networkSensorOverride={() => createFakeNetworkSensor()}
        >
          {children}
        </MissionProvider>
      ),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.gpsState).toEqual({ available: true });

    const activeId = result.current.activeMissionItem?.id as string;
    const coordinate = { latitude: 45.78, longitude: -73.95 };
    const itemRepo = createMissionItemRepository(db);
    const activeItem = await itemRepo.getById(activeId);
    await itemRepo.upsert({ ...(activeItem as NonNullable<typeof activeItem>), ...coordinate });

    const fixAt = (timestamp: string): GpsPosition => ({
      ...coordinate,
      accuracyMeters: 5,
      headingDegrees: null,
      speedMetersPerSecond: null,
      timestamp: new Date(timestamp),
    });

    // Same two-step dance as the dev.gps test above: the first fix only
    // reloads the item's new coordinates (no active residence armed yet in
    // the engine); the second fix (5 s later by timestamp, not wall-clock —
    // the engine compares `GpsPosition.timestamp`, see gpsEngine.test.ts)
    // confirms the approach-radius entry.
    await act(async () => {
      await emit(fixAt('2026-08-02T10:00:00.000Z'));
    });
    await act(async () => {
      await emit(fixAt('2026-08-02T10:00:00.000Z'));
      await emit(fixAt('2026-08-02T10:00:05.000Z'));
    });

    await waitFor(() => {
      expect(result.current.allMissionItems.find((i) => i.id === activeId)?.status).toBe('APPROACHING');
    });
  });

  it('gpsState reports permission_denied when the location provider refuses', async () => {
    const deniedProvider: LocationProvider = {
      start: async () => ({ granted: false }),
      stop: () => {},
    };
    const { result } = renderHook(() => useMissionContext(), {
      wrapper: ({ children }) => (
        <MissionProvider
          getDbOverride={() => Promise.resolve(createFakeDb())}
          syncTransportOverride={() => createFakeTransport()}
          speakerOverride={() => createFakeSpeaker()}
          locationProviderOverride={() => deniedProvider}
          networkSensorOverride={() => createFakeNetworkSensor()}
        >
          {children}
        </MissionProvider>
      ),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.gpsState).toEqual({ available: false, reason: 'permission_denied' });
  });

  it('a real network sensor event (not the dev override) also drives offlineState', async () => {
    let onChange: ((online: boolean) => void) | null = null;
    const sensor: NetworkSensor = {
      start: (cb) => {
        onChange = cb;
        return () => {
          onChange = null;
        };
      },
    };
    const { result } = renderHook(() => useMissionContext(), {
      wrapper: ({ children }) => (
        <MissionProvider
          getDbOverride={() => Promise.resolve(createFakeDb())}
          syncTransportOverride={() => createFakeTransport()}
          speakerOverride={() => createFakeSpeaker()}
          locationProviderOverride={() => createFakeLocationProvider()}
          networkSensorOverride={() => sensor}
        >
          {children}
        </MissionProvider>
      ),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.offlineState.status).toBe('ONLINE');

    // The sensor alone doesn't push offlineState — it only updates the ref
    // read by `networkStatus.isOnline()`; a real check (`checkConnectivity`,
    // normally triggered by an actual sync attempt) has to run for it to
    // show up here, exactly like `dev.setNetworkOverride` does internally.
    act(() => {
      onChange?.(false);
    });
    await act(async () => {
      await result.current.dev.setNetworkOverride(null);
    });
    await waitFor(() => expect(result.current.offlineState.status).toBe('OFFLINE'));
  });

  it('startMission moves the demo mission READY -> IN_PROGRESS', async () => {
    const { result } = renderMissionContext();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.mission?.status).toBe('READY');

    let outcome: Awaited<ReturnType<typeof result.current.startMission>> | undefined;
    await act(async () => {
      outcome = await result.current.startMission();
    });

    expect(outcome?.success).toBe(true);
    await waitFor(() => expect(result.current.mission?.status).toBe('IN_PROGRESS'));
  });

  it('startMission refuses once the mission is already IN_PROGRESS (no duplicate transition)', async () => {
    const { result } = renderMissionContext();
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.startMission();
    });
    await waitFor(() => expect(result.current.mission?.status).toBe('IN_PROGRESS'));

    let outcome: Awaited<ReturnType<typeof result.current.startMission>> | undefined;
    await act(async () => {
      outcome = await result.current.startMission();
    });

    expect(outcome?.success).toBe(false);
  });
});
