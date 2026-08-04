import type { Db } from './types';

// The 7 "entités prioritaires" of docs/11-Roadmap.md Phase 05, with columns
// taken from docs/03-Data-Architecture.md (Mission/MissionItem) and
// docs/09-State-Machine.md (StateTransition). `CREATE TABLE IF NOT EXISTS`
// is itself idempotent, but only for tables that don't exist yet — it does
// nothing to a table that already exists with an older column set (see
// `migrateTo2` below, added after finding exactly this on a real device).
const STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS missions (
    id TEXT PRIMARY KEY,
    date TEXT,
    route TEXT,
    operator TEXT,
    equipment TEXT,
    status TEXT NOT NULL,
    scheduled_start_at TEXT,
    actual_start_at TEXT,
    actual_end_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS mission_items (
    id TEXT PRIMARY KEY,
    mission_id TEXT NOT NULL,
    contract_id TEXT,
    ordre INTEGER NOT NULL,
    address TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    detection_radius_meters REAL,
    status TEXT NOT NULL,
    en_route_at TEXT,
    en_approche_at TEXT,
    en_cours_at TEXT,
    terminee_at TEXT,
    travel_time_seconds INTEGER,
    intervention_time_seconds INTEGER,
    notes TEXT,
    problem_code TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS state_transitions (
    id TEXT PRIMARY KEY,
    mission_id TEXT NOT NULL,
    mission_item_id TEXT,
    from_state TEXT NOT NULL,
    to_state TEXT NOT NULL,
    source TEXT NOT NULL,
    occurred_at_utc TEXT NOT NULL,
    occurred_at_local TEXT NOT NULL,
    timezone TEXT NOT NULL,
    gps_accuracy_meters REAL,
    latitude REAL,
    longitude REAL,
    reason TEXT
  )`,
  // Sprint 013-014 — full docs/07 "Structure d'une opération" shape.
  // `CREATE TABLE IF NOT EXISTS` only builds this full shape on a device
  // that never had `sync_operations` before — an existing installation
  // from before this sprint keeps its older, narrower table forever unless
  // `migrateTo2` (below) adds the missing columns explicitly.
  `CREATE TABLE IF NOT EXISTS sync_operations (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    operation TEXT NOT NULL,
    payload TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    synced_at TEXT,
    mission_id TEXT,
    mission_item_id TEXT,
    local_sequence INTEGER NOT NULL,
    attempt_count INTEGER NOT NULL,
    idempotency_key TEXT NOT NULL,
    last_attempt_at TEXT,
    next_attempt_at TEXT,
    last_error_code TEXT,
    last_error_message TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS operator_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    mission_id TEXT,
    opened_at TEXT NOT NULL,
    closed_at TEXT,
    app_version TEXT,
    battery_level REAL,
    offline_mode INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS problems (
    id TEXT PRIMARY KEY,
    mission_item_id TEXT NOT NULL,
    code TEXT NOT NULL,
    note TEXT,
    reported_at TEXT NOT NULL,
    resolved_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS mission_alerts (
    id TEXT PRIMARY KEY,
    mission_item_id TEXT NOT NULL,
    level TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
];

export const SCHEMA_VERSION = 2;

async function columnExists(db: Db, table: string, column: string): Promise<boolean> {
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`, []);
  return columns.some((c) => c.name === column);
}

async function addColumnIfMissing(db: Db, table: string, column: string, definition: string): Promise<void> {
  if (!(await columnExists(db, table, column))) {
    await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

// Bug found testing on a real device (2026-08-03): a local DB created before
// Sprint 013-014 kept the narrower Sprint 007-008 `sync_operations` shape
// forever — `CREATE TABLE IF NOT EXISTS` is a no-op once the table already
// exists, so these 9 columns never arrived, and every write crashed
// (`NativeDatabase.prepareAsync` rejected: "no column named mission_id").
// `addColumnIfMissing` makes this safe to run on every launch regardless of
// version (a fresh install already has every column via `CREATE TABLE`
// above, so each check is just a no-op there).
async function migrateTo2(db: Db): Promise<void> {
  await addColumnIfMissing(db, 'sync_operations', 'mission_id', 'TEXT');
  await addColumnIfMissing(db, 'sync_operations', 'mission_item_id', 'TEXT');
  await addColumnIfMissing(db, 'sync_operations', 'local_sequence', 'INTEGER NOT NULL DEFAULT 0');
  await addColumnIfMissing(db, 'sync_operations', 'attempt_count', 'INTEGER NOT NULL DEFAULT 0');
  await addColumnIfMissing(db, 'sync_operations', 'idempotency_key', 'TEXT NOT NULL DEFAULT ""');
  await addColumnIfMissing(db, 'sync_operations', 'last_attempt_at', 'TEXT');
  await addColumnIfMissing(db, 'sync_operations', 'next_attempt_at', 'TEXT');
  await addColumnIfMissing(db, 'sync_operations', 'last_error_code', 'TEXT');
  await addColumnIfMissing(db, 'sync_operations', 'last_error_message', 'TEXT');
}

// Ordered by target version — each entry runs once, only for a device whose
// stored `schema_version` is below it. Add the next entry here (never
// rewrite an old one) the next time the schema needs to change under real
// field data.
const MIGRATIONS: { version: number; run: (db: Db) => Promise<void> }[] = [{ version: 2, run: migrateTo2 }];

export async function runMigrations(db: Db): Promise<void> {
  for (const statement of STATEMENTS) {
    await db.execAsync(statement);
  }

  const existing = await db.getFirstAsync<{ version: number }>('SELECT version FROM schema_version LIMIT 1', []);
  const currentVersion = existing?.version ?? 0;

  for (const migration of MIGRATIONS) {
    if (currentVersion < migration.version) {
      await migration.run(db);
    }
  }

  if (!existing) {
    await db.runAsync('INSERT INTO schema_version (version) VALUES (?)', [SCHEMA_VERSION]);
  } else if (existing.version !== SCHEMA_VERSION) {
    await db.runAsync('UPDATE schema_version SET version = ?', [SCHEMA_VERSION]);
  }
}
