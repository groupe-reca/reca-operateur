import { runMigrations, SCHEMA_VERSION } from '@/persistence/migrations';
import type { Db, SqlParam } from '@/persistence/types';

// Bug found testing on a real device (2026-08-03): `runMigrations` never
// exercised its ALTER path in any test (`tests/testFakeDb.ts` doesn't track
// real columns — repositories/seed never needed it to). This is a small,
// purpose-built fake that DOES track per-table columns, enough to prove the
// migration logic itself: `CREATE TABLE IF NOT EXISTS` / `ALTER TABLE ADD
// COLUMN` / `PRAGMA table_info` / a single-row `schema_version` table.
function createSchemaAwareFakeDb(): Db & { columnsOf(table: string): string[] } {
  const tables = new Map<string, string[]>();
  let schemaVersionRow: { version: number } | null = null;

  function parseColumnNames(columnsBlock: string): string[] {
    // Splits "col1 TYPE, col2 TYPE NOT NULL DEFAULT 0, ..." into
    // ["col1", "col2", ...] — good enough for this file's own statements,
    // never a general SQL parser.
    return columnsBlock
      .split(',')
      .map((part) => part.trim().split(/\s+/)[0] as string)
      .filter(Boolean);
  }

  return {
    columnsOf(table: string) {
      return tables.get(table) ?? [];
    },
    async execAsync(source: string) {
      const createMatch = /CREATE TABLE IF NOT EXISTS (\w+) \(([\s\S]+)\)/i.exec(source);
      if (createMatch) {
        const table = createMatch[1] as string;
        if (!tables.has(table)) {
          tables.set(table, parseColumnNames(createMatch[2] as string));
        }
        return;
      }
      const alterMatch = /ALTER TABLE (\w+) ADD COLUMN (\w+)/i.exec(source);
      if (alterMatch) {
        const table = alterMatch[1] as string;
        const column = alterMatch[2] as string;
        const columns = tables.get(table);
        if (!columns) throw new Error(`fakeDb.execAsync: unknown table ${table}`);
        if (!columns.includes(column)) columns.push(column);
        return;
      }
      throw new Error(`fakeDb.execAsync: unsupported statement: ${source}`);
    },
    async runAsync(source: string, params: SqlParam[]) {
      if (/INSERT INTO schema_version/i.test(source)) {
        schemaVersionRow = { version: params[0] as number };
        return { changes: 1 };
      }
      if (/UPDATE schema_version SET version/i.test(source)) {
        schemaVersionRow = { version: params[0] as number };
        return { changes: 1 };
      }
      throw new Error(`fakeDb.runAsync: unsupported statement: ${source}`);
    },
    async getAllAsync<T>(source: string) {
      const pragmaMatch = /PRAGMA table_info\((\w+)\)/i.exec(source);
      if (pragmaMatch) {
        const table = pragmaMatch[1] as string;
        return (tables.get(table) ?? []).map((name) => ({ name })) as T[];
      }
      throw new Error(`fakeDb.getAllAsync: unsupported statement: ${source}`);
    },
    async getFirstAsync<T>(source: string) {
      if (/FROM schema_version/i.test(source)) {
        return schemaVersionRow as T | null;
      }
      throw new Error(`fakeDb.getFirstAsync: unsupported statement: ${source}`);
    },
    async withTransactionAsync(task: () => Promise<void>) {
      await task();
    },
  };
}

describe('runMigrations', () => {
  it('a fresh install ends up with every sync_operations column and schema_version set', async () => {
    const db = createSchemaAwareFakeDb();
    await runMigrations(db);

    expect(db.columnsOf('sync_operations')).toEqual(
      expect.arrayContaining([
        'mission_id',
        'mission_item_id',
        'local_sequence',
        'attempt_count',
        'idempotency_key',
        'last_attempt_at',
        'next_attempt_at',
        'last_error_code',
        'last_error_message',
      ])
    );
  });

  it('an existing device stuck on the pre-013-014 sync_operations shape gets the missing columns added', async () => {
    const db = createSchemaAwareFakeDb();
    // Simulate a device whose `sync_operations` was created before Sprint
    // 013-014 (the exact table found broken on the real TECNO KL4 test):
    // only the original Sprint 007-008 columns exist.
    await db.execAsync(`CREATE TABLE IF NOT EXISTS sync_operations (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      synced_at TEXT
    )`);
    await db.runAsync('INSERT INTO schema_version (version) VALUES (?)', [1]);

    expect(db.columnsOf('sync_operations')).not.toContain('mission_id');

    await runMigrations(db);

    expect(db.columnsOf('sync_operations')).toEqual(
      expect.arrayContaining([
        'entity_type',
        'mission_id',
        'mission_item_id',
        'local_sequence',
        'attempt_count',
        'idempotency_key',
        'last_attempt_at',
        'next_attempt_at',
        'last_error_code',
        'last_error_message',
      ])
    );
  });

  it('running twice is a no-op the second time (idempotent) and leaves schema_version at SCHEMA_VERSION', async () => {
    const db = createSchemaAwareFakeDb();
    await runMigrations(db);
    const columnsAfterFirstRun = db.columnsOf('sync_operations');

    await runMigrations(db);
    expect(db.columnsOf('sync_operations')).toEqual(columnsAfterFirstRun);

    const version = await db.getFirstAsync<{ version: number }>('SELECT version FROM schema_version LIMIT 1', []);
    expect(version?.version).toBe(SCHEMA_VERSION);
  });
});
