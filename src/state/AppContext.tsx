import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { FixedDeposit, RecurringDeposit, PortfolioEvent, PortfolioNotification } from '../data/portfolioData';
import { StoredFd, StoredRd, openDb, loadAll, upsertFd, upsertRd, deleteFd, deleteRd, getSetting, setSetting } from '../data/db';
import { today, deriveFd, deriveRd, deriveEvents, deriveNotifications } from '../data/derive';
import { navigate, goBack } from '../navigation/navigationRef';

export type ActiveTab = 'home' | 'portfolio' | 'payouts' | 'calculators' | 'more';
export type SortBy = 'maturity' | 'amount' | 'rate';

export interface ConfirmDialogState {
  action: 'close' | 'premature' | 'renew' | 'delete';
  kind: 'FD' | 'RD';
  id: string;
  title: string;
  message: string;
  confirmLabel: string;
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
  editDraft: Draft | null;
  fdPayoutOpen: boolean;
  fdRenewalOpen: boolean;
  fdStatementsOpen: boolean;
  rdDetailsOpen: boolean;
  fdCalc: FdCalcState;
  rdCalc: RdCalcState;
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

const todayIso = () => today().toISOString().slice(0, 10);

function blankFdDraft(fdRaw: StoredFd[]): Draft {
  return {
    fdNumber: 'FD' + String(fdRaw.length + 1).padStart(3, '0'), bankName: '', branch: '', bankAccountNumber: '', customerId: '',
    fdHolderName: '', jointHolder: '', fdType: 'Regular', mode: 'Online',
    principalAmount: '', depositDate: todayIso(), startDate: todayIso(),
    tenureYears: 1, tenureMonths: 0, tenureDays: 0, interestRate: '', interestType: 'Compound', compoundingFrequency: 'Quarterly',
    interestPayoutMode: 'At Maturity', interestCreditMethod: 'Reinvested into FD',
    autoRenewal: 'No', renewalOption: 'Do Not Renew', remarks: '', nominee: '', nomineeRelationship: '',
    tdsApplicable: 'Yes', tdsPercent: 10, panSubmitted: 'Yes', form15G: 'No', renewalCount: 0, status: 'Active',
  };
}

function blankRdDraft(rdRaw: StoredRd[]): Draft {
  return {
    rdNumber: 'RD' + String(rdRaw.length + 1).padStart(3, '0'), bankName: '', branch: '', bankAccountNumber: '', customerId: '',
    rdHolderName: '', jointHolder: '', rdType: 'Regular', mode: 'Online',
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
  editDraft: null,
  fdPayoutOpen: false,
  fdRenewalOpen: false,
  fdStatementsOpen: false,
  rdDetailsOpen: false,
  fdCalc: initialFdCalc,
  rdCalc: initialRdCalc,
};

type Action =
  | { type: 'HYDRATE'; fdRaw: StoredFd[]; rdRaw: StoredRd[]; theme: 'light' | 'dark' | null }
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
  | { type: 'SET_RD_CALC_FIELD'; field: keyof RdCalcState; value: any };

function reducer(state: RawState, action: Action): RawState {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, fdRaw: action.fdRaw, rdRaw: action.rdRaw, theme: action.theme === 'dark' ? 'dark' : 'light', hydrated: true, loadError: false };
    case 'LOAD_ERROR':
      return { ...state, hydrated: true, loadError: true };
    case 'SET_TAB':
      return { ...state, activeTab: action.tab };
    case 'SET_PORTFOLIO_TAB':
      return { ...state, portfolioTab: action.tab };
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
      return { ...state, confirmDialog: null };
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
  showToast: (message: string) => void;
  goMaturityTimeline: () => void;
  goNotifications: () => void;
  toastComingSoon: () => void;
  openFDDetail: (id: string) => void;
  openRDDetail: (id: string) => void;
  openAddFD: () => void;
  openAddRD: () => void;
  openEditFD: (id: string) => void;
  openEditRD: (id: string) => void;
  setDraftField: (field: string, value: any) => void;
  saveDraftFD: (id: string | null) => void;
  saveDraftRD: (id: string | null) => void;
  openFdCalculator: () => void;
  openRdCalculator: () => void;
  toggleFdPayout: () => void;
  toggleFdRenewal: () => void;
  toggleFdStatements: () => void;
  toggleRdDetails: () => void;
  askConfirm: (action: ConfirmDialogState['action'], kind: 'FD' | 'RD', id: string, title: string, message: string, confirmLabel: string) => void;
  closeConfirm: () => void;
  runConfirm: () => void;
  fcSet: (field: keyof FdCalcState) => (value: any) => void;
  rcSet: (field: keyof RdCalcState) => (value: any) => void;
  back: () => void;
  retryLoad: () => void;
}

const StateContext = createContext<RawState>(initialState);
const ActionsContext = createContext<AppActions | null>(null);

const THEME_KEY = 'theme';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const load = useCallback(async () => {
    try {
      await openDb();
      const [{ fds, rds }, themeSetting] = await Promise.all([loadAll(), getSetting(THEME_KEY)]);
      dispatch({ type: 'HYDRATE', fdRaw: fds, rdRaw: rds, theme: themeSetting === 'dark' ? 'dark' : 'light' });
    } catch {
      dispatch({ type: 'LOAD_ERROR' });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const showToast = useCallback((message: string) => {
    dispatch({ type: 'SHOW_TOAST', message });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => dispatch({ type: 'CLEAR_TOAST' }), 2600);
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
    showToast,
    goMaturityTimeline: () => navigate('MaturityTimeline'),
    goNotifications: () => navigate('Notifications'),
    toastComingSoon: () => showToast('Coming soon'),
    openFDDetail: id => navigate('FdDetail', { id }),
    openRDDetail: id => navigate('RdDetail', { id }),
    openAddFD: () => {
      dispatch({ type: 'SET_EDIT_DRAFT', draft: blankFdDraft(stateRef.current.fdRaw) });
      navigate('AddEditFD', { id: null });
    },
    openAddRD: () => {
      dispatch({ type: 'SET_EDIT_DRAFT', draft: blankRdDraft(stateRef.current.rdRaw) });
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
    saveDraftFD: id => {
      const draft = stateRef.current.editDraft;
      if (!draft) return;
      const record = draftToStoredFd(draft, id || 'fd-' + Date.now());
      dispatch({ type: 'SAVE_FD', record, isNew: !id });
      upsertFd(record).catch(() => showToast('Failed to save — try again'));
      goBack();
      showToast(id ? 'FD updated successfully' : 'FD added successfully');
    },
    saveDraftRD: id => {
      const draft = stateRef.current.editDraft;
      if (!draft) return;
      const record = draftToStoredRd(draft, id || 'rd-' + Date.now());
      dispatch({ type: 'SAVE_RD', record, isNew: !id });
      upsertRd(record).catch(() => showToast('Failed to save — try again'));
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
      if (c.action === 'close') {
        dispatch({ type: 'MARK_STATUS', kind: c.kind, id: c.id, status: 'Closed' });
        persistStatus(c.kind, c.id, 'Closed');
        showToast(c.kind + ' marked as closed');
        goBack();
      } else if (c.action === 'premature') {
        dispatch({ type: 'MARK_STATUS', kind: c.kind, id: c.id, status: 'Prematurely Closed' });
        persistStatus(c.kind, c.id, 'Prematurely Closed');
        showToast(c.kind + ' closed prematurely');
        goBack();
      } else if (c.action === 'renew') {
        const newStartDate = todayIso();
        dispatch({ type: 'RENEW', kind: c.kind, id: c.id, newStartDate });
        persistRenew(c.kind, c.id, newStartDate);
        showToast(c.kind + ' renewed successfully');
      } else if (c.action === 'delete') {
        if (c.kind === 'FD') {
          dispatch({ type: 'DELETE_FD', id: c.id });
          deleteFd(c.id).catch(() => {});
        } else {
          dispatch({ type: 'DELETE_RD', id: c.id });
          deleteRd(c.id).catch(() => {});
        }
        showToast(c.kind + ' deleted');
        goBack();
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
    fcSet: field => value => dispatch({ type: 'SET_FD_CALC_FIELD', field, value }),
    rcSet: field => value => dispatch({ type: 'SET_RD_CALC_FIELD', field, value }),
    back: () => goBack(),
    retryLoad: () => load(),
  }), [showToast, load]);

  return (
    <StateContext.Provider value={state}>
      <ActionsContext.Provider value={actions}>{children}</ActionsContext.Provider>
    </StateContext.Provider>
  );
}

export function useAppState(): AppState {
  const raw = useContext(StateContext);
  const fdList = useMemo(() => raw.fdRaw.map(f => deriveFd(f, today())), [raw.fdRaw]);
  const rdList = useMemo(() => raw.rdRaw.map(r => deriveRd(r, today())), [raw.rdRaw]);
  const events = useMemo(() => deriveEvents(fdList, rdList), [fdList, rdList]);
  const notifications = useMemo(() => deriveNotifications(fdList, rdList, today()), [fdList, rdList]);
  return { ...raw, fdList, rdList, events, notifications };
}

export function useAppActions(): AppActions {
  const ctx = useContext(ActionsContext);
  if (!ctx) throw new Error('useAppActions must be used within AppProvider');
  return ctx;
}
