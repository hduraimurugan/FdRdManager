// Jest manual mock for @op-engineering/op-sqlite — no native SQLite binary exists in the
// Jest environment, so `open()` returns an in-memory stand-in whose queries always
// resolve empty. This is enough for AppContext's hydration effect to complete without
// throwing during render tests; it isn't a real SQLite implementation.

function makeFakeDb() {
  return {
    execute: jest.fn(async () => ({ rows: [], rowsAffected: 0 })),
    executeSync: jest.fn(() => ({ rows: [], rowsAffected: 0 })),
    close: jest.fn(),
    closeAsync: jest.fn(async () => {}),
    transaction: jest.fn(async fn => fn({ execute: async () => ({ rows: [], rowsAffected: 0 }), commit: async () => ({ rows: [], rowsAffected: 0 }), rollback: () => ({ rows: [], rowsAffected: 0 }) })),
  };
}

module.exports = {
  open: jest.fn(() => makeFakeDb()),
  openAsync: jest.fn(async () => makeFakeDb()),
  openSync: jest.fn(() => makeFakeDb()),
  openRemote: jest.fn(() => makeFakeDb()),
  isSQLCipher: jest.fn(() => false),
  isLibsql: jest.fn(() => false),
  isTurso: jest.fn(() => false),
  isIOSEmbedded: jest.fn(() => false),
};
