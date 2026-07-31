import type { Clock } from '@/domain/clock';
import type { Mission, MissionItem } from '@/domain/entities';
import { generateId } from '@/domain/id';

import { createMissionItemRepository } from './repositories/missionItemRepository';
import { createMissionRepository } from './repositories/missionRepository';
import type { Db } from './types';

// "Données simulées persistantes" (Roadmap Phase 05). Reuses the exact
// narrative already established in missionScreenMocks.ts (Mission 24-01-15,
// Saint-Jérôme, 224 rue Scott…) so both data sources stay recognizable as
// "the same demo world" even though they aren't wired together yet —
// MissionScreen still reads its own static mocks (see memory.md, decision on
// integration scope). Idempotent: does nothing if a mission already exists.
const DEMO_ADDRESSES = ['224 rue Scott', '230 rue Scott', '12 rue Saint-Georges', '18 rue Saint-Georges', '5 rue Labelle'];

export async function seedDemoMissionIfEmpty(db: Db, clock: Clock): Promise<void> {
  const missionRepo = createMissionRepository(db);
  const existing = await missionRepo.getAll();
  if (existing.length > 0) {
    return;
  }

  const now = clock.now().toISOString();
  const missionId = generateId();

  const mission: Mission = {
    id: missionId,
    date: now.slice(0, 10),
    route: 'Route 12A',
    operator: 'Opérateur Démo',
    equipment: 'Kubota 01',
    status: 'READY',
    scheduledStartAt: null,
    actualStartAt: null,
    actualEndAt: null,
    createdAt: now,
    updatedAt: now,
  };

  const items: MissionItem[] = DEMO_ADDRESSES.map((address, index) => ({
    id: generateId(),
    missionId,
    contractId: null,
    ordre: index + 1,
    address,
    latitude: null,
    longitude: null,
    detectionRadiusMeters: 25,
    status: index === 0 ? 'EN_ROUTE' : 'WAITING',
    enRouteAt: index === 0 ? now : null,
    enApprocheAt: null,
    enCoursAt: null,
    termineeAt: null,
    travelTimeSeconds: null,
    interventionTimeSeconds: null,
    notes: null,
    problemCode: null,
    createdAt: now,
    updatedAt: now,
  }));

  const missionItemRepo = createMissionItemRepository(db);

  // Single atomic write — docs/10 "Transactions locales" (Mission + its
  // MissionItems must appear together or not at all).
  await db.withTransactionAsync(async () => {
    await missionRepo.upsert(mission);
    for (const item of items) {
      await missionItemRepo.upsert(item);
    }
  });
}
