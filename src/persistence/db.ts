import type { Db } from './types';
import { runMigrations } from './migrations';

const DATABASE_NAME = 'reca-operateur.db';

let dbPromise: Promise<Db> | null = null;

// Singleton connection, migrated on first open. `expo-sqlite` is imported
// dynamically (only when this is actually called) so that importing this
// module — even transitively, e.g. via MissionContext — never touches the
// native module by itself. Tests inject their own fake Db and never call
// this at all (see MissionProvider's `getDb` prop).
export function getDb(): Promise<Db> {
  if (!dbPromise) {
    dbPromise = import('expo-sqlite').then(async ({ openDatabaseAsync }) => {
      const db = await openDatabaseAsync(DATABASE_NAME);
      await runMigrations(db);
      return db;
    });
  }
  return dbPromise;
}
