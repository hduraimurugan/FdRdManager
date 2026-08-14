import React, { createContext, useCallback, useContext, useMemo, useReducer, useRef } from 'react';
import {
  FixedDeposit,
  RecurringDeposit,
  PortfolioEvent,
  PortfolioNotification,
  initialFdList,
  initialRdList,
  initialEvents,
  initialNotifications,
  daysBetween,
  TODAY,
} from '../data/portfolioData';
import { navigate, goBack } from '../navigation/navigationRef';

export type ActiveTab = 'home' | 'portfolio' | 'payouts' | 'calculators' | 'more';
export type DemoMode = 'normal' | 'loading' | 'error';
export type SortBy = 'maturity' | 'amount' | 'rate';

export interface ConfirmDialogState {
  action: 'close' | 'premature' | 'renew';
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

// Loosely typed like the prototype's editDraft — holds a mix of FD/RD field values while a form is open.
export type Draft = Record<string, any>;

export interface AppState {
  fdList: FixedDeposit[];
  rdList: RecurringDeposit[];
  events: PortfolioEvent[];
  notifications: PortfolioNotification[];
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
  demoMode: DemoMode;
  theme: 'light' | 'dark';
  editDraft: Draft | null;
  fdPayoutOpen: boolean;
  fdRenewalOpen: boolean;
  rdDetailsOpen: boolean;
  fdCalc: FdCalcState;
  rdCalc: RdCalcState;
}

const initialState: AppState = {
  fdList: initialFdList.slice(),
  rdList: initialRdList.slice(),
  events: initialEvents.slice(),
  notifications: initialNotifications.slice(),
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
  demoMode: 'normal',
  theme: 'light',
  editDraft: null,
  fdPayoutOpen: false,
  fdRenewalOpen: false,
  rdDetailsOpen: false,
  fdCalc: { principal: 500000, ratePct: 7.1, startDate: '2026-08-10', years: 3, months: 0, days: 0, compounding: 'Quarterly', tdsPercent: 10 },
  rdCalc: { monthlyInstallment: 10000, ratePct: 6.75, startDate: '2026-08-10', years: 2, months: 0 },
};

type Action =
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
  | { type: 'SET_DEMO_MODE'; mode: DemoMode }
  | { type: 'SHOW_TOAST'; message: string }
  | { type: 'CLEAR_TOAST' }
  | { type: 'SET_EDIT_DRAFT'; draft: Draft | null }
  | { type: 'SET_DRAFT_FIELD'; field: string; value: any }
  | { type: 'SAVE_FD'; record: FixedDeposit; isNew: boolean }
  | { type: 'SAVE_RD'; record: RecurringDeposit; isNew: boolean }
  | { type: 'MARK_STATUS'; kind: 'FD' | 'RD'; id: string; status: string; extra?: Record<string, any> }
  | { type: 'ASK_CONFIRM'; dialog: ConfirmDialogState }
  | { type: 'CLOSE_CONFIRM' }
  | { type: 'RENEW'; kind: 'FD' | 'RD'; id: string }
  | { type: 'TOGGLE_FD_PAYOUT' }
  | { type: 'TOGGLE_FD_RENEWAL' }
  | { type: 'TOGGLE_RD_DETAILS' }
  | { type: 'SET_FD_CALC_FIELD'; field: keyof FdCalcState; value: any }
  | { type: 'SET_RD_CALC_FIELD'; field: keyof RdCalcState; value: any };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
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
    case 'SET_DEMO_MODE':
      return { ...state, demoMode: action.mode };
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
        fdList: action.isNew ? [...state.fdList, action.record] : state.fdList.map(f => (f.id === action.record.id ? action.record : f)),
      };
    case 'SAVE_RD':
      return {
        ...state,
        rdList: action.isNew ? [...state.rdList, action.record] : state.rdList.map(r => (r.id === action.record.id ? action.record : r)),
      };
    case 'MARK_STATUS': {
      const key = action.kind === 'FD' ? 'fdList' : 'rdList';
      return {
        ...state,
        [key]: (state[key] as any[]).map(r => (r.id === action.id ? { ...r, status: action.status, ...action.extra } : r)),
        confirmDialog: null,
      } as AppState;
    }
    case 'ASK_CONFIRM':
      return { ...state, confirmDialog: action.dialog };
    case 'CLOSE_CONFIRM':
      return { ...state, confirmDialog: null };
    case 'RENEW': {
      const key = action.kind === 'FD' ? 'fdList' : 'rdList';
      return {
        ...state,
        [key]: (state[key] as any[]).map(r => {
          if (r.id !== action.id) return r;
          const oldMaturity = new Date(r.maturityDate);
          const newMaturity = new Date(oldMaturity);
          newMaturity.setFullYear(newMaturity.getFullYear() + (r.tenureYears || 1));
          return {
            ...r,
            maturityDate: newMaturity.toISOString().slice(0, 10),
            daysRemaining: daysBetween(TODAY, newMaturity),
            renewalCount: (r.renewalCount || 0) + 1,
            actionNeeded: null,
          };
        }),
        confirmDialog: null,
      } as AppState;
    }
    case 'TOGGLE_FD_PAYOUT':
      return { ...state, fdPayoutOpen: !state.fdPayoutOpen };
    case 'TOGGLE_FD_RENEWAL':
      return { ...state, fdRenewalOpen: !state.fdRenewalOpen };
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

const FREQ_N: Record<string, number> = { Monthly: 12, Quarterly: 4, 'Half-Yearly': 2, Yearly: 1 };

function blankFdDraft(fdList: FixedDeposit[]): Draft {
  return {
    fdNumber: 'FD' + String(fdList.length + 1).padStart(3, '0'), bankName: 'HDFC Bank', branch: '', bankAccountNumber: '', customerId: '',
    fdHolderName: '', jointHolder: '', fdType: 'Regular', mode: 'Online',
    principalAmount: '', depositDate: '2026-08-10', startDate: '2026-08-10',
    tenureYears: 1, tenureMonths: 0, tenureDays: 0, interestRate: '', interestType: 'Compound', compoundingFrequency: 'Quarterly',
    interestPayoutMode: 'At Maturity', interestCreditMethod: 'Reinvested into FD',
    autoRenewal: 'No', renewalOption: 'Do Not Renew',
  };
}

function blankRdDraft(rdList: RecurringDeposit[]): Draft {
  return {
    rdNumber: 'RD' + String(rdList.length + 1).padStart(3, '0'), bankName: 'HDFC Bank', branch: '', bankAccountNumber: '', customerId: '',
    rdHolderName: '', jointHolder: '', rdType: 'Regular', mode: 'Online',
    monthlyInstallment: '', startDate: '2026-08-10', tenureYears: 1, tenureMonths: 0,
    interestRate: '', interestType: 'Compound', compoundingFrequency: 'Quarterly',
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
  setDemoNormal: () => void;
  setDemoLoading: () => void;
  setDemoError: () => void;
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
  toggleRdDetails: () => void;
  askConfirm: (action: ConfirmDialogState['action'], kind: 'FD' | 'RD', id: string, title: string, message: string, confirmLabel: string) => void;
  closeConfirm: () => void;
  runConfirm: () => void;
  fcSet: (field: keyof FdCalcState) => (value: any) => void;
  rcSet: (field: keyof RdCalcState) => (value: any) => void;
  back: () => void;
}

const StateContext = createContext<AppState>(initialState);
const ActionsContext = createContext<AppActions | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

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
    setThemeLight: () => dispatch({ type: 'SET_THEME', theme: 'light' }),
    setThemeDark: () => dispatch({ type: 'SET_THEME', theme: 'dark' }),
    setDemoNormal: () => dispatch({ type: 'SET_DEMO_MODE', mode: 'normal' }),
    setDemoLoading: () => dispatch({ type: 'SET_DEMO_MODE', mode: 'loading' }),
    setDemoError: () => dispatch({ type: 'SET_DEMO_MODE', mode: 'error' }),
    showToast,
    goMaturityTimeline: () => navigate('MaturityTimeline'),
    goNotifications: () => navigate('Notifications'),
    toastComingSoon: () => showToast('Coming soon'),
    openFDDetail: id => navigate('FdDetail', { id }),
    openRDDetail: id => navigate('RdDetail', { id }),
    openAddFD: () => {
      dispatch({ type: 'SET_EDIT_DRAFT', draft: blankFdDraft(stateRef.current.fdList) });
      navigate('AddEditFD', { id: null });
    },
    openAddRD: () => {
      dispatch({ type: 'SET_EDIT_DRAFT', draft: blankRdDraft(stateRef.current.rdList) });
      navigate('AddEditRD', { id: null });
    },
    openEditFD: id => {
      const rec = stateRef.current.fdList.find(f => f.id === id);
      dispatch({ type: 'SET_EDIT_DRAFT', draft: rec ? { ...rec } : null });
      navigate('AddEditFD', { id });
    },
    openEditRD: id => {
      const rec = stateRef.current.rdList.find(r => r.id === id);
      dispatch({ type: 'SET_EDIT_DRAFT', draft: rec ? { ...rec } : null });
      navigate('AddEditRD', { id });
    },
    setDraftField: (field, value) => dispatch({ type: 'SET_DRAFT_FIELD', field, value }),
    saveDraftFD: id => {
      const draft = stateRef.current.editDraft;
      if (!draft) return;
      const startDate = new Date(draft.startDate);
      const maturity = new Date(startDate);
      maturity.setFullYear(maturity.getFullYear() + Number(draft.tenureYears || 0));
      maturity.setMonth(maturity.getMonth() + Number(draft.tenureMonths || 0));
      maturity.setDate(maturity.getDate() + Number(draft.tenureDays || 0));
      const principal = Number(draft.principalAmount) || 0;
      const rate = Number(draft.interestRate) || 0;
      const totalDays = daysBetween(startDate, maturity);
      const totalYears = totalDays / 365;
      const n = FREQ_N[draft.compoundingFrequency] || 4;
      const isPayout = draft.interestPayoutMode !== 'At Maturity';
      const maturityAmount = isPayout ? principal : Math.round(principal * Math.pow(1 + rate / 100 / n, n * totalYears));
      const record = {
        ...draft, id: id || 'fd-' + Date.now(), status: id ? draft.status : 'Active',
        principalAmount: principal, interestRate: rate, maturityDate: maturity.toISOString().slice(0, 10),
        maturityAmount, currentValue: id ? draft.currentValue : principal, interestEarnedTotal: maturityAmount - principal,
        interestEarnedSoFar: id ? draft.interestEarnedSoFar : 0, daysRemaining: daysBetween(TODAY, maturity), totalDays,
        elapsedDays: id ? draft.elapsedDays : 0,
        isPayoutFD: isPayout, nextPayoutAmount: isPayout ? Math.round(principal * (rate / 100) / n) : null,
        nextPayoutDate: isPayout ? draft.startDate : null,
      } as FixedDeposit;
      dispatch({ type: 'SAVE_FD', record, isNew: !id });
      goBack();
      showToast(id ? 'FD updated successfully' : 'FD added successfully');
    },
    saveDraftRD: id => {
      const draft = stateRef.current.editDraft;
      if (!draft) return;
      const startDate = new Date(draft.startDate);
      const totalMonths = Number(draft.tenureYears || 0) * 12 + Number(draft.tenureMonths || 0);
      const maturity = new Date(startDate);
      maturity.setMonth(maturity.getMonth() + totalMonths);
      const installment = Number(draft.monthlyInstallment) || 0;
      const rate = Number(draft.interestRate) || 0;
      const maturityAmount = Math.round(installment * totalMonths + (installment * (rate / 100) * totalMonths * (totalMonths + 1)) / 24);
      const record = {
        ...draft, id: id || 'rd-' + Date.now(), status: id ? draft.status : 'Active',
        monthlyInstallment: installment, interestRate: rate, maturityDate: maturity.toISOString().slice(0, 10),
        totalMonths, maturityAmount, totalDeposited: id ? draft.totalDeposited : 0, interestEarnedSoFar: id ? draft.interestEarnedSoFar : 0,
        interestEarnedTotal: maturityAmount - installment * totalMonths, currentValue: id ? draft.currentValue : 0,
        installmentsTotal: totalMonths, installmentsPaid: id ? draft.installmentsPaid : 0, installmentsMissed: id ? draft.installmentsMissed : 0,
        daysRemaining: daysBetween(TODAY, maturity), nextInstallmentDate: draft.startDate, autoDebit: draft.mode === 'Online' ? 'Yes' : 'No',
      } as RecurringDeposit;
      dispatch({ type: 'SAVE_RD', record, isNew: !id });
      goBack();
      showToast(id ? 'RD updated successfully' : 'RD added successfully');
    },
    openFdCalculator: () => navigate('FdCalculator'),
    openRdCalculator: () => navigate('RdCalculator'),
    toggleFdPayout: () => dispatch({ type: 'TOGGLE_FD_PAYOUT' }),
    toggleFdRenewal: () => dispatch({ type: 'TOGGLE_FD_RENEWAL' }),
    toggleRdDetails: () => dispatch({ type: 'TOGGLE_RD_DETAILS' }),
    askConfirm: (action, kind, id, title, message, confirmLabel) =>
      dispatch({ type: 'ASK_CONFIRM', dialog: { action, kind, id, title, message, confirmLabel } }),
    closeConfirm: () => dispatch({ type: 'CLOSE_CONFIRM' }),
    runConfirm: () => {
      const c = stateRef.current.confirmDialog;
      if (!c) return;
      if (c.action === 'close') {
        dispatch({ type: 'MARK_STATUS', kind: c.kind, id: c.id, status: 'Closed' });
        showToast(c.kind + ' marked as closed');
        goBack();
      } else if (c.action === 'premature') {
        dispatch({ type: 'MARK_STATUS', kind: c.kind, id: c.id, status: 'Prematurely Closed' });
        showToast(c.kind + ' closed prematurely');
        goBack();
      } else if (c.action === 'renew') {
        dispatch({ type: 'RENEW', kind: c.kind, id: c.id });
        showToast(c.kind + ' renewed successfully');
      }
    },
    fcSet: field => value => dispatch({ type: 'SET_FD_CALC_FIELD', field, value }),
    rcSet: field => value => dispatch({ type: 'SET_RD_CALC_FIELD', field, value }),
    back: () => goBack(),
  }), [showToast]);

  return (
    <StateContext.Provider value={state}>
      <ActionsContext.Provider value={actions}>{children}</ActionsContext.Provider>
    </StateContext.Provider>
  );
}

export function useAppState(): AppState {
  return useContext(StateContext);
}

export function useAppActions(): AppActions {
  const ctx = useContext(ActionsContext);
  if (!ctx) throw new Error('useAppActions must be used within AppProvider');
  return ctx;
}
