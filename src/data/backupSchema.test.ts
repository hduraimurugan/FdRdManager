import { StoredFd, StoredRd } from './db';
import { buildBackupEnvelope, serializeBackup, validateBackupJson } from './backupSchema';

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
});
