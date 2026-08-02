import type { Db } from './types';

// The 7 "entités prioritaires" of docs/11-Roadmap.md Phase 05, with columns
// taken from docs/03-Data-Architecture.md (Mission/MissionItem) and
// docs/09-State-Machine.md (StateTransition). `CREATE TABLE IF NOT EXISTS`
// is itself idempotent; a single version marker is enough for now — an
// ALTER-based upgrade path is a future concern once the schema actually
// needs to change across app versions in the field.
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
  // Sprint 013-014 — full docs/07 "Structure d'une opération" shape. No
  // ALTER-based upgrade path: this table has no real users yet (see
  // memory.md), so redefining CREATE TABLE is enough — an ALTER path is a
  // future concern once the schema needs to change under real field data.
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

export const SCHEMA_VERSION = 1;

export async function runMigrations(db: Db): Promise<void> {
  for (const statement of STATEMENTS) {
    await db.execAsync(statement);
  }
  const existing = await db.getFirstAsync<{ version: number }>('SELECT version FROM schema_version LIMIT 1', []);
  if (!existing) {
    await db.runAsync('INSERT INTO schema_version (version) VALUES (?)', [SCHEMA_VERSION]);
  }
}
