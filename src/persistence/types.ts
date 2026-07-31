// Matches expo-sqlite's own SQLiteBindValue — the real SQLiteDatabase only
// accepts these primitive types as bound parameters (no arbitrary `unknown`).
export type SqlParam = string | number | boolean | null;

// Minimal slice of expo-sqlite's SQLiteDatabase surface that this project
// actually uses. Repositories/migrations/seed depend on THIS interface (via
// injection), never on `expo-sqlite` directly — the real SQLiteDatabase
// satisfies it structurally, and tests can pass a plain in-memory fake
// instead (see tests/testFakeDb.ts), with no native module involved.
export type Db = {
  execAsync(source: string): Promise<void>;
  // `params` is required (not optional) here on purpose: expo-sqlite's real
  // SQLiteDatabase overloads don't have a true zero-argument-array form for
  // runAsync, so an optional param wouldn't be structurally assignable from
  // the real type. Callers always pass an explicit array (possibly empty).
  runAsync(source: string, params: SqlParam[]): Promise<{ changes: number }>;
  getAllAsync<T>(source: string, params: SqlParam[]): Promise<T[]>;
  getFirstAsync<T>(source: string, params: SqlParam[]): Promise<T | null>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
};
