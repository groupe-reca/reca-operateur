import type { Db } from '@/persistence/types';

type Row = Record<string, unknown>;

// Minimal in-memory fake of the small expo-sqlite surface our repositories
// use — enough to test real upsert/get/delete/transaction behaviour without
// a native module or a real SQL engine (expo-sqlite can't run under Jest,
// same as @rnmapbox/maps — see memory.md). Deliberately dumb: no real SQL
// parsing, just enough pattern matching for the handful of statement shapes
// our repositories/migrations actually issue.
export function createFakeDb(): Db {
  const tables = new Map<string, Map<string, Row>>();

  function tableFor(name: string): Map<string, Row> {
    let table = tables.get(name);
    if (!table) {
      table = new Map();
      tables.set(name, table);
    }
    return table;
  }

  return {
    async execAsync() {
      // CREATE TABLE / schema statements — tables are created lazily by
      // tableFor() on first real use, nothing to do here.
    },
    async runAsync(source, params) {
      const insertMatch = /INSERT INTO (\w+) \(([^)]+)\)/i.exec(source);
      if (insertMatch) {
        const tableName = insertMatch[1] as string;
        const columns = (insertMatch[2] as string).split(',').map((column) => column.trim());
        const row: Row = {};
        columns.forEach((column, index) => {
          row[column] = params[index];
        });
        tableFor(tableName).set(String(row.id), row);
        return { changes: 1 };
      }
      const deleteMatch = /DELETE FROM (\w+) WHERE id = \?/i.exec(source);
      if (deleteMatch) {
        const tableName = deleteMatch[1] as string;
        const existed = tableFor(tableName).delete(String(params[0]));
        return { changes: existed ? 1 : 0 };
      }
      throw new Error(`fakeDb.runAsync: unsupported statement: ${source}`);
    },
    async getAllAsync<T>(source: string) {
      const match = /FROM (\w+)/i.exec(source);
      if (!match) {
        throw new Error(`fakeDb.getAllAsync: unsupported statement: ${source}`);
      }
      return [...tableFor(match[1] as string).values()] as T[];
    },
    async getFirstAsync<T>(source: string, params: unknown[]) {
      const whereMatch = /FROM (\w+) WHERE id = \?/i.exec(source);
      if (whereMatch) {
        const row = tableFor(whereMatch[1] as string).get(String(params[0]));
        return (row ?? null) as T | null;
      }
      const bareMatch = /FROM (\w+)/i.exec(source);
      if (bareMatch) {
        const [first] = [...tableFor(bareMatch[1] as string).values()];
        return (first ?? null) as T | null;
      }
      throw new Error(`fakeDb.getFirstAsync: unsupported statement: ${source}`);
    },
    async withTransactionAsync(task) {
      await task();
    },
  };
}
