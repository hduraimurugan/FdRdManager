/* eslint-disable @typescript-eslint/no-var-requires */
import React from 'react';
import { Text, TextInput, Switch, Platform, ScrollView, Dimensions } from 'react-native';
import type { ReactTestRenderer, ReactTestInstance } from 'react-test-renderer';
import { ThemeProvider } from '../theme/ThemeContext';
import type { AppState } from '../state/AppContext';
import { deriveFd, deriveRd, deriveEvents, deriveNotifications } from '../data/derive';
import FormField from '../components/FormField';
import ConfirmDialog from '../components/ConfirmDialog';
import FormSelect from '../components/FormSelect';
import BankPicker from '../components/BankPicker';
import TopAppBar from '../components/TopAppBar';
import DateField from '../components/DateField';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { fd, rd, NOW } from '../../tests/support/fixtures';
import { render, cleanup, act } from '../../tests/support/renderer';

jest.mock('react-native-safe-area-context', () => ({ ...jest.requireActual('react-native-safe-area-context'), useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock('../state/AppContext', () => ({ useAppState: () => mockState, useAppActions: () => mockActions }));
jest.mock('../state/LockContext', () => ({ GRACE_PERIOD_OPTIONS: [0, 30, 60, 300], useLockState: () => mockLockState, useLockActions: () => mockLockActions }));
const mockActions: Record<string, jest.Mock> = {};
const mockLockActions: Record<string, jest.Mock> = {};
let mockState: AppState;
let mockLockState: { pinConfigured: boolean; lockEnabled: boolean; biometricEnabled: boolean; biometricAvailable: boolean; graceSeconds: number };
const names = ['setTab', 'setPortfolioTabFD', 'setPortfolioTabRD', 'setSearch', 'setFilterBank', 'setFilterType', 'setFilterStatus', 'setSortBy', 'resetFilters', 'openFilterSheet', 'closeFilterSheet', 'setThemeLight', 'setThemeDark', 'setUserName', 'showToast', 'goMaturityTimeline', 'goNotifications', 'goBackupRestore', 'goClearData', 'goSecurity', 'goPinSetup', 'goReminderSettings', 'setRemindersEnabled', 'setReminderLeadDays', 'exportBackup', 'importBackup', 'submitImportPassphrase', 'cancelImportPassphrase', 'clearAllData', 'toastComingSoon', 'openFDDetail', 'openRDDetail', 'openAddFD', 'openAddRD', 'openEditFD', 'openEditRD', 'setDraftField', 'saveDraftFD', 'saveDraftRD', 'openFdCalculator', 'openRdCalculator', 'toggleFdPayout', 'toggleFdRenewal', 'toggleFdStatements', 'toggleRdDetails', 'askConfirm', 'closeConfirm', 'runConfirm', 'runConfirmSecondary', 'fcSet', 'rcSet', 'back', 'retryLoad'];
const registry = [
  ['HomeScreen', 'Portfolio balance'], ['PortfolioScreen', 'FD001 \u00b7 Regular'], ['PayoutsScreen', 'Upcoming'],
  ['CalculatorsHubScreen', 'FD Calculator'], ['MoreScreen', 'Your name'], ['MainTabsScreen', 'Portfolio'],
  ['FdDetailScreen', 'FD001'], ['RdDetailScreen', 'RD001'], ['AddEditFdScreen', 'Add FD'], ['AddEditRdScreen', 'Add RD'],
  ['FdCalculatorScreen', 'FD Calculator'], ['RdCalculatorScreen', 'RD Calculator'], ['NotificationsScreen', 'Notifications'],
  ['MaturityTimelineScreen', 'Maturity Timeline'], ['BackupRestoreScreen', 'Backup & Restore'], ['ClearDataScreen', 'Delete all data'],
  ['SecuritySettingsScreen', 'Security'], ['PinSetupScreen', 'Set up PIN'], ['ReminderSettingsScreen', 'Notification Reminders'], ['LockScreen', 'Enter your PIN'],
];
beforeEach(() => {
  jest.useFakeTimers(); jest.setSystemTime(NOW); jest.clearAllMocks(); jest.replaceProperty(Platform, 'OS', 'android');
  names.forEach(name => { mockActions[name] = jest.fn(); });
  mockActions.fcSet.mockImplementation(field => (value: unknown) => mockActions.setDraftField(field, value));
  mockActions.rcSet.mockImplementation(field => (value: unknown) => mockActions.setDraftField(field, value));
  mockActions.setRemindersEnabled.mockResolvedValue(true); mockActions.retryLoad.mockResolvedValue(undefined);
  ['setupPin', 'changePin', 'disableLock', 'setBiometricEnabled', 'setGraceSeconds', 'lockoutSecondsRemaining', 'unlockWithPin', 'unlockWithBiometric'].forEach(name => { mockLockActions[name] = jest.fn(); });
  mockLockActions.lockoutSecondsRemaining.mockReturnValue(0); mockLockActions.setupPin.mockResolvedValue({ ok: true }); mockLockActions.changePin.mockResolvedValue({ ok: true }); mockLockActions.unlockWithPin.mockResolvedValue(false);
  mockLockState = { pinConfigured: false, lockEnabled: false, biometricEnabled: false, biometricAvailable: false, graceSeconds: 0 };
  const f = deriveFd(fd(), NOW); const r = deriveRd(rd(), NOW);
  mockState = {
    hydrated: true, loadError: false, fdList: [f], rdList: [r], events: deriveEvents([f], [r]), notifications: deriveNotifications([f], [r], NOW),
    activeTab: 'home', portfolioTab: 'FD', search: '', filterBank: 'All', filterType: 'All', filterStatus: 'All', sortBy: 'maturity', filterSheetOpen: false,
    confirmDialog: null, toast: null, theme: 'light', userName: 'Jane', editDraft: fd(), fdPayoutOpen: false, fdRenewalOpen: false, fdStatementsOpen: false, rdDetailsOpen: false,
    fdCalc: { principal: 100000, ratePct: 8, startDate: '2026-01-01', years: 1, months: 0, days: 0, compounding: 'Quarterly', tdsPercent: 10 },
    rdCalc: { monthlyInstallment: 5000, ratePct: 0, startDate: '2026-01-01', years: 1, months: 0 },
    exporting: false, importing: false, pendingImport: null, pendingEncryptedImportText: null, passphraseError: null, remindersEnabled: false, reminderLeadDays: 3, notificationPermissionGranted: true,
  };
});
afterEach(async () => { await cleanup(); jest.clearAllTimers(); jest.useRealTimers(); jest.restoreAllMocks(); });
function element(name: string) {
  const Component = require(`./${name}`).default as React.ComponentType<{ route: { params: { id: string | null; mode: string } } }>;
  const id = name.startsWith('AddEdit') ? null : name.startsWith('Rd') ? 'rd-1' : 'fd-1';
  return <Component route={{ params: { id, mode: 'setup' } }} />;
}
async function screen(name: string, mode: 'light' | 'dark' = 'light') { return render(<ThemeProvider mode={mode}>{element(name)}</ThemeProvider>); }
function textContent(node: ReactTestInstance): string { return node.children.map(child => typeof child === 'string' ? child : textContent(child)).join(''); }
function hasText(tree: ReactTestRenderer, value: string) { return tree.root.findAllByType(Text).some(node => textContent(node) === value); }
async function press(tree: ReactTestRenderer, label: string) {
  const node = tree.root.findAllByType(Text).find(n => textContent(n) === label);
  if (!node) throw new Error(`Missing text: ${label}`);
  let parent = node.parent;
  while (parent && typeof parent.props.onPress !== 'function') parent = parent.parent;
  if (!parent) throw new Error(`No press handler for: ${label}`);
  const target = parent;
  if (target.props.disabled) throw new Error(`Disabled button: ${label}`);
  await act(async () => { await target.props.onPress(); });
}
async function input(tree: ReactTestRenderer, text: string, index = 0) { await act(async () => { await tree.root.findAllByType(TextInput)[index].props.onChangeText(text); }); }

describe.each(['light', 'dark'] as const)('UI rendering in %s theme', mode => {
  it.each(registry)('UI-001 %s displays its expected content', async (name, expected) => {
    if (name === 'AddEditRdScreen') mockState.editDraft = rd();
    const tree = await screen(name, mode); expect(hasText(tree, expected)).toBe(true);
  });
});
describe('UI user interactions', () => {
  it.each(['AddEditFdScreen', 'AddEditRdScreen'])('%s forwards manual bank names to the existing draft field', async name => {
    mockState.editDraft = name === 'AddEditFdScreen' ? fd() : rd();
    const tree = await screen(name);
    const picker = tree.root.findByType(BankPicker);
    expect(picker.props.usedNames).toContain('Test Bank');
    await act(async () => picker.props.onChange('Local Cooperative Bank'));
    expect(mockActions.setDraftField).toHaveBeenCalledWith('bankName', 'Local Cooperative Bank');
  });
  it('Portfolio exposes labelled add, clear search, and removable filters', async () => {
    mockState.search = 'Test'; mockState.filterStatus = 'Active'; mockState.sortBy = 'rate';
    const tree = await screen('PortfolioScreen');
    await press(tree, 'Add FD'); expect(mockActions.openAddFD).toHaveBeenCalled();
    await press(tree, 'Clear'); expect(mockActions.setSearch).toHaveBeenCalledWith('');
    await press(tree, 'Active ×'); expect(mockActions.setFilterStatus).toHaveBeenCalledWith('All');
    await press(tree, 'Clear all'); expect(mockActions.resetFilters).toHaveBeenCalled();
    expect(hasText(tree, 'Rate: highest')).toBe(true);
    expect(hasText(tree, '1 active FD · All active totals')).toBe(true);
  });
  it('Home shortcuts add FD/RD and monthly activity distinguishes money coming in and going out', async () => {
    const tree = await screen('HomeScreen');
    await press(tree, 'Add FD'); await press(tree, 'Add RD');
    expect(mockActions.openAddFD).toHaveBeenCalled(); expect(mockActions.openAddRD).toHaveBeenCalled();
    expect(hasText(tree, 'Interest payouts · incoming')).toBe(true);
    expect(hasText(tree, 'RD installments · outgoing')).toBe(true);
  });
  it('shows heading icons, Home title, Back and notification actions', async () => {
    const main = await screen('MainTabsScreen');
    const header = main.root.findByType(TopAppBar);
    expect(header.props.title).toBe('Home'); expect(header.props.titleIcon).toBeTruthy();
    await act(async () => header.props.onBellPress()); expect(mockActions.goNotifications).toHaveBeenCalled();
    const detail = await screen('FdDetailScreen');
    const detailHeader = detail.root.findByType(TopAppBar);
    expect(detailHeader.props.titleIcon).toBeTruthy(); expect(detailHeader.props.showBack).toBe(true);
    await act(async () => detailHeader.props.onBack()); expect(mockActions.back).toHaveBeenCalled();
  });
  it.each(['light', 'dark'] as const)('dashboard forecast switches horizons, selects months and opens receipts in %s', async mode => {
    const tree = await screen('HomeScreen', mode);
    expect(hasText(tree, 'Cash flow forecast')).toBe(true);
    expect(hasText(tree, 'June 2026')).toBe(true);
    await press(tree, '12M');
    expect(hasText(tree, 'From today · next 12 months')).toBe(true);
    await press(tree, 'Next 6 ›');
    const month = tree.root.findAll(node => node.props.accessibilityLabel === 'January 2027' && typeof node.props.onPress === 'function')[0];
    await act(async () => month.props.onPress());
    expect(hasText(tree, 'January 2027')).toBe(true);
    expect(hasText(tree, '2 expected receipts')).toBe(true);
    await press(tree, 'FD001 · 1 Jan 2027');
    expect(mockActions.openFDDetail).toHaveBeenCalledWith('fd-1');
    await press(tree, 'Maturity returns');
    expect(hasText(tree, 'June 2026')).toBe(true);
    await press(tree, 'Next 6 ›');
    await act(async () => tree.root.findAll(node => node.props.accessibilityLabel === 'January 2027' && typeof node.props.onPress === 'function')[0].props.onPress());
    expect(hasText(tree, 'Maturity return')).toBe(true);
    await press(tree, 'RD001 · 1 Jan 2027');
    expect(mockActions.openRDDetail).toHaveBeenCalledWith('rd-1');
    await press(tree, '6M');
    expect(hasText(tree, 'June 2026')).toBe(true);
    expect(hasText(tree, 'No maturity returns scheduled for this month.')).toBe(true);
  });
  it('UI-002 calculator hub routes to both calculators', async () => {
    const tree = await screen('CalculatorsHubScreen'); await press(tree, 'FD Calculator'); await press(tree, 'RD Calculator');
    expect(mockActions.openFdCalculator).toHaveBeenCalled(); expect(mockActions.openRdCalculator).toHaveBeenCalled();
  });
  it.each(['HomeScreen', 'PortfolioScreen'])('UI-003 %s shows load error and retry', async name => {
    mockState.loadError = true; const tree = await screen(name); await press(tree, 'Retry'); expect(mockActions.retryLoad).toHaveBeenCalled();
  });
  it.each(['HomeScreen', 'PortfolioScreen'])('UI-004 %s loading and empty states exclude saved content', async name => {
    mockState.hydrated = false; const tree = await screen(name); expect(hasText(tree, 'FD001')).toBe(false);
    mockState = { ...mockState, hydrated: true, fdList: [], rdList: [], events: [], notifications: [] };
    await act(async () => tree.update(<ThemeProvider mode="light">{element(name)}</ThemeProvider>));
    expect(tree.root.findAllByType(Text).some(n => textContent(n).includes(name === 'PortfolioScreen' ? 'No FDs yet' : 'deposit'))).toBe(true);
  });
  it('UI-005 portfolio search, FD/RD tabs and record navigation', async () => {
    const tree = await screen('PortfolioScreen'); await input(tree, 'Jane'); expect(mockActions.setSearch).toHaveBeenCalledWith('Jane');
    await press(tree, 'RD'); expect(mockActions.setPortfolioTabRD).toHaveBeenCalled(); await press(tree, 'FD'); expect(mockActions.setPortfolioTabFD).toHaveBeenCalled();
    await press(tree, 'FD001 \u00b7 Regular'); expect(mockActions.openFDDetail).toHaveBeenCalledWith('fd-1');
  });
  it.each(['FdDetailScreen', 'RdDetailScreen'])('UI-006 %s edit and delete target the record', async name => {
    const tree = await screen(name); await press(tree, 'Edit'); await press(tree, 'Delete');
    const kind = name === 'FdDetailScreen' ? 'FD' : 'RD';
    expect(mockActions[`openEdit${kind}`]).toHaveBeenCalledWith(kind === 'FD' ? 'fd-1' : 'rd-1');
    expect(mockActions.askConfirm).toHaveBeenCalledWith('delete', kind, kind === 'FD' ? 'fd-1' : 'rd-1', expect.any(String), expect.any(String), 'Delete');
  });
  it.each(['FdDetailScreen', 'RdDetailScreen'])('UI-007 %s missing record shows fallback', async name => {
    mockState.fdList = []; mockState.rdList = []; const tree = await screen(name);
    expect(tree.root.findAllByType(Text).some(n => textContent(n) === (name === 'FdDetailScreen' ? 'FD' : 'RD'))).toBe(true);
    expect(hasText(tree, 'Delete')).toBe(false);
  });
  it.each(['AddEditFdScreen', 'AddEditRdScreen'])('UI-008 %s validates before saving and forwards draft changes', async name => {
    const isFd = name === 'AddEditFdScreen'; mockState.editDraft = {};
    const tree = await screen(name);
    if (isFd) await press(tree, 'Review');
    const save = tree.root.findAll(node => typeof node.props.onPress === 'function' && node.findAllByType(Text).some(n => textContent(n).startsWith('Save')))[0];
    expect(save).toBeDefined(); await act(async () => save.props.onPress());
    expect(mockActions.showToast).toHaveBeenCalledWith('Fix the highlighted fields before saving'); expect(mockActions[isFd ? 'saveDraftFD' : 'saveDraftRD']).not.toHaveBeenCalled();
    mockState.editDraft = isFd ? fd() : rd(); await act(async () => tree.update(<ThemeProvider mode="light">{element(name)}</ThemeProvider>));
    await act(async () => tree.root.findAllByType(FormField)[0].props.onChangeText('NEW001')); expect(mockActions.setDraftField).toHaveBeenCalledWith(isFd ? 'fdNumber' : 'rdNumber', 'NEW001');
    if (isFd) { await press(tree, 'Continue to details'); await press(tree, 'Review FD'); }
    const validSave = tree.root.findAll(node => typeof node.props.onPress === 'function' && node.findAllByType(Text).some(n => textContent(n).startsWith('Save')))[0];
    await act(async () => validSave.props.onPress()); expect(mockActions[isFd ? 'saveDraftFD' : 'saveDraftRD']).toHaveBeenCalledWith(null);
  });
  it('FD steps keep optional details tucked away and retain draft values when navigating', async () => {
    const tree = await screen('AddEditFdScreen');
    expect(hasText(tree, 'Bank account number')).toBe(false);
    await press(tree, 'Continue to details');
    expect(hasText(tree, 'FD holder name')).toBe(true);
    expect(hasText(tree, 'Branch')).toBe(false);
    await press(tree, 'Bank details');
    const branch = tree.root.findAllByType(FormField).find(node => node.props.label === 'Branch')!;
    await act(async () => branch.props.onChangeText('Chennai'));
    expect(mockActions.setDraftField).toHaveBeenCalledWith('branch', 'Chennai');
    mockState.editDraft = { ...mockState.editDraft, branch: 'Chennai' };
    await act(async () => tree.update(<ThemeProvider mode="light">{element('AddEditFdScreen')}</ThemeProvider>));
    await press(tree, 'Review FD');
    expect(hasText(tree, 'Estimated maturity amount')).toBe(true);
    expect(hasText(tree, 'Interest payout frequency')).toBe(false);
    await press(tree, 'Interest payout');
    expect(hasText(tree, 'Interest payout frequency')).toBe(true);
    await press(tree, 'Renewal');
    expect(hasText(tree, 'Renewal instruction')).toBe(true);
    await press(tree, 'Previous');
    expect(tree.root.findAllByType(FormField).find(node => node.props.label === 'Branch')!.props.value).toBe('Chennai');
  });
  it('FD continue validates essentials and save reveals an invalid date in a collapsed section', async () => {
    mockState.editDraft = {};
    const tree = await screen('AddEditFdScreen');
    expect(hasText(tree, 'Select a bank')).toBe(false);
    await press(tree, 'Continue to details');
    expect(hasText(tree, 'Select a bank')).toBe(true);
    expect(hasText(tree, 'Build your deposit')).toBe(true);
    mockState.editDraft = { ...fd(), depositDate: '2026-02-01', startDate: '2026-01-01' };
    await act(async () => tree.update(<ThemeProvider mode="light">{element('AddEditFdScreen')}</ThemeProvider>));
    await press(tree, 'Review');
    await press(tree, 'Save FD');
    expect(hasText(tree, 'Make it yours')).toBe(true);
    expect(hasText(tree, "Deposit date can't be after the start date")).toBe(true);
    expect(mockActions.saveDraftFD).not.toHaveBeenCalled();
  });
  it.each(['FdCalculatorScreen', 'RdCalculatorScreen'])('UI-009 %s shows calculated results and forwards input changes', async name => {
    const tree = await screen(name); await act(async () => tree.root.findAllByType(FormField)[0].props.onChangeText('20000'));
    expect(mockActions.setDraftField).toHaveBeenCalledWith(name === 'FdCalculatorScreen' ? 'principal' : 'monthlyInstallment', '20000');
    expect(hasText(tree, 'Estimated maturity value')).toBe(true);
    if (name === 'RdCalculatorScreen') expect(hasText(tree, '₹60,000')).toBe(true);
  });
  it.each(['FdCalculatorScreen', 'RdCalculatorScreen'])('%s duration shortcuts update all duration fields', async name => {
    const tree = await screen(name);
    await press(tree, '6 months');
    expect(mockActions.setDraftField).toHaveBeenCalledWith('years', '0');
    expect(mockActions.setDraftField).toHaveBeenCalledWith('months', '6');
    if (name === 'FdCalculatorScreen') expect(mockActions.setDraftField).toHaveBeenCalledWith('days', '0');
  });
  it.each(['FdCalculatorScreen', 'RdCalculatorScreen'])('%s hides the estimate until invalid inputs are corrected', async name => {
    if (name === 'FdCalculatorScreen') mockState.fdCalc.principal = '';
    else mockState.rdCalc.monthlyInstallment = '';
    const tree = await screen(name);
    expect(hasText(tree, 'Estimated maturity value')).toBe(false);
    expect(hasText(tree, 'Your estimate will appear here')).toBe(true);
    if (name === 'FdCalculatorScreen') mockState.fdCalc.principal = 100000;
    else mockState.rdCalc.monthlyInstallment = 5000;
    await act(async () => tree.update(<ThemeProvider mode="light">{element(name)}</ThemeProvider>));
    expect(hasText(tree, 'Estimated maturity value')).toBe(true);
  });
  it('FD calculator reveals comparisons and tax settings on request', async () => {
    const tree = await screen('FdCalculatorScreen');
    expect(hasText(tree, 'Extra interest from compounding')).toBe(false);
    await press(tree, 'Simple vs compound interest');
    expect(hasText(tree, 'Extra interest from compounding')).toBe(true);
    await press(tree, 'Tax estimate');
    expect(hasText(tree, 'Estimated deduction on interest (%)')).toBe(true);
  });
  it('UI-010 More changes theme, profile and routes to backup', async () => {
    const tree = await screen('MoreScreen'); await input(tree, 'New name'); expect(mockActions.setUserName).toHaveBeenCalledWith('New name');
    await press(tree, 'Dark'); await press(tree, 'Light'); await press(tree, 'Backup & Restore'); expect(mockActions.setThemeDark).toHaveBeenCalled(); expect(mockActions.setThemeLight).toHaveBeenCalled(); expect(mockActions.goBackupRestore).toHaveBeenCalled();
  });
  it('UI-011 clear data requires typed confirmation', async () => {
    const tree = await screen('ClearDataScreen'); const button = () => tree.root.findAll(node => node.props.onPress === mockActions.clearAllData)[0];
    expect(button().props.disabled).toBe(true); await input(tree, 'delete'); expect(button().props.disabled).toBe(false);
    await press(tree, 'Delete everything'); expect(mockActions.clearAllData).toHaveBeenCalledTimes(1);
  });
  it('UI-012 backup plaintext export and import buttons invoke actions', async () => {
    const tree = await screen('BackupRestoreScreen'); await press(tree, 'Export as file'); expect(mockActions.exportBackup).toHaveBeenCalledWith();
    const importButton = tree.root.findAll(node => node.props.onPress === mockActions.importBackup)[0]; await act(async () => importButton.props.onPress()); expect(mockActions.importBackup).toHaveBeenCalled();
  });
  it('UI-013 reminders show denial feedback and persist selected lead days', async () => {
    mockState.remindersEnabled = true; mockActions.setRemindersEnabled.mockResolvedValue(false); const tree = await screen('ReminderSettingsScreen');
    await act(async () => tree.root.findByType(Switch).props.onValueChange(true)); expect(mockActions.showToast).toHaveBeenCalledWith(expect.stringContaining('blocked'));
    await press(tree, '1 week before'); expect(mockActions.setReminderLeadDays).toHaveBeenCalledWith(7);
  });
  it('UI-014 security setup and configured grace controls', async () => {
    const tree = await screen('SecuritySettingsScreen'); await press(tree, 'Set up PIN'); expect(mockActions.goPinSetup).toHaveBeenCalledWith('setup');
    mockLockState.pinConfigured = true; mockLockState.lockEnabled = true;
    await act(async () => tree.update(<ThemeProvider mode="light">{element('SecuritySettingsScreen')}</ThemeProvider>));
    await press(tree, 'Change PIN'); expect(mockActions.goPinSetup).toHaveBeenCalledWith('change'); await press(tree, 'After 30 seconds'); expect(mockLockActions.setGraceSeconds).toHaveBeenCalledWith(30);
  });
  it('UI-015 PIN setup rejects mismatch then saves a matching PIN', async () => {
    const tree = await screen('PinSetupScreen'); await input(tree, '1234'); expect(hasText(tree, 'Confirm your new PIN')).toBe(true);
    await input(tree, '5678'); expect(hasText(tree, "PINs don't match — start over")).toBe(true);
    await input(tree, '1234'); await input(tree, '1234'); expect(mockLockActions.setupPin).toHaveBeenCalledWith('1234'); expect(mockActions.back).toHaveBeenCalled();
  });
  it('UI-016 lock filters input, submits PIN and displays rejection', async () => {
    const tree = await screen('LockScreen'); await input(tree, '12a'); expect(mockLockActions.unlockWithPin).not.toHaveBeenCalled();
    await input(tree, '1234'); expect(mockLockActions.unlockWithPin).toHaveBeenCalledWith('1234'); expect(hasText(tree, 'Incorrect PIN')).toBe(true); expect(tree.root.findByType(TextInput).props.secureTextEntry).toBe(true);
  });
  it('UI-017 Main tabs exposes accessible tabs and add-deposit FAB', async () => {
    mockState.activeTab = 'portfolio'; const tree = await screen('MainTabsScreen');
    const tab = tree.root.findAll(node => node.props.accessibilityRole === 'tab' && node.props.accessibilityLabel === 'More')[0]; await act(async () => tab.props.onPress()); expect(mockActions.setTab).toHaveBeenCalledWith('more');
    const fab = tree.root.findAll(node => node.props.accessibilityLabel === 'Add FD' && typeof node.props.onPress === 'function')[0]; await act(async () => fab.props.onPress()); expect(mockActions.openAddFD).toHaveBeenCalled();
  });
  it('UI-018 notifications and timeline retain FD/RD navigation links', async () => {
    mockState.notifications = [{ id: 'n1', icon: 'alert', severity: 'high', title: 'Synthetic alert', subtitle: 'Test', date: '2026-06-15', recordType: 'RD', recordId: 'rd-1' }];
    const notifications = await screen('NotificationsScreen'); await press(notifications, 'Synthetic alert'); expect(mockActions.openRDDetail).toHaveBeenCalledWith('rd-1');
    const timeline = await screen('MaturityTimelineScreen');
    const clickable = timeline.root.findAll(node => typeof node.props.onPress === 'function' && node.findAllByType(Text).some(n => textContent(n).includes('FD001')))[0];
    expect(clickable).toBeDefined(); await act(async () => clickable.props.onPress()); expect(mockActions.openFDDetail).toHaveBeenCalledWith('fd-1');
  });
  it('UI-019 payouts select the associated deposit', async () => {
    const tree = await screen('PayoutsScreen');
    const clickable = tree.root.findAll(node => typeof node.props.onPress === 'function' && node.findAllByType(Text).some(n => textContent(n).includes('FD001')))[0];
    expect(clickable).toBeDefined(); await act(async () => clickable.props.onPress()); expect(mockActions.openFDDetail).toHaveBeenCalledWith('fd-1');
  });
  it('UI-020 confirmation exposes primary, secondary and cancel actions', async () => {
    mockState.confirmDialog = { action: 'import', kind: 'ALL', id: '', title: 'Restore?', message: 'Preview', confirmLabel: 'Overwrite', secondaryLabel: 'Skip existing' };
    const tree = await render(<ConfirmDialog />); await press(tree, 'Overwrite'); await press(tree, 'Skip existing'); await press(tree, 'Cancel');
    expect(mockActions.runConfirm).toHaveBeenCalled(); expect(mockActions.runConfirmSecondary).toHaveBeenCalled(); expect(mockActions.closeConfirm).toHaveBeenCalled();
  });
  it('UI-021 select control opens options and forwards selection', async () => {
    const changed = jest.fn(); const tree = await render(<FormSelect label="Frequency" value="" options={['Monthly', 'Quarterly']} onChange={changed} error="Required" />);
    expect(hasText(tree, 'Required')).toBe(true); await act(async () => jest.advanceTimersByTimeAsync(250)); await press(tree, 'Select'); await press(tree, 'Quarterly'); expect(changed).toHaveBeenCalledWith('Quarterly');
  });
  it('UI-022 Android date picker preserves local calendar date and ignores cancellation', async () => {
    const changed = jest.fn(); const tree = await render(<DateField label="Date" value="2026-01-31" onChange={changed} />);
    await press(tree, '31 Jan 2026'); const args = jest.mocked(DateTimePickerAndroid.open).mock.calls[0][0];
    await act(async () => { args.onChange?.({ type: 'dismissed' } as never, undefined); }); expect(changed).not.toHaveBeenCalled();
    await act(async () => { args.onChange?.({ type: 'set' } as never, new Date(2026, 1, 28)); }); expect(changed).toHaveBeenCalledWith('2026-02-28');
  });
  it('UI-023 encrypted export validates passphrase length and confirmation', async () => {
    const tree = await screen('BackupRestoreScreen'); await act(async () => jest.advanceTimersByTimeAsync(250));
    await act(async () => tree.root.findByType(Switch).props.onValueChange(true)); await press(tree, 'Export as file');
    await press(tree, 'Export encrypted file'); expect(mockActions.exportBackup).not.toHaveBeenCalled();
    expect(hasText(tree, 'Passphrase must be at least 6 characters')).toBe(true);
    await input(tree, 'abcdef'); await input(tree, 'different', 1); await press(tree, 'Export encrypted file');
    expect(hasText(tree, "Passphrases don't match")).toBe(true);
    await input(tree, 'abcdef', 1); await press(tree, 'Export encrypted file'); expect(mockActions.exportBackup).toHaveBeenCalledWith('abcdef');
  });
  it('UI-024 Main pager commits swipe destination and ignores out-of-range offsets', async () => {
    const tree = await screen('MainTabsScreen'); const pager = tree.root.findAllByType(ScrollView).find(node => node.props.pagingEnabled)!;
    const width = Dimensions.get('window').width;
    await act(async () => pager.props.onScrollEndDrag({ nativeEvent: { contentOffset: { x: width * 2 } } })); expect(mockActions.setTab).toHaveBeenCalledWith('payouts');
    mockActions.setTab.mockClear(); await act(async () => pager.props.onMomentumScrollEnd({ nativeEvent: { contentOffset: { x: width * 20 } } })); expect(mockActions.setTab).not.toHaveBeenCalled();
  });
  it('UI-025 expanded deposit details show stored fields and toggle actions', async () => {
    mockState.fdPayoutOpen = true; mockState.fdRenewalOpen = true; mockState.fdStatementsOpen = true; mockState.rdDetailsOpen = true;
    const f = await screen('FdDetailScreen'); expect(hasText(f, 'Auto-renewal')).toBe(true);
    const r = await screen('RdDetailScreen'); expect(hasText(r, '1234567890')).toBe(true);
  });
  it('BUG-007 matured FD offers renewal for its pending renewal decision', async () => {
    mockState.fdList = [deriveFd(fd({ startDate: '2025-01-01' }), NOW)];
    const tree = await screen('FdDetailScreen'); expect(hasText(tree, 'Renew')).toBe(true);
    await press(tree, 'Renew');
    expect(mockActions.askConfirm).toHaveBeenCalledWith('renew', 'FD', 'fd-1', 'Renew this FD?', expect.any(String), 'Renew');
  });
  it('BUG-007 active FD retains its renewal action', async () => {
    const tree = await screen('FdDetailScreen');
    await press(tree, 'Renew');
    expect(mockActions.askConfirm).toHaveBeenCalledWith('renew', 'FD', 'fd-1', 'Renew this FD?', expect.any(String), 'Renew');
  });
  it.each(['Closed', 'Prematurely Closed'])('BUG-007 %s FD has no renewal action', async status => {
    mockState.fdList = [deriveFd(fd({ startDate: '2025-01-01', status }), NOW)];
    const tree = await screen('FdDetailScreen');
    expect(hasText(tree, 'Renew')).toBe(false);
  });
});
