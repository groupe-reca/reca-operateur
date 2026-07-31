import type { Db, SqlParam } from '../types';

export type Repository<T extends { id: string }> = {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  upsert(entity: T): Promise<void>;
  remove(id: string): Promise<void>;
};

// Generic CRUD over a single table keyed by `id`. The 7 entity repositories
// only differ by table name + column list + row<->entity mapping — this
// factors out the repeated get-all/get-by-id/upsert/delete shape instead of
// hand-writing it 7 times (docs/10: one clear responsibility per module).
export function createRepository<T extends { id: string }>(
  db: Db,
  table: string,
  columns: string[],
  toRow: (entity: T) => SqlParam[],
  fromRow: (row: Record<string, unknown>) => T
): Repository<T> {
  const placeholders = columns.map(() => '?').join(', ');
  const updateAssignments = columns
    .filter((column) => column !== 'id')
    .map((column) => `${column} = excluded.${column}`)
    .join(', ');

  return {
    async getAll() {
      const rows = await db.getAllAsync<Record<string, unknown>>(`SELECT * FROM ${table}`, []);
      return rows.map(fromRow);
    },
    async getById(id) {
      const row = await db.getFirstAsync<Record<string, unknown>>(`SELECT * FROM ${table} WHERE id = ?`, [id]);
      return row ? fromRow(row) : null;
    },
    async upsert(entity) {
      await db.runAsync(
        `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})
         ON CONFLICT(id) DO UPDATE SET ${updateAssignments}`,
        toRow(entity)
      );
    },
    async remove(id) {
      await db.runAsync(`DELETE FROM ${table} WHERE id = ?`, [id]);
    },
  };
}
