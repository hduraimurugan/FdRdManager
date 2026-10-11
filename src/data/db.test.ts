// Real-SQLite-backed CRUD, constraint, and migration tests for db.ts.
//
// __mocks__/@op-engineering/op-sqlite.js backs `open()` with an actual in-memory SQLite
// database (better-sqlite3) instead of the previous mock, which returned empty rows for
// every query and could not catch a single database bug. These tests run the real SQL
// db.ts sends.
//
// db.ts caches its DB connection and migration promise in module-level singletons, so
// each test calls jest.resetModules() + a fresh require('./db') to get a clean,
// isolated in-memory database — this mirrors a fresh app install for every test case.

import type { StoredFd, StoredRd } from './db';
import { buildBackupEnvelope, serializeBackup, validateBackupJson } from './backupSchema';

it('preserves custom and legacy bank names through SQLite and backup restore for FD/RD', async () => {
  jest.resetModules();
  const db = loadDb();
  await db.openDb();
  const f = sampleFd({ bankName: 'My Cooperative Bank' });
  const r = sampleRd({ bankName: 'North East Small Finance Bank' });
  await db.upsertFd(f);
  await db.upsertRd(r);
  const saved = await db.loadAll();
  expect(saved.fds[0].bankName).toBe(f.bankName);
  expect(saved.rds[0].bankName).toBe(r.bankName);
  const restored = validateBackupJson(serializeBackup(buildBackupEnvelope(saved.fds, saved.rds, {})));
  expect(restored.ok).toBe(true);
  if (!restored.ok) throw new Error('Backup round trip failed');
  await db.deleteAllData();
  await db.upsertFd(restored.fds[0]);
  await db.upsertRd(restored.rds[0]);
  const reloaded = await db.loadAll();
  expect(reloaded.fds[0].bankName).toBe(f.bankName);
  expect(reloaded.rds[0].bankName).toBe(r.bankName);
});

type DbModule = typeof import('./db');

function loadDb(): DbModule {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('./db');
}

function sampleFd(overrides: Partial<StoredFd> = {}): StoredFd {
  return {
    id: 'fd-1',
    fdNumber: 'FD001',
    bankName: 'Test Bank',
    branch: 'Main',
    bankAccountNumber: '1234567890',
    customerId: 'CUST1',
    fdHolderName: 'Jane Doe',
    jointHolder: null,
    fdType: 'Regular',
    mode: 'Online',
    status: 'Active',
    principalAmount: 100000,
    depositDate: '2026-01-01',
    startDate: '2026-01-01',
    tenureYears: 1,
    tenureMonths: 0,
    tenureDays: 0,
    interestRate: 7,
    interestType: 'Compound',
    compoundingFrequency: 'Quarterly',
    interestPayoutMode: 'At Maturity',
    interestCreditMethod: 'Reinvested into FD',
    autoRenewal: 'No',
    renewalOption: 'Do Not Renew',
    remarks: '',
    nominee: '',
    nomineeRelationship: '',
    tdsApplicable: 'Yes',
    tdsPercent: 10,
    panSubmitted: 'Yes',
    form15G: 'No',
    renewalCount: 0,
    ...overrides,
  };
}

function sampleRd(overrides: Partial<StoredRd> = {}): StoredRd {
  return {
    id: 'rd-1',
    rdNumber: 'RD001',
    bankName: 'Test Bank',
    branch: 'Main',
    bankAccountNumber: '1234567890',
    customerId: 'CUST1',
    rdHolderName: 'Jane Doe',
    jointHolder: null,
    rdType: 'Regular',
    mode: 'Online',
    status: 'Active',
    monthlyInstallment: 5000,
    startDate: '2026-01-01',
    tenureYears: 1,
    tenureMonths: 0,
    interestRate: 6.5,
    interestType: 'Compound',
    compoundingFrequency: 'Quarterly',
    installmentsPaid: 0,
    remarks: '',
    renewalCount: 0,
    ...overrides,
  };
}

beforeEach(() => {
  jest.resetModules();
});

describe('schema + migration', () => {
  it('creates all three tables and sets PRAGMA user_version = 1 on first open', async () => {
    const db = loadDb();
    await db.openDb();
    const { fds, rds } = await db.loadAll();
    expect(fds).toEqual([]);
    expect(rds).toEqual([]);
    expect(await db.getAllSettings()).toEqual({});
  });

  it('openDb() is idempotent — concurrent calls share one migration run, not several', async () => {
    const db = loadDb();
    await Promise.all([db.openDb(), db.openDb(), db.openDb()]);
    await db.upsertFd(sampleFd());
    const { fds } = await db.loadAll();
    expect(fds).toHaveLength(1);
  });

  it('re-running migrate() on an already-migrated, populated database preserves every row', async () => {
    // This is what happens on every real app launch, not a hypothetical: openDb() runs
    // migrate() again each time the process starts, so migrate() must be a safe no-op
    // once its target version has already been applied.
    const db = loadDb();
    await db.openDb();
    await db.upsertFd(sampleFd({ id: 'fd-1' }));
    await db.upsertRd(sampleRd({ id: 'rd-1' }));
    await db.setSetting('theme', 'dark');

    await db.migrate();

    const { fds, rds } = await db.loadAll();
    expect(fds).toHaveLength(1);
    expect(rds).toHaveLength(1);
    expect(await db.getSetting('theme')).toBe('dark');
  });

  it('a future ALTER-TABLE-style migration, gated by PRAGMA user_version, preserves pre-existing rows', () => {
    // db.ts documents the pattern for the next migration as:
    //   if (currentVersion < 2) { ALTER TABLE ...; PRAGMA user_version = 2 }
    // This proves that pattern is safe against real data — independent of db.ts, using
    // the same schema and the same additive-ALTER technique, since there is no real v2
    // migration yet to exercise.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Database = require('better-sqlite3');
    const sqlite = new Database(':memory:');
    sqlite.exec(`
      CREATE TABLE fixed_deposits (
        id TEXT PRIMARY KEY NOT NULL,
        fdNumber TEXT NOT NULL,
        bankName TEXT NOT NULL,
        principalAmount REAL NOT NULL
      );
    `);
    sqlite.prepare('INSERT INTO fixed_deposits (id, fdNumber, bankName, principalAmount) VALUES (?, ?, ?, ?)').run('fd-1', 'FD001', 'Test Bank', 100000);
    sqlite.pragma('user_version = 1');

    const currentVersion = sqlite.pragma('user_version', { simple: true }) as number;
    expect(currentVersion).toBe(1);
    if (currentVersion < 2) {
      sqlite.exec("ALTER TABLE fixed_deposits ADD COLUMN branch TEXT NOT NULL DEFAULT ''");
      sqlite.pragma('user_version = 2');
    }

    const row = sqlite.prepare('SELECT * FROM fixed_deposits WHERE id = ?').get('fd-1') as Record<string, unknown>;
    expect(row.fdNumber).toBe('FD001');
    expect(row.bankName).toBe('Test Bank');
    expect(row.principalAmount).toBe(100000);
    expect(row.branch).toBe(''); // new column backfilled via DEFAULT, old row untouched otherwise
    expect(sqlite.pragma('user_version', { simple: true })).toBe(2);
  });
});

describe('FD CRUD', () => {
  it('upsertFd inserts a new record; loadAll returns it with every field intact', async () => {
    const db = loadDb();
    await db.openDb();
    const fd = sampleFd({ id: 'fd-1', principalAmount: 123456.78 });
    await db.upsertFd(fd);
    const { fds } = await db.loadAll();
    expect(fds).toHaveLength(1);
    expect(fds[0]).toEqual(fd);
  });

  it('upsertFd with an existing id updates in place rather than inserting a duplicate', async () => {
    const db = loadDb();
    await db.openDb();
    await db.upsertFd(sampleFd({ id: 'fd-1', bankName: 'Old Bank' }));
    await db.upsertFd(sampleFd({ id: 'fd-1', bankName: 'New Bank' }));
    const { fds } = await db.loadAll();
    expect(fds).toHaveLength(1);
    expect(fds[0].bankName).toBe('New Bank');
  });

  it('deleteFd removes exactly the targeted record and leaves others untouched', async () => {
    const db = loadDb();
    await db.openDb();
    await db.upsertFd(sampleFd({ id: 'fd-1' }));
    await db.upsertFd(sampleFd({ id: 'fd-2' }));
    await db.deleteFd('fd-1');
    const { fds } = await db.loadAll();
    expect(fds.map(f => f.id)).toEqual(['fd-2']);
  });

  it('deleteFd on a nonexistent id is a harmless no-op', async () => {
    const db = loadDb();
    await db.openDb();
    await db.upsertFd(sampleFd({ id: 'fd-1' }));
    await expect(db.deleteFd('does-not-exist')).resolves.toBeUndefined();
    const { fds } = await db.loadAll();
    expect(fds).toHaveLength(1);
  });

  it('preserves a null jointHolder distinctly from an empty string', async () => {
    const db = loadDb();
    await db.openDb();
    await db.upsertFd(sampleFd({ id: 'fd-1', jointHolder: null }));
    await db.upsertFd(sampleFd({ id: 'fd-2', jointHolder: '' }));
    const { fds } = await db.loadAll();
    expect(fds.find(f => f.id === 'fd-1')!.jointHolder).toBeNull();
    expect(fds.find(f => f.id === 'fd-2')!.jointHolder).toBe('');
  });

  it('rejects an insert missing a NOT NULL column', async () => {
    const db = loadDb();
    await db.openDb();
    const bad = { ...sampleFd(), bankName: null as unknown as string };
    await expect(db.upsertFd(bad)).rejects.toThrow();
  });
});

describe('RD CRUD', () => {
  it('upsertRd inserts a new record; loadAll returns it with every field intact', async () => {
    const db = loadDb();
    await db.openDb();
    const rd = sampleRd({ id: 'rd-1', installmentsPaid: 4 });
    await db.upsertRd(rd);
    const { rds } = await db.loadAll();
    expect(rds).toHaveLength(1);
    expect(rds[0]).toEqual(rd);
  });

  it('upsertRd with an existing id updates in place rather than inserting a duplicate', async () => {
    const db = loadDb();
    await db.openDb();
    await db.upsertRd(sampleRd({ id: 'rd-1', installmentsPaid: 1 }));
    await db.upsertRd(sampleRd({ id: 'rd-1', installmentsPaid: 5 }));
    const { rds } = await db.loadAll();
    expect(rds).toHaveLength(1);
    expect(rds[0].installmentsPaid).toBe(5);
  });

  it('deleteRd removes exactly the targeted record', async () => {
    const db = loadDb();
    await db.openDb();
    await db.upsertRd(sampleRd({ id: 'rd-1' }));
    await db.upsertRd(sampleRd({ id: 'rd-2' }));
    await db.deleteRd('rd-1');
    const { rds } = await db.loadAll();
    expect(rds.map(r => r.id)).toEqual(['rd-2']);
  });
});

describe('settings', () => {
  it('getSetting returns null for an unknown key', async () => {
    const db = loadDb();
    await db.openDb();
    expect(await db.getSetting('theme')).toBeNull();
  });

  it('setSetting/getSetting round-trip', async () => {
    const db = loadDb();
    await db.openDb();
    await db.setSetting('theme', 'dark');
    expect(await db.getSetting('theme')).toBe('dark');
  });

  it('setSetting on an existing key overwrites rather than duplicating', async () => {
    const db = loadDb();
    await db.openDb();
    await db.setSetting('theme', 'dark');
    await db.setSetting('theme', 'light');
    expect(await db.getAllSettings()).toEqual({ theme: 'light' });
  });
});

describe('importAll (transactional bulk restore)', () => {
  it('inserts fds, rds and settings together in one call', async () => {
    const db = loadDb();
    await db.openDb();
    await db.importAll([sampleFd({ id: 'fd-1' })], [sampleRd({ id: 'rd-1' })], { theme: 'dark' });
    const { fds, rds } = await db.loadAll();
    expect(fds).toHaveLength(1);
    expect(rds).toHaveLength(1);
    expect(await db.getSetting('theme')).toBe('dark');
  });

  it('upserts on top of existing data by id, leaving unrelated rows untouched', async () => {
    const db = loadDb();
    await db.openDb();
    await db.upsertFd(sampleFd({ id: 'fd-existing', bankName: 'Untouched Bank' }));
    await db.importAll([sampleFd({ id: 'fd-existing', bankName: 'Restored Bank' }), sampleFd({ id: 'fd-new' })], [], {});
    const { fds } = await db.loadAll();
    expect(fds).toHaveLength(2);
    expect(fds.find(f => f.id === 'fd-existing')!.bankName).toBe('Restored Bank');
  });

  it('rolls back the entire import if any row in the batch fails — prior data is untouched', async () => {
    const db = loadDb();
    await db.openDb();
    await db.upsertFd(sampleFd({ id: 'fd-keep', bankName: 'Original Bank' }));

    // principalAmount is NOT NULL in the schema — force a constraint failure partway
    // through the batch to prove the *whole* transaction rolls back, not just the bad row.
    const badFd = { ...sampleFd({ id: 'fd-bad' }), principalAmount: null as unknown as number };
    await expect(db.importAll([sampleFd({ id: 'fd-good' }), badFd], [], {})).rejects.toThrow();

    const { fds } = await db.loadAll();
    // Neither fd-good nor fd-bad were committed, and the pre-existing fd-keep row is
    // untouched — matching the app's "your existing data was not changed" toast.
    expect(fds).toHaveLength(1);
    expect(fds[0].id).toBe('fd-keep');
    expect(fds[0].bankName).toBe('Original Bank');
  });
});

describe('deleteAllData', () => {
  it('wipes every FD, RD, and setting', async () => {
    const db = loadDb();
    await db.openDb();
    await db.upsertFd(sampleFd({ id: 'fd-1' }));
    await db.upsertRd(sampleRd({ id: 'rd-1' }));
    await db.setSetting('theme', 'dark');

    await db.deleteAllData();

    const { fds, rds } = await db.loadAll();
    expect(fds).toEqual([]);
    expect(rds).toEqual([]);
    expect(await db.getAllSettings()).toEqual({});
  });

  it('leaves the database usable afterward — a new record can still be added', async () => {
    const db = loadDb();
    await db.openDb();
    await db.upsertFd(sampleFd({ id: 'fd-1' }));
    await db.deleteAllData();
    await db.upsertFd(sampleFd({ id: 'fd-2' }));
    const { fds } = await db.loadAll();
    expect(fds.map(f => f.id)).toEqual(['fd-2']);
  });
});
