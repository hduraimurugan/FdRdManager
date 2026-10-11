import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { AppState as RNAppState, AppStateStatus } from 'react-native';
import { FixedDeposit, RecurringDeposit, PortfolioEvent, PortfolioNotification } from '../data/portfolioData';
import {
  StoredFd,
  StoredRd,
  openDb,
  loadAll,
  upsertFd,
  upsertRd,
  deleteFd,
  deleteRd,
  getSetting,
  setSetting,
  getAllSettings,
  importAll,
  deleteAllData,
} from '../data/db';
import { today, deriveFd, deriveRd, deriveEvents, deriveNotifications } from '../data/derive';
import { todayIso, parseIsoDate, addTenure, toIsoDate } from '../data/finance';
import { navigate, goBack } from '../navigation/navigationRef';
import {
  backupFilename,
  buildBackupEnvelope,
  serializeBackup,
  validateBackupJson,
  computeImportPreview,
  filterForImport,
  ImportMode,
} from '../data/backupSchema';
import { writeBackupFile, shareBackupFile, deleteBackupFile, pickBackupFileText } from '../data/backupIO';
import { encryptBackupJson, decryptBackupJson, isEncryptedPayload } from '../data/backupCrypto';
import { planPortfolioReminders, DEFAULT_LEAD_DAYS } from '../data/reminders';
import {
  syncScheduledReminders,
  cancelAllReminders,
  hasNotificationPermission,
  requestNotificationPermission,
  displayCompletionNotification,
} from '../data/notifeeClient';
import { useLockActions } from './LockContext';

export type ActiveTab = 'home' | 'portfolio' | 'payouts' | 'calculators' | 'more';
export type SortBy = 'maturity' | 'amount' | 'rate';

export interface ConfirmDialogState {
  action: 'close' | 'premature' | 'renew' | 'delete' | 'import';
  kind: 'FD' | 'RD' | 'ALL';
  id: string;
  title: string;
  message: string;
  confirmLabel: string;
  /** When set, the dialog renders a second action button (see ConfirmDialog.tsx) wired
   * to runConfirmSecondary — used by the import flow to offer "skip existing" as an
   * alternative to the primary "overwrite" action. */
  secondaryLabel?: string;
}

export interface PendingImport {
  fds: StoredFd[];
  rds: StoredRd[];
  settings: Record<string, string>;
}

export interface FdCalcState {
  principal: number | string;
  ratePct: number | string;
  startDate: string;
  years: number | string;
  months: number | string;
  days: number | string;
  compounding: string;
  tdsPercent: number | string;
}

export interface RdCalcState {
  monthlyInstallment: number | string;
  ratePct: number | string;
  startDate: string;
  years: number | string;
  months: number | string;
}

// Loosely typed like the original prototype's editDraft — holds a mix of FD/RD field
// values while a form is open. Only StoredFd/StoredRd columns are ever written back out.
export type Draft = Record<string, any>;

// ---------------------------------------------------------------------------
// Raw (persisted) reducer state
// ---------------------------------------------------------------------------
interface RawState {
  fdRaw: StoredFd[];
  rdRaw: StoredRd[];
  hydrated: boolean;
  loadError: boolean;
  activeTab: ActiveTab;
  portfolioTab: 'FD' | 'RD';
  search: string;
  filterBank: string;
  filterType: string;
  filterStatus: string;
  sortBy: SortBy;
  filterSheetOpen: boolean;
  confirmDialog: ConfirmDialogState | null;
  toast: string | null;
  theme: 'light' | 'dark';
  userName: string;
  editDraft: Draft | null;
  fdPayoutOpen: boolean;
  fdRenewalOpen: boolean;
  fdStatementsOpen: boolean;
  rdDetailsOpen: boolean;
  fdCalc: FdCalcState;
  rdCalc: RdCalcState;
  exporting: boolean;
  importing: boolean;
  pendingImport: PendingImport | null;
  /** Raw text of a picked backup file that turned out to be passphrase-encrypted —
   * held here (not re-read from disk) so submitting a passphrase doesn't have to
   * re-open the file picker. Non-null while BackupRestoreScreen's passphrase sheet
   * should be showing. */
  pendingEncryptedImportText: string | null;
  passphraseError: string | null;
  remindersEnabled: boolean;
  reminderLeadDays: number;
  notificationPermissionGranted: boolean;
}

// ---------------------------------------------------------------------------
// Derived state — what screens/selectors actually consume. `fdList`/`rdList`/
// `events`/`notifications` are recomputed from fdRaw/rdRaw + today() whenever
// they change (see useAppState below), never persisted.
// ---------------------------------------------------------------------------
export interface AppState extends Omit<RawState, 'fdRaw' | 'rdRaw'> {
  fdList: FixedDeposit[];
  rdList: RecurringDeposit[];
  events: PortfolioEvent[];
  notifications: PortfolioNotification[];
}

// This used to be `today().toISOString().slice(0, 10)`, which converts local midnight
// through UTC and returns *yesterday's* date for anyone in a positive-UTC-offset
// timezone (all of India included) — see finance.ts's todayIso for the fix. That value
// is written to the database as the default startDate/depositDate for new records and
// as the new startDate on every renewal, so the bug wasn't just cosmetic.

/** Shared by runConfirm (overwrite mode) and runConfirmSecondary (skip-existing mode) —
 * filters the pending backup down to what the chosen mode should actually write, then
 * applies it. Returns what was actually written so the caller's toast reflects reality
 * rather than the backup's raw counts (which may include records the mode skipped). */
async function applyPendingImport(
  pending: PendingImport,
  mode: ImportMode,
  existingFds: StoredFd[],
  existingRds: StoredRd[],
): Promise<{ fdCount: number; rdCount: number }> {
  const { fds, rds } = filterForImport(pending.fds, pending.rds, existingFds, existingRds, mode);
  await importAll(fds, rds, pending.settings);
  return { fdCount: fds.length, rdCount: rds.length };
}

const IMPORT_ERROR_MESSAGES: Record<Exclude<ReturnType<typeof validateBackupJson>, { ok: true }>['reason'], string> = {
  parse: "That file isn't a valid FD/RD backup",
  shape: "That file isn't a valid FD/RD backup",
  empty: 'No valid FD/RD entries found in that file',
  app: "That file wasn't exported from FD/RD Manager",
  version: 'That backup was made by a newer version of the app — update the app to restore it',
};

/** PBKDF2 (via @noble/hashes, used by encryptBackupJson/decryptBackupJson) only yields
 * to the microtask queue internally, never to a real timer — so it never returns control
 * to React/the native bridge until the whole ~300k-round derivation finishes. Awaiting a
 * setTimeout forces one real macrotask boundary, giving React a chance to actually paint
 * a pending state update (e.g. an "importing"/"exporting" flag just dispatched) before
 * that stall begins — without this, the UI can go dark with zero visible change for the
 * whole duration, which looks indistinguishable from a hang. Call right after dispatching
 * the "in progress" flag and before starting the crypto work. */
function yieldToUI(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/** Outcome of processImportText, for callers that need to react to it (e.g. firing a
 * background-completion notification) without racing React's own render cycle to read
 * the dispatches back out of state — dispatch()/useReducer don't update stateRef.current
 * synchronously, so re-reading state immediately after awaiting this function isn't
 * reliable. Returning the outcome directly sidesteps that. */
type ImportTextOutcome = 'needs-passphrase' | 'wrong-passphrase' | 'invalid' | 'ready-to-confirm';

/** Shared by importBackup (first attempt) and submitImportPassphrase (retry with a
 * passphrase) — detects an encrypted payload and, once past that, runs the same
 * validate → preview → confirm-dialog flow either way. Dispatches
 * SET_PENDING_ENCRYPTED_IMPORT_TEXT to open the passphrase sheet when a passphrase is
 * needed but wasn't supplied, rather than returning an error — the file was read fine,
 * it just needs one more step before it can be validated. */
async function processImportText(
  text: string,
  passphrase: string | undefined,
  dispatch: React.Dispatch<Action>,
  showToast: (message: string) => void,
  existingFds: StoredFd[],
  existingRds: StoredRd[],
): Promise<ImportTextOutcome> {
  let jsonText = text;
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Not JSON at all — validateBackupJson below will report this as a parse failure.
  }

  if (isEncryptedPayload(parsed)) {
    if (!passphrase) {
      dispatch({ type: 'SET_PENDING_ENCRYPTED_IMPORT_TEXT', text });
      return 'needs-passphrase';
    }
    const decrypted = await decryptBackupJson(parsed, passphrase);
    if (decrypted == null) {
      dispatch({ type: 'SET_PASSPHRASE_ERROR', error: 'Incorrect passphrase' });
      return 'wrong-passphrase';
    }
    jsonText = decrypted;
    dispatch({ type: 'SET_PENDING_ENCRYPTED_IMPORT_TEXT', text: null });
    // Wait for the passphrase sheet's close animation (BottomSheet, 200ms) to finish
    // before the confirm dialog below opens its own Modal — RN doesn't reliably stack
    // two Modals on Android, so opening one while the other is still animating out
    // leaves the new one hidden behind it, which looks like the import silently hung
    // right after a correct passphrase was entered.
    await new Promise<void>(resolve => setTimeout(resolve, 250));
  } else {
    dispatch({ type: 'SET_PENDING_ENCRYPTED_IMPORT_TEXT', text: null });
  }

  const result = validateBackupJson(jsonText);
  if (!result.ok) {
    showToast(IMPORT_ERROR_MESSAGES[result.reason]);
    return 'invalid';
  }

  dispatch({ type: 'SET_PENDING_IMPORT', data: { fds: result.fds, rds: result.rds, settings: result.settings } });

  const preview = computeImportPreview(result.fds, result.rds, existingFds, existingRds, result.skippedCount);
  const parts = [`${preview.newCount} new`];
  if (preview.overwriteCount > 0) parts.push(`${preview.overwriteCount} will overwrite an existing entry`);
  if (preview.skippedCount > 0) parts.push(`${preview.skippedCount} skipped (invalid)`);

  dispatch({
    type: 'ASK_CONFIRM',
    dialog: {
      action: 'import',
      kind: 'ALL',
      id: '',
      title: 'Restore backup?',
      message: `This backup has ${parts.join(', ')}. Nothing is ever deleted by restoring.`,
      confirmLabel: preview.overwriteCount > 0 ? 'Overwrite & restore' : 'Restore',
      secondaryLabel: preview.overwriteCount > 0 ? 'Skip existing' : undefined,
    },
  });
  return 'ready-to-confirm';
}

function blankFdDraft(fdRaw: StoredFd[], userName: string): Draft {
  return {
    fdNumber: 'FD' + String(fdRaw.length + 1).padStart(3, '0'), bankName: '', branch: '', bankAccountNumber: '', customerId: '',
    fdHolderName: userName, jointHolder: '', fdType: 'Regular', mode: 'Online',
    principalAmount: '', depositDate: todayIso(), startDate: todayIso(),
    tenureYears: 1, tenureMonths: 0, tenureDays: 0, interestRate: '', interestType: 'Compound', compoundingFrequency: 'Quarterly',
    interestPayoutMode: 'At Maturity', interestCreditMethod: 'Reinvested into FD',
    autoRenewal: 'No', renewalOption: 'Do Not Renew', remarks: '', nominee: '', nomineeRelationship: '',
    tdsApplicable: 'Yes', tdsPercent: 10, panSubmitted: 'Yes', form15G: 'No', renewalCount: 0, status: 'Active',
  };
}

function blankRdDraft(rdRaw: StoredRd[], userName: string): Draft {
  return {
    rdNumber: 'RD' + String(rdRaw.length + 1).padStart(3, '0'), bankName: '', branch: '', bankAccountNumber: '', customerId: '',
    rdHolderName: userName, jointHolder: '', rdType: 'Regular', mode: 'Online',
    monthlyInstallment: '', startDate: todayIso(), tenureYears: 1, tenureMonths: 0,
    interestRate: '', interestType: 'Compound', compoundingFrequency: 'Quarterly',
    installmentsPaid: 0, remarks: '', renewalCount: 0, status: 'Active',
  };
}

const initialFdCalc: FdCalcState = { principal: 500000, ratePct: 7.1, startDate: todayIso(), years: 3, months: 0, days: 0, compounding: 'Quarterly', tdsPercent: 10 };
const initialRdCalc: RdCalcState = { monthlyInstallment: 10000, ratePct: 6.75, startDate: todayIso(), years: 2, months: 0 };

const initialState: RawState = {
  fdRaw: [],
  rdRaw: [],
  hydrated: false,
  loadError: false,
  activeTab: 'home',
  portfolioTab: 'FD',
  search: '',
  filterBank: 'All',
  filterType: 'All',
  filterStatus: 'All',
  sortBy: 'maturity',
  filterSheetOpen: false,
  confirmDialog: null,
  toast: null,
  theme: 'light',
  userName: '',
  editDraft: null,
  fdPayoutOpen: false,
  fdRenewalOpen: false,
  fdStatementsOpen: false,
  rdDetailsOpen: false,
  fdCalc: initialFdCalc,
  rdCalc: initialRdCalc,
  exporting: false,
  importing: false,
  pendingImport: null,
  pendingEncryptedImportText: null,
  passphraseError: null,
  remindersEnabled: false,
  reminderLeadDays: DEFAULT_LEAD_DAYS,
  notificationPermissionGranted: false,
};

type Action =
  | {
      type: 'HYDRATE';
      fdRaw: StoredFd[];
      rdRaw: StoredRd[];
      theme: 'light' | 'dark' | null;
      userName: string;
      remindersEnabled: boolean;
      reminderLeadDays: number;
      notificationPermissionGranted: boolean;
    }
  | { type: 'LOAD_ERROR' }
  | { type: 'SET_TAB'; tab: ActiveTab }
  | { type: 'SET_PORTFOLIO_TAB'; tab: 'FD' | 'RD' }
  | { type: 'SET_SEARCH'; value: string }
  | { type: 'SET_FILTER_BANK'; value: string }
  | { type: 'SET_FILTER_TYPE'; value: string }
  | { type: 'SET_FILTER_STATUS'; value: string }
  | { type: 'SET_SORT_BY'; value: SortBy }
  | { type: 'RESET_FILTERS' }
  | { type: 'OPEN_FILTER_SHEET' }
  | { type: 'CLOSE_FILTER_SHEET' }
  | { type: 'SET_THEME'; theme: 'light' | 'dark' }
  | { type: 'SET_USER_NAME'; name: string }
  | { type: 'SHOW_TOAST'; message: string }
  | { type: 'CLEAR_TOAST' }
  | { type: 'SET_EDIT_DRAFT'; draft: Draft | null }
  | { type: 'SET_DRAFT_FIELD'; field: string; value: any }
  | { type: 'SAVE_FD'; record: StoredFd; isNew: boolean }
  | { type: 'SAVE_RD'; record: StoredRd; isNew: boolean }
  | { type: 'DELETE_FD'; id: string }
  | { type: 'DELETE_RD'; id: string }
  | { type: 'MARK_STATUS'; kind: 'FD' | 'RD'; id: string; status: string }
  | { type: 'ASK_CONFIRM'; dialog: ConfirmDialogState }
  | { type: 'CLOSE_CONFIRM' }
  | { type: 'RENEW'; kind: 'FD' | 'RD'; id: string; newStartDate: string }
  | { type: 'TOGGLE_FD_PAYOUT' }
  | { type: 'TOGGLE_FD_RENEWAL' }
  | { type: 'TOGGLE_FD_STATEMENTS' }
  | { type: 'TOGGLE_RD_DETAILS' }
  | { type: 'SET_FD_CALC_FIELD'; field: keyof FdCalcState; value: any }
  | { type: 'SET_RD_CALC_FIELD'; field: keyof RdCalcState; value: any }
  | { type: 'SET_EXPORTING'; value: boolean }
  | { type: 'SET_IMPORTING'; value: boolean }
  | { type: 'SET_PENDING_IMPORT'; data: PendingImport | null }
  | { type: 'SET_PENDING_ENCRYPTED_IMPORT_TEXT'; text: string | null }
  | { type: 'SET_PASSPHRASE_ERROR'; error: string | null }
  | { type: 'SET_REMINDERS_ENABLED'; enabled: boolean }
  | { type: 'SET_REMINDER_LEAD_DAYS'; days: number }
  | { type: 'SET_NOTIFICATION_PERMISSION'; granted: boolean }
  | { type: 'REFRESH_DATE' };

function reducer(state: RawState, action: Action): RawState {
  switch (action.type) {
    case 'REFRESH_DATE':
      // Notify consumers to re-read today's date even when stored records are unchanged.
      return { ...state };
    case 'HYDRATE':
      return {
        ...state,
        fdRaw: action.fdRaw,
        rdRaw: action.rdRaw,
        theme: action.theme === 'dark' ? 'dark' : 'light',
        userName: action.userName,
        remindersEnabled: action.remindersEnabled,
        reminderLeadDays: action.reminderLeadDays,
        notificationPermissionGranted: action.notificationPermissionGranted,
        hydrated: true,
        loadError: false,
      };
    case 'LOAD_ERROR':
      return { ...state, hydrated: true, loadError: true };
    case 'SET_TAB':
      return { ...state, activeTab: action.tab };
    case 'SET_PORTFOLIO_TAB':
      return {
        ...state, portfolioTab: action.tab,
        filterType: (action.tab === 'FD' ? state.fdRaw.some(record => record.fdType === state.filterType) : state.rdRaw.some(record => record.rdType === state.filterType)) ? state.filterType : 'All',
      };
    case 'SET_SEARCH':
      return { ...state, search: action.value };
    case 'SET_FILTER_BANK':
      return { ...state, filterBank: action.value };
    case 'SET_FILTER_TYPE':
      return { ...state, filterType: action.value };
    case 'SET_FILTER_STATUS':
      return { ...state, filterStatus: action.value };
    case 'SET_SORT_BY':
      return { ...state, sortBy: action.value };
    case 'RESET_FILTERS':
      return { ...state, filterBank: 'All', filterType: 'All', filterStatus: 'All', sortBy: 'maturity', search: '', filterSheetOpen: false };
    case 'OPEN_FILTER_SHEET':
      return { ...state, filterSheetOpen: true };
    case 'CLOSE_FILTER_SHEET':
      return { ...state, filterSheetOpen: false };
    case 'SET_THEME':
      return { ...state, theme: action.theme };
    case 'SET_USER_NAME':
      return { ...state, userName: action.name };
    case 'SHOW_TOAST':
      return { ...state, toast: action.message };
    case 'CLEAR_TOAST':
      return { ...state, toast: null };
    case 'SET_EDIT_DRAFT':
      return { ...state, editDraft: action.draft };
    case 'SET_DRAFT_FIELD':
      return { ...state, editDraft: { ...state.editDraft, [action.field]: action.value } };
    case 'SAVE_FD':
      return {
        ...state,
        fdRaw: action.isNew ? [...state.fdRaw, action.record] : state.fdRaw.map(f => (f.id === action.record.id ? action.record : f)),
      };
    case 'SAVE_RD':
      return {
        ...state,
        rdRaw: action.isNew ? [...state.rdRaw, action.record] : state.rdRaw.map(r => (r.id === action.record.id ? action.record : r)),
      };
    case 'DELETE_FD':
      return { ...state, fdRaw: state.fdRaw.filter(f => f.id !== action.id), confirmDialog: null };
    case 'DELETE_RD':
      return { ...state, rdRaw: state.rdRaw.filter(r => r.id !== action.id), confirmDialog: null };
    case 'MARK_STATUS': {
      if (action.kind === 'FD') {
        return { ...state, fdRaw: state.fdRaw.map(f => (f.id === action.id ? { ...f, status: action.status } : f)), confirmDialog: null };
      }
      return { ...state, rdRaw: state.rdRaw.map(r => (r.id === action.id ? { ...r, status: action.status } : r)), confirmDialog: null };
    }
    case 'ASK_CONFIRM':
      return { ...state, confirmDialog: action.dialog };
    case 'CLOSE_CONFIRM':
      return { ...state, confirmDialog: null, pendingImport: null };
    case 'RENEW': {
      if (action.kind === 'FD') {
        return {
          ...state,
          fdRaw: state.fdRaw.map(f => (f.id === action.id ? { ...f, startDate: action.newStartDate, renewalCount: f.renewalCount + 1 } : f)),
          confirmDialog: null,
        };
      }
      return {
        ...state,
        rdRaw: state.rdRaw.map(r => (r.id === action.id ? { ...r, startDate: action.newStartDate, installmentsPaid: 0, renewalCount: r.renewalCount + 1 } : r)),
        confirmDialog: null,
      };
    }
    case 'TOGGLE_FD_PAYOUT':
      return { ...state, fdPayoutOpen: !state.fdPayoutOpen };
    case 'TOGGLE_FD_RENEWAL':
      return { ...state, fdRenewalOpen: !state.fdRenewalOpen };
    case 'TOGGLE_FD_STATEMENTS':
      return { ...state, fdStatementsOpen: !state.fdStatementsOpen };
    case 'TOGGLE_RD_DETAILS':
      return { ...state, rdDetailsOpen: !state.rdDetailsOpen };
    case 'SET_FD_CALC_FIELD':
      return { ...state, fdCalc: { ...state.fdCalc, [action.field]: action.value } };
    case 'SET_RD_CALC_FIELD':
      return { ...state, rdCalc: { ...state.rdCalc, [action.field]: action.value } };
    case 'SET_EXPORTING':
      return { ...state, exporting: action.value };
    case 'SET_IMPORTING':
      return { ...state, importing: action.value };
    case 'SET_PENDING_IMPORT':
      return { ...state, pendingImport: action.data };
    case 'SET_PENDING_ENCRYPTED_IMPORT_TEXT':
      return { ...state, pendingEncryptedImportText: action.text, passphraseError: null };
    case 'SET_PASSPHRASE_ERROR':
      return { ...state, passphraseError: action.error };
    case 'SET_REMINDERS_ENABLED':
      return { ...state, remindersEnabled: action.enabled };
    case 'SET_REMINDER_LEAD_DAYS':
      return { ...state, reminderLeadDays: action.days };
    case 'SET_NOTIFICATION_PERMISSION':
      return { ...state, notificationPermissionGranted: action.granted };
    default:
      return state;
  }
}

function draftToStoredFd(draft: Draft, id: string): StoredFd {
  return {
    id,
    fdNumber: String(draft.fdNumber ?? ''),
    bankName: String(draft.bankName ?? ''),
    branch: String(draft.branch ?? ''),
    bankAccountNumber: String(draft.bankAccountNumber ?? ''),
    customerId: String(draft.customerId ?? ''),
    fdHolderName: String(draft.fdHolderName ?? ''),
    jointHolder: draft.jointHolder ? String(draft.jointHolder) : null,
    fdType: String(draft.fdType ?? 'Regular'),
    mode: String(draft.mode ?? 'Online'),
    status: String(draft.status ?? 'Active'),
    principalAmount: Number(draft.principalAmount) || 0,
    depositDate: String(draft.depositDate ?? draft.startDate),
    startDate: String(draft.startDate),
    tenureYears: Number(draft.tenureYears) || 0,
    tenureMonths: Number(draft.tenureMonths) || 0,
    tenureDays: Number(draft.tenureDays) || 0,
    interestRate: Number(draft.interestRate) || 0,
    interestType: String(draft.interestType ?? 'Compound'),
    compoundingFrequency: String(draft.compoundingFrequency ?? 'Quarterly'),
    interestPayoutMode: String(draft.interestPayoutMode ?? 'At Maturity'),
    interestCreditMethod: String(draft.interestCreditMethod ?? 'Reinvested into FD'),
    autoRenewal: String(draft.autoRenewal ?? 'No'),
    renewalOption: String(draft.renewalOption ?? 'Do Not Renew'),
    remarks: String(draft.remarks ?? ''),
    nominee: String(draft.nominee ?? ''),
    nomineeRelationship: String(draft.nomineeRelationship ?? ''),
    tdsApplicable: String(draft.tdsApplicable ?? 'Yes'),
    tdsPercent: Number(draft.tdsPercent) || 0,
    panSubmitted: String(draft.panSubmitted ?? 'Yes'),
    form15G: String(draft.form15G ?? 'No'),
    renewalCount: Number(draft.renewalCount) || 0,
  };
}

function draftToStoredRd(draft: Draft, id: string): StoredRd {
  return {
    id,
    rdNumber: String(draft.rdNumber ?? ''),
    bankName: String(draft.bankName ?? ''),
    branch: String(draft.branch ?? ''),
    bankAccountNumber: String(draft.bankAccountNumber ?? ''),
    customerId: String(draft.customerId ?? ''),
    rdHolderName: String(draft.rdHolderName ?? ''),
    jointHolder: draft.jointHolder ? String(draft.jointHolder) : null,
    rdType: String(draft.rdType ?? 'Regular'),
    mode: String(draft.mode ?? 'Online'),
    status: String(draft.status ?? 'Active'),
    monthlyInstallment: Number(draft.monthlyInstallment) || 0,
    startDate: String(draft.startDate),
    tenureYears: Number(draft.tenureYears) || 0,
    tenureMonths: Number(draft.tenureMonths) || 0,
    interestRate: Number(draft.interestRate) || 0,
    interestType: String(draft.interestType ?? 'Compound'),
    compoundingFrequency: String(draft.compoundingFrequency ?? 'Quarterly'),
    installmentsPaid: Number(draft.installmentsPaid) || 0,
    remarks: String(draft.remarks ?? ''),
    renewalCount: Number(draft.renewalCount) || 0,
  };
}

export interface AppActions {
  setTab: (tab: ActiveTab) => void;
  setPortfolioTabFD: () => void;
  setPortfolioTabRD: () => void;
  setSearch: (value: string) => void;
  setFilterBank: (value: string) => void;
  setFilterType: (value: string) => void;
  setFilterStatus: (value: string) => void;
  setSortBy: (value: SortBy) => void;
  resetFilters: () => void;
  openFilterSheet: () => void;
  closeFilterSheet: () => void;
  setThemeLight: () => void;
  setThemeDark: () => void;
  setUserName: (name: string) => void;
  showToast: (message: string) => void;
  goMaturityTimeline: () => void;
  goNotifications: () => void;
  goBackupRestore: () => void;
  goClearData: () => void;
  goSecurity: () => void;
  goPinSetup: (mode: 'setup' | 'change') => void;
  goReminderSettings: () => void;
  /** Returns false if the user enabled reminders but denied the OS permission prompt —
   * the screen should show guidance rather than silently leaving the toggle stuck off. */
  setRemindersEnabled: (enabled: boolean) => Promise<boolean>;
  setReminderLeadDays: (days: number) => void;
  exportBackup: (passphrase?: string) => void;
  importBackup: () => void;
  submitImportPassphrase: (passphrase: string) => void;
  cancelImportPassphrase: () => void;
  clearAllData: () => void;
  toastComingSoon: () => void;
  openFDDetail: (id: string) => void;
  openRDDetail: (id: string) => void;
  openAddFD: () => void;
  openAddRD: () => void;
  openEditFD: (id: string) => void;
  openEditRD: (id: string) => void;
  setDraftField: (field: string, value: any) => void;
  saveDraftFD: (id: string | null) => Promise<void>;
  saveDraftRD: (id: string | null) => Promise<void>;
  openFdCalculator: () => void;
  openRdCalculator: () => void;
  toggleFdPayout: () => void;
  toggleFdRenewal: () => void;
  toggleFdStatements: () => void;
  toggleRdDetails: () => void;
  askConfirm: (action: ConfirmDialogState['action'], kind: 'FD' | 'RD', id: string, title: string, message: string, confirmLabel: string) => void;
  closeConfirm: () => void;
  runConfirm: () => void;
  runConfirmSecondary: () => void;
  fcSet: (field: keyof FdCalcState) => (value: any) => void;
  rcSet: (field: keyof RdCalcState) => (value: any) => void;
  back: () => void;
  retryLoad: () => void;
}

const StateContext = createContext<RawState>(initialState);
const ActionsContext = createContext<AppActions | null>(null);

const THEME_KEY = 'theme';
const USER_NAME_KEY = 'userName';
const REMINDERS_ENABLED_KEY = 'remindersEnabled';
const REMINDER_LEAD_DAYS_KEY = 'reminderLeadDays';
const NOTIFICATION_RECEIPTS_KEY = 'notificationDeliveryReceipts';
const reminderDeliveryStore = {
  load: async (): Promise<Record<string, number>> => {
    const raw = await getSetting(NOTIFICATION_RECEIPTS_KEY);
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
      return Object.fromEntries(Object.entries(parsed).filter((entry): entry is [string, number] => typeof entry[1] === 'number' && Number.isFinite(entry[1])));
    } catch { return {}; }
  },
  save: (receipts: Record<string, number>) => setSetting(NOTIFICATION_RECEIPTS_KEY, JSON.stringify(receipts)),
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  // AppProvider renders inside LockProvider (see App.tsx) specifically so clearAllData
  // can re-sync lock state after wiping the settings table it lives in.
  const lockActions = useLockActions();

  const load = useCallback(async () => {
    try {
      await openDb();
      const [{ fds, rds }, themeSetting, userNameSetting, remindersEnabledRaw, leadDaysRaw, notificationPermissionGranted] = await Promise.all([
        loadAll(),
        getSetting(THEME_KEY),
        getSetting(USER_NAME_KEY),
        getSetting(REMINDERS_ENABLED_KEY),
        getSetting(REMINDER_LEAD_DAYS_KEY),
        hasNotificationPermission(),
      ]);
      dispatch({
        type: 'HYDRATE',
        fdRaw: fds,
        rdRaw: rds,
        theme: themeSetting === 'dark' ? 'dark' : 'light',
        userName: userNameSetting ?? '',
        remindersEnabled: remindersEnabledRaw === 'true',
        reminderLeadDays: Number(leadDaysRaw) || DEFAULT_LEAD_DAYS,
        notificationPermissionGranted,
      });
    } catch {
      dispatch({ type: 'LOAD_ERROR' });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const sub = RNAppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') dispatch({ type: 'REFRESH_DATE' });
    });
    return () => sub.remove();
  }, []);

  const showToast = useCallback((message: string) => {
    dispatch({ type: 'SHOW_TOAST', message });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => dispatch({ type: 'CLEAR_TOAST' }), 2600);
  }, []);

  const refreshNotificationPermission = useCallback(async () => {
    const granted = await hasNotificationPermission();
    dispatch({ type: 'SET_NOTIFICATION_PERMISSION', granted });
    return granted;
  }, []);

  /** Best-effort system notification for export/import completion — only fires when the
   * user isn't actively looking at the app (the toast already covers the foreground
   * case) and only if notification permission was already granted elsewhere (Reminders
   * settings); this never prompts for permission itself. */
  const notifyIfBackgrounded = useCallback((title: string, body: string) => {
    if (RNAppState.currentState === 'active') return;
    if (!stateRef.current.notificationPermissionGranted) return;
    displayCompletionNotification(title, body).catch(() => {});
  }, []);

  const actions = useMemo<AppActions>(() => ({
    setTab: tab => dispatch({ type: 'SET_TAB', tab }),
    setPortfolioTabFD: () => dispatch({ type: 'SET_PORTFOLIO_TAB', tab: 'FD' }),
    setPortfolioTabRD: () => dispatch({ type: 'SET_PORTFOLIO_TAB', tab: 'RD' }),
    setSearch: value => dispatch({ type: 'SET_SEARCH', value }),
    setFilterBank: value => dispatch({ type: 'SET_FILTER_BANK', value }),
    setFilterType: value => dispatch({ type: 'SET_FILTER_TYPE', value }),
    setFilterStatus: value => dispatch({ type: 'SET_FILTER_STATUS', value }),
    setSortBy: value => dispatch({ type: 'SET_SORT_BY', value }),
    resetFilters: () => dispatch({ type: 'RESET_FILTERS' }),
    openFilterSheet: () => dispatch({ type: 'OPEN_FILTER_SHEET' }),
    closeFilterSheet: () => dispatch({ type: 'CLOSE_FILTER_SHEET' }),
    setThemeLight: () => {
      dispatch({ type: 'SET_THEME', theme: 'light' });
      setSetting(THEME_KEY, 'light').catch(() => {});
    },
    setThemeDark: () => {
      dispatch({ type: 'SET_THEME', theme: 'dark' });
      setSetting(THEME_KEY, 'dark').catch(() => {});
    },
    setUserName: name => {
      dispatch({ type: 'SET_USER_NAME', name });
      setSetting(USER_NAME_KEY, name).catch(() => {});
    },
    showToast,
    goMaturityTimeline: () => navigate('MaturityTimeline'),
    goNotifications: () => navigate('Notifications'),
    goBackupRestore: () => navigate('BackupRestore'),
    goClearData: () => navigate('ClearData'),
    goSecurity: () => navigate('Security'),
    goPinSetup: mode => navigate('PinSetup', { mode }),
    goReminderSettings: () => navigate('Reminders'),
    setRemindersEnabled: async enabled => {
      if (enabled) {
        const granted = await requestNotificationPermission();
        dispatch({ type: 'SET_NOTIFICATION_PERMISSION', granted });
        if (!granted) return false;
      }
      dispatch({ type: 'SET_REMINDERS_ENABLED', enabled });
      setSetting(REMINDERS_ENABLED_KEY, enabled ? 'true' : 'false').catch(() => {});
      if (!enabled) cancelAllReminders().catch(() => {});
      return true;
    },
    setReminderLeadDays: days => {
      dispatch({ type: 'SET_REMINDER_LEAD_DAYS', days });
      setSetting(REMINDER_LEAD_DAYS_KEY, String(days)).catch(() => {});
    },
    exportBackup: async passphrase => {
      dispatch({ type: 'SET_EXPORTING', value: true });
      await yieldToUI();
      let path: string;
      let filename: string;
      try {
        const settings = await getAllSettings();
        const envelope = buildBackupEnvelope(stateRef.current.fdRaw, stateRef.current.rdRaw, settings);
        const json = serializeBackup(envelope);
        const content = passphrase ? JSON.stringify(await encryptBackupJson(json, passphrase)) : json;
        filename = backupFilename();
        path = await writeBackupFile(content, filename);
      } catch {
        showToast('Export failed — try again');
        dispatch({ type: 'SET_EXPORTING', value: false });
        return;
      }
      // The file itself is ready at this point — the button shouldn't stay disabled
      // through the share sheet too, since Share.open() doesn't resolve until the user
      // finishes picking a target app (or that app finishes an upload), which can take
      // far longer than the export work itself.
      dispatch({ type: 'SET_EXPORTING', value: false });
      showToast('Backup ready to share');
      notifyIfBackgrounded('Backup ready', `${filename} is ready to share`);
      // The file briefly holds the whole portfolio (plaintext or encrypted) in the cache
      // directory — clean it up once the share sheet is done with it, fire-and-forget so
      // this doesn't hold up the UI either.
      shareBackupFile(path, filename).finally(() => deleteBackupFile(path).catch(() => {}));
    },
    importBackup: async () => {
      dispatch({ type: 'SET_IMPORTING', value: true });
      try {
        const text = await pickBackupFileText();
        if (text == null) return; // user cancelled the picker
        await processImportText(text, undefined, dispatch, showToast, stateRef.current.fdRaw, stateRef.current.rdRaw);
      } catch {
        showToast('Could not read that file');
      } finally {
        dispatch({ type: 'SET_IMPORTING', value: false });
      }
    },
    submitImportPassphrase: async passphrase => {
      const text = stateRef.current.pendingEncryptedImportText;
      if (!text) return;
      dispatch({ type: 'SET_IMPORTING', value: true });
      await yieldToUI();
      try {
        const outcome = await processImportText(text, passphrase, dispatch, showToast, stateRef.current.fdRaw, stateRef.current.rdRaw);
        // processImportText's decrypt step is the same PBKDF2-heavy work as export —
        // worth a ping if the user switched away while it ran.
        if (outcome === 'ready-to-confirm') {
          notifyIfBackgrounded('Backup decrypted', 'Open the app to review and confirm the restore');
        } else if (outcome === 'wrong-passphrase') {
          notifyIfBackgrounded('Incorrect passphrase', 'Open the app to try again');
        }
      } catch {
        showToast('Could not read that file');
      } finally {
        dispatch({ type: 'SET_IMPORTING', value: false });
      }
    },
    cancelImportPassphrase: () => dispatch({ type: 'SET_PENDING_ENCRYPTED_IMPORT_TEXT', text: null }),
    clearAllData: async () => {
      try {
        await deleteAllData();
        // deleteAllData wipes the whole settings table, including the PIN/lock
        // settings LockContext owns — without this, LockContext would keep thinking a
        // PIN is still configured after the row backing it is gone.
        await lockActions.refreshAfterExternalWipe();
        await load();
        goBack();
        showToast('All data deleted');
      } catch {
        showToast('Delete failed — try again');
      }
    },
    toastComingSoon: () => showToast('Coming soon'),
    openFDDetail: id => navigate('FdDetail', { id }),
    openRDDetail: id => navigate('RdDetail', { id }),
    openAddFD: () => {
      dispatch({ type: 'SET_EDIT_DRAFT', draft: blankFdDraft(stateRef.current.fdRaw, stateRef.current.userName) });
      navigate('AddEditFD', { id: null });
    },
    openAddRD: () => {
      dispatch({ type: 'SET_EDIT_DRAFT', draft: blankRdDraft(stateRef.current.rdRaw, stateRef.current.userName) });
      navigate('AddEditRD', { id: null });
    },
    openEditFD: id => {
      const rec = stateRef.current.fdRaw.find(f => f.id === id);
      dispatch({ type: 'SET_EDIT_DRAFT', draft: rec ? { ...rec } : null });
      navigate('AddEditFD', { id });
    },
    openEditRD: id => {
      const rec = stateRef.current.rdRaw.find(r => r.id === id);
      dispatch({ type: 'SET_EDIT_DRAFT', draft: rec ? { ...rec } : null });
      navigate('AddEditRD', { id });
    },
    setDraftField: (field, value) => dispatch({ type: 'SET_DRAFT_FIELD', field, value }),
    saveDraftFD: async id => {
      const draft = stateRef.current.editDraft;
      if (!draft) return;
      const record = draftToStoredFd(draft, id || 'fd-' + Date.now());
      try {
        await upsertFd(record);
      } catch {
        showToast('Failed to save — try again');
        return;
      }
      dispatch({ type: 'SAVE_FD', record, isNew: !id });
      goBack();
      showToast(id ? 'FD updated successfully' : 'FD added successfully');
    },
    saveDraftRD: async id => {
      const draft = stateRef.current.editDraft;
      if (!draft) return;
      const record = draftToStoredRd(draft, id || 'rd-' + Date.now());
      try {
        await upsertRd(record);
      } catch {
        showToast('Failed to save — try again');
        return;
      }
      dispatch({ type: 'SAVE_RD', record, isNew: !id });
      goBack();
      showToast(id ? 'RD updated successfully' : 'RD added successfully');
    },
    openFdCalculator: () => navigate('FdCalculator'),
    openRdCalculator: () => navigate('RdCalculator'),
    toggleFdPayout: () => dispatch({ type: 'TOGGLE_FD_PAYOUT' }),
    toggleFdRenewal: () => dispatch({ type: 'TOGGLE_FD_RENEWAL' }),
    toggleFdStatements: () => dispatch({ type: 'TOGGLE_FD_STATEMENTS' }),
    toggleRdDetails: () => dispatch({ type: 'TOGGLE_RD_DETAILS' }),
    askConfirm: (action, kind, id, title, message, confirmLabel) =>
      dispatch({ type: 'ASK_CONFIRM', dialog: { action, kind, id, title, message, confirmLabel } }),
    closeConfirm: () => dispatch({ type: 'CLOSE_CONFIRM' }),
    runConfirm: () => {
      const c = stateRef.current.confirmDialog;
      if (!c) return;
      const dialogKind = c.kind as 'FD' | 'RD'; // 'ALL' only ever occurs for the 'import' action, handled separately below
      if (c.action === 'close') {
        dispatch({ type: 'MARK_STATUS', kind: dialogKind, id: c.id, status: 'Closed' });
        persistStatus(dialogKind, c.id, 'Closed');
        showToast(dialogKind + ' marked as closed');
        goBack();
      } else if (c.action === 'premature') {
        dispatch({ type: 'MARK_STATUS', kind: dialogKind, id: c.id, status: 'Prematurely Closed' });
        persistStatus(dialogKind, c.id, 'Prematurely Closed');
        showToast(dialogKind + ' closed prematurely');
        goBack();
      } else if (c.action === 'renew') {
        let newStartDate = todayIso();
        if (dialogKind === 'FD') {
          const rec = stateRef.current.fdRaw.find(f => f.id === c.id);
          if (!rec) {
            dispatch({ type: 'CLOSE_CONFIRM' });
            return;
          }
          newStartDate = toIsoDate(addTenure(parseIsoDate(rec.startDate), rec.tenureYears, rec.tenureMonths, rec.tenureDays));
        }
        dispatch({ type: 'RENEW', kind: dialogKind, id: c.id, newStartDate });
        persistRenew(dialogKind, c.id, newStartDate);
        showToast(dialogKind + ' renewed successfully');
      } else if (c.action === 'delete') {
        if (dialogKind === 'FD') {
          dispatch({ type: 'DELETE_FD', id: c.id });
          deleteFd(c.id).catch(() => {});
        } else {
          dispatch({ type: 'DELETE_RD', id: c.id });
          deleteRd(c.id).catch(() => {});
        }
        showToast(dialogKind + ' deleted');
        goBack();
      } else if (c.action === 'import') {
        const pending = stateRef.current.pendingImport;
        dispatch({ type: 'CLOSE_CONFIRM' });
        if (pending) {
          dispatch({ type: 'SET_IMPORTING', value: true });
          applyPendingImport(pending, 'overwrite', stateRef.current.fdRaw, stateRef.current.rdRaw)
            .then(({ fdCount, rdCount }) =>
              load().then(() => {
                const message = fdCount + rdCount > 0 ? `Backup restored — ${fdCount} FD(s), ${rdCount} RD(s)` : 'Nothing to restore';
                showToast(message);
                notifyIfBackgrounded('Import complete', message);
              }),
            )
            .catch(() => {
              const message = 'Import failed — your existing data was not changed';
              showToast(message);
              notifyIfBackgrounded('Import failed', message);
            })
            .finally(() => dispatch({ type: 'SET_IMPORTING', value: false }));
        }
      }

      function persistStatus(kind: 'FD' | 'RD', id: string, status: string) {
        if (kind === 'FD') {
          const rec = stateRef.current.fdRaw.find(f => f.id === id);
          if (rec) upsertFd({ ...rec, status }).catch(() => {});
        } else {
          const rec = stateRef.current.rdRaw.find(r => r.id === id);
          if (rec) upsertRd({ ...rec, status }).catch(() => {});
        }
      }
      function persistRenew(kind: 'FD' | 'RD', id: string, newStartDate: string) {
        if (kind === 'FD') {
          const rec = stateRef.current.fdRaw.find(f => f.id === id);
          if (rec) upsertFd({ ...rec, startDate: newStartDate, renewalCount: rec.renewalCount + 1 }).catch(() => {});
        } else {
          const rec = stateRef.current.rdRaw.find(r => r.id === id);
          if (rec) upsertRd({ ...rec, startDate: newStartDate, installmentsPaid: 0, renewalCount: rec.renewalCount + 1 }).catch(() => {});
        }
      }
    },
    runConfirmSecondary: () => {
      const c = stateRef.current.confirmDialog;
      if (!c || c.action !== 'import') return; // the only action that currently offers a secondary button
      const pending = stateRef.current.pendingImport;
      dispatch({ type: 'CLOSE_CONFIRM' });
      if (!pending) return;
      dispatch({ type: 'SET_IMPORTING', value: true });
      applyPendingImport(pending, 'skip-existing', stateRef.current.fdRaw, stateRef.current.rdRaw)
        .then(({ fdCount, rdCount }) =>
          load().then(() => {
            const message = fdCount + rdCount > 0 ? `Backup restored — ${fdCount} FD(s), ${rdCount} RD(s)` : 'Nothing new to restore';
            showToast(message);
            notifyIfBackgrounded('Import complete', message);
          }),
        )
        .catch(() => {
          const message = 'Import failed — your existing data was not changed';
          showToast(message);
          notifyIfBackgrounded('Import failed', message);
        })
        .finally(() => dispatch({ type: 'SET_IMPORTING', value: false }));
    },
    fcSet: field => value => dispatch({ type: 'SET_FD_CALC_FIELD', field, value }),
    rcSet: field => value => dispatch({ type: 'SET_RD_CALC_FIELD', field, value }),
    back: () => goBack(),
    retryLoad: () => load(),
  }), [showToast, notifyIfBackgrounded, load, lockActions]);

  return (
    <StateContext.Provider value={state}>
      <ActionsContext.Provider value={actions}>
        {children}
        <ReminderSync refreshPermission={refreshNotificationPermission} />
      </ActionsContext.Provider>
    </StateContext.Provider>
  );
}

/** Recomputes the reminder plan and reconciles it against what's actually scheduled
 * whenever portfolio data or reminder settings change, and again whenever the app
 * returns to the foreground — this app's substitute for a native boot receiver (see
 * reminders.ts's header comment). Renders nothing; exists purely for the side effect,
 * inside the providers so it can read the same derived fdList/rdList every other
 * consumer sees. */
function ReminderSync({ refreshPermission }: { refreshPermission: () => Promise<boolean> }) {
  const state = useContext(StateContext);
  const { showToast } = useAppActions();

  const sync = useCallback((permissionGranted: boolean) => {
    const now = new Date();
    const fds = state.fdRaw.map(fd => deriveFd(fd, today()));
    const rds = state.rdRaw.map(rd => deriveRd(rd, today()));
    const planned = planPortfolioReminders(fds, rds, { enabled: state.remindersEnabled && permissionGranted, leadDays: state.reminderLeadDays }, now);
    return syncScheduledReminders(planned, reminderDeliveryStore);
  }, [state.fdRaw, state.rdRaw, state.remindersEnabled, state.reminderLeadDays]);

  useEffect(() => {
    if (!state.hydrated) return;
    sync(state.notificationPermissionGranted).catch(() => showToast('Could not schedule notifications — reopen the app to retry'));
  }, [state.hydrated, state.notificationPermissionGranted, sync, showToast]);

  useEffect(() => {
    const sub = RNAppState.addEventListener('change', (next: AppStateStatus) => {
      if (next !== 'active' || !state.hydrated) return;
      refreshPermission().then(sync).catch(() => showToast('Could not schedule notifications — reopen the app to retry'));
    });
    return () => sub.remove();
  }, [state.hydrated, refreshPermission, sync, showToast]);

  return null;
}

export function useAppState(): AppState {
  const raw = useContext(StateContext);
  const day = todayIso();
  const fdList = useMemo(() => raw.fdRaw.map(f => deriveFd(f, parseIsoDate(day))), [raw.fdRaw, day]);
  const rdList = useMemo(() => raw.rdRaw.map(r => deriveRd(r, parseIsoDate(day))), [raw.rdRaw, day]);
  const events = useMemo(() => deriveEvents(fdList, rdList), [fdList, rdList]);
  const notifications = useMemo(() => deriveNotifications(fdList, rdList, today()), [fdList, rdList]);
  return { ...raw, fdList, rdList, events, notifications };
}

export function useAppActions(): AppActions {
  const ctx = useContext(ActionsContext);
  if (!ctx) throw new Error('useAppActions must be used within AppProvider');
  return ctx;
}
