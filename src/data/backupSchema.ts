// Pure backup serialization/validation logic — no RN or native imports, so this
// module can be unit tested with plain Jest and needs no manual mocks (unlike
// db.ts, which talks to op-sqlite). Native file/share/pick orchestration lives
// in backupIO.ts instead.

import { StoredFd, StoredRd } from './db';

export const BACKUP_APP_ID = 'FdRdManager';
export const BACKUP_SCHEMA_VERSION = 1;

export interface BackupEnvelope {
  app: typeof BACKUP_APP_ID;
  schemaVersion: number;
  exportedAt: string;
  fixedDeposits: StoredFd[];
  recurringDeposits: StoredRd[];
  settings: Record<string, string>;
}

export function backupFilename(date: Date = new Date()): string {
  return `fdrd-backup-${date.toISOString().slice(0, 10)}.json`;
}

export function buildBackupEnvelope(fds: StoredFd[], rds: StoredRd[], settings: Record<string, string>): BackupEnvelope {
  return {
    app: BACKUP_APP_ID,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    fixedDeposits: fds,
    recurringDeposits: rds,
    settings,
  };
}

export function serializeBackup(envelope: BackupEnvelope): string {
  return JSON.stringify(envelope, null, 2);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasUsableValue(value: unknown): boolean {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

export function coerceStoredFd(raw: unknown): StoredFd | null {
  if (!isRecord(raw)) return null;
  if (!hasUsableValue(raw.id) || !hasUsableValue(raw.fdNumber) || !hasUsableValue(raw.bankName)) return null;
  if (!hasUsableValue(raw.principalAmount) || !hasUsableValue(raw.startDate)) return null;

  return {
    id: String(raw.id),
    fdNumber: String(raw.fdNumber),
    bankName: String(raw.bankName),
    branch: String(raw.branch ?? ''),
    bankAccountNumber: String(raw.bankAccountNumber ?? ''),
    customerId: String(raw.customerId ?? ''),
    fdHolderName: String(raw.fdHolderName ?? ''),
    jointHolder: raw.jointHolder == null ? null : String(raw.jointHolder),
    fdType: String(raw.fdType ?? 'Regular'),
    mode: String(raw.mode ?? 'Online'),
    status: String(raw.status ?? 'Active'),
    principalAmount: Number(raw.principalAmount) || 0,
    depositDate: String(raw.depositDate ?? raw.startDate),
    startDate: String(raw.startDate),
    tenureYears: Number(raw.tenureYears) || 0,
    tenureMonths: Number(raw.tenureMonths) || 0,
    tenureDays: Number(raw.tenureDays) || 0,
    interestRate: Number(raw.interestRate) || 0,
    interestType: String(raw.interestType ?? 'Compound'),
    compoundingFrequency: String(raw.compoundingFrequency ?? 'Quarterly'),
    interestPayoutMode: String(raw.interestPayoutMode ?? 'At Maturity'),
    interestCreditMethod: String(raw.interestCreditMethod ?? 'Reinvested into FD'),
    autoRenewal: String(raw.autoRenewal ?? 'No'),
    renewalOption: String(raw.renewalOption ?? 'Do Not Renew'),
    remarks: String(raw.remarks ?? ''),
    nominee: String(raw.nominee ?? ''),
    nomineeRelationship: String(raw.nomineeRelationship ?? ''),
    tdsApplicable: String(raw.tdsApplicable ?? 'Yes'),
    tdsPercent: Number(raw.tdsPercent ?? 10),
    panSubmitted: String(raw.panSubmitted ?? 'Yes'),
    form15G: String(raw.form15G ?? 'No'),
    renewalCount: Number(raw.renewalCount) || 0,
  };
}

export function coerceStoredRd(raw: unknown): StoredRd | null {
  if (!isRecord(raw)) return null;
  if (!hasUsableValue(raw.id) || !hasUsableValue(raw.rdNumber) || !hasUsableValue(raw.bankName)) return null;
  if (!hasUsableValue(raw.monthlyInstallment) || !hasUsableValue(raw.startDate)) return null;

  return {
    id: String(raw.id),
    rdNumber: String(raw.rdNumber),
    bankName: String(raw.bankName),
    branch: String(raw.branch ?? ''),
    bankAccountNumber: String(raw.bankAccountNumber ?? ''),
    customerId: String(raw.customerId ?? ''),
    rdHolderName: String(raw.rdHolderName ?? ''),
    jointHolder: raw.jointHolder == null ? null : String(raw.jointHolder),
    rdType: String(raw.rdType ?? 'Regular'),
    mode: String(raw.mode ?? 'Online'),
    status: String(raw.status ?? 'Active'),
    monthlyInstallment: Number(raw.monthlyInstallment) || 0,
    startDate: String(raw.startDate),
    tenureYears: Number(raw.tenureYears) || 0,
    tenureMonths: Number(raw.tenureMonths) || 0,
    interestRate: Number(raw.interestRate) || 0,
    interestType: String(raw.interestType ?? 'Compound'),
    compoundingFrequency: String(raw.compoundingFrequency ?? 'Quarterly'),
    installmentsPaid: Number(raw.installmentsPaid) || 0,
    remarks: String(raw.remarks ?? ''),
    renewalCount: Number(raw.renewalCount) || 0,
  };
}

export type ValidateBackupResult =
  | { ok: true; fds: StoredFd[]; rds: StoredRd[]; settings: Record<string, string>; skippedCount: number }
  | { ok: false; reason: 'parse' | 'shape' | 'empty' };

export function validateBackupJson(raw: string): ValidateBackupResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, reason: 'parse' };
  }

  if (!isRecord(parsed) || !Array.isArray(parsed.fixedDeposits) || !Array.isArray(parsed.recurringDeposits)) {
    return { ok: false, reason: 'shape' };
  }

  const rawFds = parsed.fixedDeposits as unknown[];
  const rawRds = parsed.recurringDeposits as unknown[];
  const fds = rawFds.map(coerceStoredFd).filter((fd): fd is StoredFd => fd !== null);
  const rds = rawRds.map(coerceStoredRd).filter((rd): rd is StoredRd => rd !== null);
  const skippedCount = rawFds.length - fds.length + (rawRds.length - rds.length);

  if (fds.length === 0 && rds.length === 0 && (rawFds.length > 0 || rawRds.length > 0)) {
    return { ok: false, reason: 'empty' };
  }

  const settingsRaw = isRecord(parsed.settings) ? parsed.settings : {};
  const settings: Record<string, string> = {};
  for (const [key, value] of Object.entries(settingsRaw)) {
    if (typeof value === 'string') settings[key] = value;
  }

  return { ok: true, fds, rds, settings, skippedCount };
}
