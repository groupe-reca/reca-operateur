import { act, renderHook, waitFor } from '@testing-library/react-native';

import { systemClock } from '@/domain/clock';
import type { Speaker } from '@/engines/voice';
import { createStateMachine } from '@/engines/state-machine';
import type { SyncOperationOutcome, SyncTransport } from '@/engines/sync/types';
import type { SyncOperation } from '@/domain/entities';
import { MissionProvider, useMissionContext } from '@/context/MissionContext';

import { createFakeDb } from './testFakeDb';

// Sprint 017 (partie 1/N) integration test: MissionProvider wired to the
// real State Machine/GPS/Sync/Offline/Voice engines over a fake in-memory DB
// (expo-sqlite can't run under Jest, see testFakeDb.ts). `syncTransportOverride`/
// `speakerOverride` keep this test from ever touching the real network or a
// native speech module — same "jamais de vrai réseau touché en test" rule as
// every other engine test in this repo (memory.md).
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
    const { result, db } = renderMissionContext();
    await waitFor(() => expect(result.current.loading).toBe(false));

    // The seeded demo Mission starts READY (docs/09 Mission graph: only
    // IN_PROGRESS -> COMPLETED is allowed). Moving it to IN_PROGRESS is the
    // "démarrer" action of the "Mission active" screen (docs/11), out of
    // scope for this pass (see plans.md) — a real Supabase mission already
    // arrives IN_PROGRESS instead (fetchAssignedMission.ts maps `statut ===
    // 'en_cours'`), so this simulates that real path directly against the
    // same fake db rather than exposing an unused context command with no
    // caller yet.
    const missionId = result.current.mission?.id as string;
    await act(async () => {
      await createStateMachine(db, systemClock).requestMissionStart(missionId);
    });

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
});
