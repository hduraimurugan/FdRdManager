// SQLite persistence layer (op-sqlite). This is the ONLY module that talks to the
// database — everything else in the app goes through the functions exported here, so
// swapping the storage engine later only touches this file.
//
// Only user-entered / identity fields are persisted as columns. Time-dependent values
// (maturity date/amount, current value, interest earned, days remaining, effective
// status, next payout/installment date, ...) are intentionally NOT stored — they're
// computed fresh from these rows by `src/data/derive.ts` every time the app reads them,
// so stored data can never go stale.

import { open, type DB } from '@op-engineering/op-sqlite';

export interface StoredFd {
  id: string;
  fdNumber: string;
  bankName: string;
  branch: string;
  bankAccountNumber: string;
  customerId: string;
  fdHolderName: string;
  jointHolder: string | null;
  fdType: string;
  mode: string;
  status: string;
  principalAmount: number;
  depositDate: string;
  startDate: string;
  tenureYears: number;
  tenureMonths: number;
  tenureDays: number;
  interestRate: number;
  interestType: string;
  compoundingFrequency: string;
  interestPayoutMode: string;
  interestCreditMethod: string;
  autoRenewal: string;
  renewalOption: string;
  remarks: string;
  nominee: string;
  nomineeRelationship: string;
  tdsApplicable: string;
  tdsPercent: number;
  panSubmitted: string;
  form15G: string;
  renewalCount: number;
}

export interface StoredRd {
  id: string;
  rdNumber: string;
  bankName: string;
  branch: string;
  bankAccountNumber: string;
  customerId: string;
  rdHolderName: string;
  jointHolder: string | null;
  rdType: string;
  mode: string;
  status: string;
  monthlyInstallment: number;
  startDate: string;
  tenureYears: number;
  tenureMonths: number;
  interestRate: number;
  interestType: string;
  compoundingFrequency: string;
  installmentsPaid: number;
  remarks: string;
  renewalCount: number;
}

const FD_COLUMNS: (keyof StoredFd)[] = [
  'id', 'fdNumber', 'bankName', 'branch', 'bankAccountNumber', 'customerId', 'fdHolderName', 'jointHolder',
  'fdType', 'mode', 'status', 'principalAmount', 'depositDate', 'startDate', 'tenureYears', 'tenureMonths',
  'tenureDays', 'interestRate', 'interestType', 'compoundingFrequency', 'interestPayoutMode', 'interestCreditMethod',
  'autoRenewal', 'renewalOption', 'remarks', 'nominee', 'nomineeRelationship', 'tdsApplicable', 'tdsPercent',
  'panSubmitted', 'form15G', 'renewalCount',
];

const RD_COLUMNS: (keyof StoredRd)[] = [
  'id', 'rdNumber', 'bankName', 'branch', 'bankAccountNumber', 'customerId', 'rdHolderName', 'jointHolder',
  'rdType', 'mode', 'status', 'monthlyInstallment', 'startDate', 'tenureYears', 'tenureMonths', 'interestRate',
  'interestType', 'compoundingFrequency', 'installmentsPaid', 'remarks', 'renewalCount',
];

const DB_NAME = 'fdrdmanager.sqlite';
const SCHEMA_VERSION = 1;

let dbInstance: DB | null = null;
let migratePromise: Promise<void> | null = null;

function getDb(): DB {
  if (!dbInstance) {
    dbInstance = open({ name: DB_NAME });
  }
  return dbInstance;
}

async function migrate(): Promise<void> {
  const database = getDb();
  const versionResult = await database.execute('PRAGMA user_version');
  const currentVersion = Number(versionResult.rows[0]?.user_version ?? 0);

  if (currentVersion < 1) {
    await database.execute(`
      CREATE TABLE IF NOT EXISTS fixed_deposits (
        id TEXT PRIMARY KEY NOT NULL,
        fdNumber TEXT NOT NULL,
        bankName TEXT NOT NULL,
        branch TEXT NOT NULL DEFAULT '',
        bankAccountNumber TEXT NOT NULL DEFAULT '',
        customerId TEXT NOT NULL DEFAULT '',
        fdHolderName TEXT NOT NULL DEFAULT '',
        jointHolder TEXT,
        fdType TEXT NOT NULL,
        mode TEXT NOT NULL,
        status TEXT NOT NULL,
        principalAmount REAL NOT NULL,
        depositDate TEXT NOT NULL,
        startDate TEXT NOT NULL,
        tenureYears INTEGER NOT NULL DEFAULT 0,
        tenureMonths INTEGER NOT NULL DEFAULT 0,
        tenureDays INTEGER NOT NULL DEFAULT 0,
        interestRate REAL NOT NULL,
        interestType TEXT NOT NULL,
        compoundingFrequency TEXT NOT NULL,
        interestPayoutMode TEXT NOT NULL,
        interestCreditMethod TEXT NOT NULL,
        autoRenewal TEXT NOT NULL,
        renewalOption TEXT NOT NULL,
        remarks TEXT NOT NULL DEFAULT '',
        nominee TEXT NOT NULL DEFAULT '',
        nomineeRelationship TEXT NOT NULL DEFAULT '',
        tdsApplicable TEXT NOT NULL DEFAULT 'Yes',
        tdsPercent REAL NOT NULL DEFAULT 10,
        panSubmitted TEXT NOT NULL DEFAULT 'Yes',
        form15G TEXT NOT NULL DEFAULT 'No',
        renewalCount INTEGER NOT NULL DEFAULT 0
      );
    `);
    await database.execute(`
      CREATE TABLE IF NOT EXISTS recurring_deposits (
        id TEXT PRIMARY KEY NOT NULL,
        rdNumber TEXT NOT NULL,
        bankName TEXT NOT NULL,
        branch TEXT NOT NULL DEFAULT '',
        bankAccountNumber TEXT NOT NULL DEFAULT '',
        customerId TEXT NOT NULL DEFAULT '',
        rdHolderName TEXT NOT NULL DEFAULT '',
        jointHolder TEXT,
        rdType TEXT NOT NULL,
        mode TEXT NOT NULL,
        status TEXT NOT NULL,
        monthlyInstallment REAL NOT NULL,
        startDate TEXT NOT NULL,
        tenureYears INTEGER NOT NULL DEFAULT 0,
        tenureMonths INTEGER NOT NULL DEFAULT 0,
        interestRate REAL NOT NULL,
        interestType TEXT NOT NULL,
        compoundingFrequency TEXT NOT NULL,
        installmentsPaid INTEGER NOT NULL DEFAULT 0,
        remarks TEXT NOT NULL DEFAULT '',
        renewalCount INTEGER NOT NULL DEFAULT 0
      );
    `);
    await database.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT
      );
    `);
    await database.execute(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  }

  // Future migrations: `if (currentVersion < 2) { ALTER TABLE ...; PRAGMA user_version = 2 }`
}

/** Opens the database and runs migrations. Safe to call multiple times — only runs once. */
export function openDb(): Promise<void> {
  if (!migratePromise) migratePromise = migrate();
  return migratePromise;
}

function rowToFd(row: Record<string, unknown>): StoredFd {
  return {
    id: String(row.id),
    fdNumber: String(row.fdNumber),
    bankName: String(row.bankName),
    branch: String(row.branch ?? ''),
    bankAccountNumber: String(row.bankAccountNumber ?? ''),
    customerId: String(row.customerId ?? ''),
    fdHolderName: String(row.fdHolderName ?? ''),
    jointHolder: row.jointHolder == null ? null : String(row.jointHolder),
    fdType: String(row.fdType),
    mode: String(row.mode),
    status: String(row.status),
    principalAmount: Number(row.principalAmount),
    depositDate: String(row.depositDate),
    startDate: String(row.startDate),
    tenureYears: Number(row.tenureYears ?? 0),
    tenureMonths: Number(row.tenureMonths ?? 0),
    tenureDays: Number(row.tenureDays ?? 0),
    interestRate: Number(row.interestRate),
    interestType: String(row.interestType),
    compoundingFrequency: String(row.compoundingFrequency),
    interestPayoutMode: String(row.interestPayoutMode),
    interestCreditMethod: String(row.interestCreditMethod),
    autoRenewal: String(row.autoRenewal),
    renewalOption: String(row.renewalOption),
    remarks: String(row.remarks ?? ''),
    nominee: String(row.nominee ?? ''),
    nomineeRelationship: String(row.nomineeRelationship ?? ''),
    tdsApplicable: String(row.tdsApplicable ?? 'Yes'),
    tdsPercent: Number(row.tdsPercent ?? 10),
    panSubmitted: String(row.panSubmitted ?? 'Yes'),
    form15G: String(row.form15G ?? 'No'),
    renewalCount: Number(row.renewalCount ?? 0),
  };
}

function rowToRd(row: Record<string, unknown>): StoredRd {
  return {
    id: String(row.id),
    rdNumber: String(row.rdNumber),
    bankName: String(row.bankName),
    branch: String(row.branch ?? ''),
    bankAccountNumber: String(row.bankAccountNumber ?? ''),
    customerId: String(row.customerId ?? ''),
    rdHolderName: String(row.rdHolderName ?? ''),
    jointHolder: row.jointHolder == null ? null : String(row.jointHolder),
    rdType: String(row.rdType),
    mode: String(row.mode),
    status: String(row.status),
    monthlyInstallment: Number(row.monthlyInstallment),
    startDate: String(row.startDate),
    tenureYears: Number(row.tenureYears ?? 0),
    tenureMonths: Number(row.tenureMonths ?? 0),
    interestRate: Number(row.interestRate),
    interestType: String(row.interestType),
    compoundingFrequency: String(row.compoundingFrequency),
    installmentsPaid: Number(row.installmentsPaid ?? 0),
    remarks: String(row.remarks ?? ''),
    renewalCount: Number(row.renewalCount ?? 0),
  };
}

export async function loadAll(): Promise<{ fds: StoredFd[]; rds: StoredRd[] }> {
  const database = getDb();
  const [fdResult, rdResult] = await Promise.all([
    database.execute('SELECT * FROM fixed_deposits ORDER BY startDate DESC'),
    database.execute('SELECT * FROM recurring_deposits ORDER BY startDate DESC'),
  ]);
  return {
    fds: fdResult.rows.map(rowToFd),
    rds: rdResult.rows.map(rowToRd),
  };
}

function fdUpsertQuery(fd: StoredFd): [string, unknown[]] {
  const placeholders = FD_COLUMNS.map(() => '?').join(', ');
  const updateSet = FD_COLUMNS.filter(c => c !== 'id').map(c => `${c} = excluded.${c}`).join(', ');
  return [
    `INSERT INTO fixed_deposits (${FD_COLUMNS.join(', ')}) VALUES (${placeholders})
     ON CONFLICT(id) DO UPDATE SET ${updateSet}`,
    FD_COLUMNS.map(c => fd[c] ?? null),
  ];
}

function rdUpsertQuery(rd: StoredRd): [string, unknown[]] {
  const placeholders = RD_COLUMNS.map(() => '?').join(', ');
  const updateSet = RD_COLUMNS.filter(c => c !== 'id').map(c => `${c} = excluded.${c}`).join(', ');
  return [
    `INSERT INTO recurring_deposits (${RD_COLUMNS.join(', ')}) VALUES (${placeholders})
     ON CONFLICT(id) DO UPDATE SET ${updateSet}`,
    RD_COLUMNS.map(c => rd[c] ?? null),
  ];
}

export async function upsertFd(fd: StoredFd): Promise<void> {
  const [sql, values] = fdUpsertQuery(fd);
  await getDb().execute(sql, values as any[]);
}

export async function upsertRd(rd: StoredRd): Promise<void> {
  const [sql, values] = rdUpsertQuery(rd);
  await getDb().execute(sql, values as any[]);
}

export async function deleteFd(id: string): Promise<void> {
  await getDb().execute('DELETE FROM fixed_deposits WHERE id = ?', [id]);
}

export async function deleteRd(id: string): Promise<void> {
  await getDb().execute('DELETE FROM recurring_deposits WHERE id = ?', [id]);
}

export async function getSetting(key: string): Promise<string | null> {
  const result = await getDb().execute('SELECT value FROM settings WHERE key = ?', [key]);
  const value = result.rows[0]?.value;
  return value == null ? null : String(value);
}

export async function setSetting(key: string, value: string): Promise<void> {
  await getDb().execute(
    `INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value],
  );
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const result = await getDb().execute('SELECT key, value FROM settings');
  const out: Record<string, string> = {};
  for (const row of result.rows) out[String(row.key)] = String(row.value ?? '');
  return out;
}

/** Bulk upsert used by backup restore. Runs inside a single transaction so a
 * failure partway through rolls back instead of leaving a half-merged DB. */
export async function importAll(fds: StoredFd[], rds: StoredRd[], settings: Record<string, string>): Promise<void> {
  const database = getDb();
  await database.transaction(async tx => {
    for (const fd of fds) {
      const [sql, values] = fdUpsertQuery(fd);
      await tx.execute(sql, values as any[]);
    }
    for (const rd of rds) {
      const [sql, values] = rdUpsertQuery(rd);
      await tx.execute(sql, values as any[]);
    }
    for (const [key, value] of Object.entries(settings)) {
      await tx.execute(
        `INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        [key, value],
      );
    }
  });
}
