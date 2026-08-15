// Jest manual mock for @op-engineering/op-sqlite — backed by a real in-memory SQLite
// database (via better-sqlite3, a plain Node native module) instead of the previous
// no-op stand-in that returned empty rows for every query. That made db.ts's CRUD,
// constraints, migrations and transaction rollback completely untestable — a bug in the
// actual SQL could never be caught here. This mock runs the real SQL db.ts sends it
// against a real SQLite engine, so schema mistakes, constraint violations and rollback
// behavior surface exactly like they would on-device.
//
// Every `open()` call returns a fresh `:memory:` database — db.ts.ts caches its own
// instance in a module-level singleton, so tests get isolation by calling
// `jest.resetModules()` + re-requiring `db.ts` between cases (see db.test.ts), not by
// this mock caching anything.

const Database = require('better-sqlite3');

function run(sqlite, query, params) {
  const stmt = sqlite.prepare(query);
  if (stmt.reader) {
    return { rows: stmt.all(params ?? []), rowsAffected: 0 };
  }
  const info = stmt.run(params ?? []);
  return { rows: [], rowsAffected: info.changes };
}

function makeDb() {
  const sqlite = new Database(':memory:');

  return {
    execute: jest.fn(async (query, params) => run(sqlite, query, params)),
    executeSync: jest.fn((query, params) => run(sqlite, query, params)),
    close: jest.fn(() => sqlite.close()),
    closeAsync: jest.fn(async () => sqlite.close()),
    // op-sqlite auto-commits when the callback resolves and auto-rolls-back when it
    // throws (see its type declarations) — db.ts relies on exactly that, never calling
    // tx.commit()/tx.rollback() itself. better-sqlite3's own .transaction() helper is
    // sync-only, so BEGIN/COMMIT/ROLLBACK are driven by hand to support the async
    // callback db.ts passes in.
    transaction: jest.fn(async fn => {
      sqlite.exec('BEGIN');
      try {
        await fn({
          execute: async (query, params) => run(sqlite, query, params),
          commit: async () => {
            sqlite.exec('COMMIT');
            return { rows: [], rowsAffected: 0 };
          },
          rollback: () => {
            sqlite.exec('ROLLBACK');
            return { rows: [], rowsAffected: 0 };
          },
        });
        sqlite.exec('COMMIT');
      } catch (err) {
        try {
          sqlite.exec('ROLLBACK');
        } catch {
          // Already rolled back (e.g. the callback called tx.rollback() itself) — ignore.
        }
        throw err;
      }
    }),
  };
}

module.exports = {
  open: jest.fn(() => makeDb()),
  openAsync: jest.fn(async () => makeDb()),
  openSync: jest.fn(() => makeDb()),
  openRemote: jest.fn(() => makeDb()),
  isSQLCipher: jest.fn(() => false),
  isLibsql: jest.fn(() => false),
  isTurso: jest.fn(() => false),
  isIOSEmbedded: jest.fn(() => false),
};
