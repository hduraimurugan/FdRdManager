import { StoredFd, StoredRd } from './db';
import {
  buildBackupEnvelope,
  serializeBackup,
  validateBackupJson,
  computeImportPreview,
  filterForImport,
  BACKUP_APP_ID,
  BACKUP_SCHEMA_VERSION,
} from './backupSchema';

function sampleFd(overrides: Partial<StoredFd> = {}): StoredFd {
  return {
    id: 'fd-1',
    fdNumber: 'FD001',
    bankName: 'Test Bank',
    branch: '',
    bankAccountNumber: '',
    customerId: '',
    fdHolderName: '',
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
    branch: '',
    bankAccountNumber: '',
    customerId: '',
    rdHolderName: '',
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

describe('backupSchema', () => {
  it('round-trips fds/rds/settings through build -> serialize -> validate', () => {
    const fds = [sampleFd()];
    const rds = [sampleRd()];
    const settings = { theme: 'dark' };
    const envelope = buildBackupEnvelope(fds, rds, settings);
    const json = serializeBackup(envelope);

    const result = validateBackupJson(json);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.fds).toEqual(fds);
    expect(result.rds).toEqual(rds);
    expect(result.settings).toEqual(settings);
    expect(result.skippedCount).toBe(0);
  });

  it('rejects malformed JSON', () => {
    const result = validateBackupJson('{not json');
    expect(result).toEqual({ ok: false, reason: 'parse' });
  });

  it('rejects a non-envelope object', () => {
    const result = validateBackupJson(JSON.stringify({ hello: 'world' }));
    expect(result).toEqual({ ok: false, reason: 'shape' });
  });

  it('defaults missing optional fields on a row, like rowToFd does', () => {
    const raw = { id: 'fd-2', fdNumber: 'FD002', bankName: 'Bank', principalAmount: 50000, startDate: '2026-02-01' };
    const result = validateBackupJson(JSON.stringify({ fixedDeposits: [raw], recurringDeposits: [] }));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.fds).toHaveLength(1);
    expect(result.fds[0]).toMatchObject({ id: 'fd-2', fdNumber: 'FD002', bankName: 'Bank', status: 'Active', tdsPercent: 10 });
  });

  it('drops rows missing required identity fields while keeping valid rows', () => {
    const valid = sampleFd({ id: 'fd-valid' });
    const invalid = { id: 'fd-bad' }; // missing fdNumber/bankName/principalAmount/startDate
    const result = validateBackupJson(JSON.stringify({ fixedDeposits: [valid, invalid], recurringDeposits: [] }));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.fds).toHaveLength(1);
    expect(result.fds[0].id).toBe('fd-valid');
    expect(result.skippedCount).toBe(1);
  });

  it('rejects when every row is invalid despite non-empty input arrays', () => {
    const result = validateBackupJson(JSON.stringify({ fixedDeposits: [{ id: 'x' }], recurringDeposits: [] }));
    expect(result).toEqual({ ok: false, reason: 'empty' });
  });

  it('accepts a legitimately empty backup', () => {
    const result = validateBackupJson(JSON.stringify({ fixedDeposits: [], recurringDeposits: [] }));
    expect(result).toEqual({ ok: true, fds: [], rds: [], settings: {}, skippedCount: 0 });
  });

  it('rejects a file stamped with a different app id', () => {
    const result = validateBackupJson(JSON.stringify({ app: 'SomeOtherApp', fixedDeposits: [], recurringDeposits: [] }));
    expect(result).toEqual({ ok: false, reason: 'app' });
  });

  it('accepts a file with no app id stamped at all (lenient on absence, not on a wrong value)', () => {
    const result = validateBackupJson(JSON.stringify({ fixedDeposits: [], recurringDeposits: [] }));
    expect(result.ok).toBe(true);
  });

  it('rejects a backup from a newer schema version than this build understands', () => {
    const result = validateBackupJson(
      JSON.stringify({ app: BACKUP_APP_ID, schemaVersion: BACKUP_SCHEMA_VERSION + 1, fixedDeposits: [], recurringDeposits: [] }),
    );
    expect(result).toEqual({ ok: false, reason: 'version' });
  });

  it('accepts a backup at or below the current schema version', () => {
    const result = validateBackupJson(
      JSON.stringify({ app: BACKUP_APP_ID, schemaVersion: BACKUP_SCHEMA_VERSION, fixedDeposits: [], recurringDeposits: [] }),
    );
    expect(result.ok).toBe(true);
  });
});

describe('computeImportPreview', () => {
  it('classifies every incoming record as new when nothing overlaps existing ids', () => {
    const preview = computeImportPreview([sampleFd({ id: 'fd-new' })], [sampleRd({ id: 'rd-new' })], [sampleFd({ id: 'fd-existing' })], [], 0);
    expect(preview).toEqual({ newCount: 2, overwriteCount: 0, skippedCount: 0, total: 2 });
  });

  it('classifies a record as an overwrite when its id already exists locally', () => {
    const preview = computeImportPreview([sampleFd({ id: 'fd-1' })], [], [sampleFd({ id: 'fd-1' })], [], 0);
    expect(preview).toEqual({ newCount: 0, overwriteCount: 1, skippedCount: 0, total: 1 });
  });

  it('carries the skippedCount through unchanged (rows already dropped by validateBackupJson)', () => {
    const preview = computeImportPreview([], [], [], [], 3);
    expect(preview.skippedCount).toBe(3);
  });
});

describe('filterForImport', () => {
  it('overwrite mode passes every record through unchanged', () => {
    const fds = [sampleFd({ id: 'fd-1' }), sampleFd({ id: 'fd-2' })];
    const result = filterForImport(fds, [], [sampleFd({ id: 'fd-1' })], [], 'overwrite');
    expect(result.fds).toEqual(fds);
  });

  it('skip-existing mode drops any record whose id already exists locally', () => {
    const incoming = [sampleFd({ id: 'fd-1', bankName: 'Incoming Bank' }), sampleFd({ id: 'fd-2' })];
    const existing = [sampleFd({ id: 'fd-1', bankName: 'Original Bank' })];
    const result = filterForImport(incoming, [], existing, [], 'skip-existing');
    expect(result.fds.map(f => f.id)).toEqual(['fd-2']);
  });

  it('skip-existing mode keeps every record when none of the ids overlap', () => {
    const incoming = [sampleFd({ id: 'fd-new-1' }), sampleFd({ id: 'fd-new-2' })];
    const result = filterForImport(incoming, [], [sampleFd({ id: 'fd-different' })], [], 'skip-existing');
    expect(result.fds).toHaveLength(2);
  });

  it('filters fds and rds independently', () => {
    const result = filterForImport(
      [sampleFd({ id: 'fd-1' })],
      [sampleRd({ id: 'rd-1' })],
      [sampleFd({ id: 'fd-1' })],
      [],
      'skip-existing',
    );
    expect(result.fds).toHaveLength(0);
    expect(result.rds).toHaveLength(1); // rd-1 doesn't collide with any existing RD
  });
});
