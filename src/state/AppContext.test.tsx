import React from 'react';
import { AppState as NativeAppState } from 'react-native';
import type { AppStateStatus } from 'react-native';
import { AppProvider, useAppState, useAppActions, AppState, AppActions } from './AppContext';
import * as db from '../data/db';
import * as io from '../data/backupIO';
import * as crypto from '../data/backupCrypto';
import * as notifications from '../data/notifeeClient';
import { buildBackupEnvelope, serializeBackup } from '../data/backupSchema';
import { navigate, goBack } from '../navigation/navigationRef';
import { fd, rd, NOW } from '../../tests/support/fixtures';
import { render, cleanup, act } from '../../tests/support/renderer';

jest.mock('../data/db');
jest.mock('../data/backupIO');
jest.mock('../data/backupCrypto');
jest.mock('../data/notifeeClient');
jest.mock('../navigation/navigationRef', () => ({ navigate: jest.fn(), goBack: jest.fn() }));
jest.mock('./LockContext', () => ({ useLockActions: () => ({ refreshAfterExternalWipe: mockWipe }) }));
const mockWipe = jest.fn();
let state: AppState;
let actions: AppActions;
const listeners = new Set<(next: AppStateStatus) => void>();
function Probe() { state = useAppState(); actions = useAppActions(); return null; }
async function mount() { return render(<AppProvider><Probe /></AppProvider>); }
async function run(fn: () => unknown) { await act(async () => { await fn(); }); }
async function timed(fn: () => unknown) {
  await act(async () => { const pending = fn(); await jest.advanceTimersByTimeAsync(300); await pending; });
}
beforeEach(() => {
  jest.resetAllMocks(); jest.useFakeTimers(); jest.setSystemTime(NOW);
  jest.mocked(db.loadAll).mockResolvedValue({ fds: [fd()], rds: [rd()] });
  jest.mocked(db.getSetting).mockResolvedValue(null);
  jest.mocked(db.getAllSettings).mockResolvedValue({});
  jest.mocked(db.openDb).mockResolvedValue(undefined as never);
  for (const fn of [db.setSetting, db.upsertFd, db.upsertRd, db.deleteFd, db.deleteRd, db.importAll, db.deleteAllData]) jest.mocked(fn).mockResolvedValue(undefined as never);
  jest.mocked(notifications.hasNotificationPermission).mockResolvedValue(true);
  jest.mocked(notifications.requestNotificationPermission).mockResolvedValue(true);
  for (const fn of [notifications.syncScheduledReminders, notifications.cancelAllReminders, notifications.displayCompletionNotification]) jest.mocked(fn).mockResolvedValue(undefined);
  jest.mocked(io.shareBackupFile).mockResolvedValue(undefined);
  jest.mocked(io.deleteBackupFile).mockResolvedValue(undefined);
  jest.mocked(io.writeBackupFile).mockResolvedValue('/cache/backup.json');
  mockWipe.mockResolvedValue(undefined);
  jest.spyOn(NativeAppState, 'addEventListener').mockImplementation((_event, handler) => {
    listeners.add(handler); return { remove: () => listeners.delete(handler) };
  });
});
afterEach(async () => { await cleanup(); expect(listeners.size).toBe(0); jest.clearAllTimers(); jest.useRealTimers(); jest.restoreAllMocks(); });

describe('APP: provider orchestration', () => {
  it('refreshes notification permission after returning from phone settings', async () => {
    jest.mocked(db.getSetting).mockImplementation(async key => key === 'remindersEnabled' ? 'true' : null);
    jest.mocked(notifications.hasNotificationPermission).mockResolvedValueOnce(false).mockResolvedValue(true);
    await mount();
    expect(state.notificationPermissionGranted).toBe(false);
    expect(notifications.syncScheduledReminders).toHaveBeenLastCalledWith([], expect.any(Object));
    await run(() => listeners.forEach(listener => listener('active')));
    expect(state.notificationPermissionGranted).toBe(true);
    expect(notifications.syncScheduledReminders).toHaveBeenLastCalledWith(expect.arrayContaining([
      expect.objectContaining({ title: 'FD001 maturity payout due today' }),
      expect.objectContaining({ title: 'RD001 maturity payout due today' }),
    ]), expect.any(Object));
  });
  it('APP-001 hydrates records and persisted preferences', async () => {
    jest.mocked(db.getSetting).mockImplementation(async key => ({ theme: 'dark', userName: 'Jane', remindersEnabled: 'true', reminderLeadDays: '7' }[key] ?? null));
    await mount();
    expect(state).toMatchObject({ hydrated: true, loadError: false, theme: 'dark', userName: 'Jane', reminderLeadDays: 7, remindersEnabled: true });
    expect(state.fdList[0].id).toBe('fd-1');
    expect(notifications.syncScheduledReminders).toHaveBeenCalled();
  });
  it('APP-002 load failure can be retried', async () => {
    jest.mocked(db.loadAll).mockRejectedValueOnce(new Error('read failure'));
    await mount(); expect(state.loadError).toBe(true);
    await run(() => actions.retryLoad()); expect(state.loadError).toBe(false);
  });
  it('APP-003 changes filters, tabs and resets filters', async () => {
    await mount();
    await run(() => { actions.setTab('portfolio'); actions.setPortfolioTabRD(); actions.setSearch('Jane'); actions.setFilterBank('Test Bank'); actions.setFilterType('Regular'); actions.setFilterStatus('Closed'); actions.setSortBy('amount'); actions.openFilterSheet(); });
    expect(state).toMatchObject({ activeTab: 'portfolio', portfolioTab: 'RD', search: 'Jane', sortBy: 'amount', filterSheetOpen: true });
    await run(() => actions.resetFilters());
    expect(state).toMatchObject({ search: '', filterBank: 'All', filterType: 'All', filterStatus: 'All', sortBy: 'maturity', filterSheetOpen: false });
    await run(() => { actions.setPortfolioTabFD(); actions.closeFilterSheet(); });
    expect(state.portfolioTab).toBe('FD');
  });
  it('APP-004 persists theme/name and updates calculator fields and detail toggles', async () => {
    await mount();
    await run(() => { actions.setThemeDark(); actions.setUserName('Jane'); actions.fcSet('principal')('123'); actions.rcSet('months')('6'); actions.toggleFdPayout(); actions.toggleFdRenewal(); actions.toggleFdStatements(); actions.toggleRdDetails(); });
    expect(db.setSetting).toHaveBeenCalledWith('theme', 'dark');
    expect(state).toMatchObject({ theme: 'dark', fdPayoutOpen: true, fdRenewalOpen: true, fdStatementsOpen: true, rdDetailsOpen: true });
    expect(state.fdCalc.principal).toBe('123'); expect(state.rdCalc.months).toBe('6');
    await run(() => actions.setThemeLight()); expect(state.theme).toBe('light');
  });
  it('APP-005 toast replacement resets expiration', async () => {
    await mount(); await run(() => actions.showToast('first'));
    await run(() => jest.advanceTimersByTime(2000));
    await run(() => actions.showToast('second'));
    await run(() => jest.advanceTimersByTime(600)); expect(state.toast).toBe('second');
    await run(() => jest.advanceTimersByTime(2000)); expect(state.toast).toBeNull();
  });
  it.each(['FD', 'RD'] as const)('APP-006 adds and edits %s with stored numeric fields', async kind => {
    await mount();
    await run(() => kind === 'FD' ? actions.openAddFD() : actions.openAddRD());
    await run(() => { actions.setDraftField('bankName', 'Synthetic Bank'); actions.setDraftField(kind === 'FD' ? 'principalAmount' : 'monthlyInstallment', '12345'); actions.setDraftField('interestRate', '7'); });
    await run(() => kind === 'FD' ? actions.saveDraftFD(null) : actions.saveDraftRD(null));
    const save = kind === 'FD' ? db.upsertFd : db.upsertRd;
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ bankName: 'Synthetic Bank', interestRate: 7, [kind === 'FD' ? 'principalAmount' : 'monthlyInstallment']: 12345 }));
    await run(() => kind === 'FD' ? actions.openEditFD('fd-1') : actions.openEditRD('rd-1'));
    await run(() => actions.setDraftField('remarks', 'edited'));
    await run(() => kind === 'FD' ? actions.saveDraftFD('fd-1') : actions.saveDraftRD('rd-1'));
    expect(save).toHaveBeenLastCalledWith(expect.objectContaining({ remarks: 'edited' }));
    expect(goBack).toHaveBeenCalled();
  });
  it.each(['FD', 'RD'] as const)('APP-007 missing %s draft cannot be saved', async kind => {
    await mount(); await run(() => kind === 'FD' ? actions.openEditFD('missing') : actions.openEditRD('missing'));
    await run(() => kind === 'FD' ? actions.saveDraftFD(null) : actions.saveDraftRD(null));
    expect(db.upsertFd).not.toHaveBeenCalled(); expect(db.upsertRd).not.toHaveBeenCalled();
  });
  it.each(['FD', 'RD'] as const)('APP-008 confirmation cancellation preserves %s', async kind => {
    await mount(); await run(() => actions.askConfirm('delete', kind, kind === 'FD' ? 'fd-1' : 'rd-1', 'Delete?', 'Sure?', 'Delete'));
    await run(() => actions.closeConfirm()); await run(() => actions.runConfirm());
    expect(state.confirmDialog).toBeNull(); expect(db.deleteFd).not.toHaveBeenCalled(); expect(db.deleteRd).not.toHaveBeenCalled();
  });
  it.each(['FD', 'RD'] as const)('APP-009 closes, renews and deletes %s', async kind => {
    await mount(); const id = kind === 'FD' ? 'fd-1' : 'rd-1';
    for (const action of ['close', 'premature', 'renew', 'delete'] as const) {
      await run(() => actions.askConfirm(action, kind, id, action, action, action));
      await run(() => actions.runConfirm());
      if (action === 'close' || action === 'premature') expect((kind === 'FD' ? state.fdList : state.rdList)[0].status).toBe(action === 'close' ? 'Closed' : 'Prematurely Closed');
      if (action === 'renew') {
        expect((kind === 'FD' ? state.fdList : state.rdList)[0].renewalCount).toBe(1);
        if (kind === 'RD') expect(state.rdList[0].installmentsPaid).toBe(0);
      }
    }
    expect(kind === 'FD' ? state.fdList : state.rdList).toEqual([]);
    expect(kind === 'FD' ? db.deleteFd : db.deleteRd).toHaveBeenCalledWith(id);
  });
  it('APP-010 denied reminders remain disabled; enabling/disabling and lead time persist', async () => {
    await mount(); jest.mocked(notifications.requestNotificationPermission).mockResolvedValueOnce(false);
    await run(async () => expect(await actions.setRemindersEnabled(true)).toBe(false));
    expect(state.remindersEnabled).toBe(false);
    await run(() => actions.setRemindersEnabled(true)); expect(state.remindersEnabled).toBe(true);
    await run(() => actions.setReminderLeadDays(14)); expect(db.setSetting).toHaveBeenCalledWith('reminderLeadDays', '14');
    await run(() => actions.setRemindersEnabled(false)); expect(notifications.cancelAllReminders).toHaveBeenCalled();
  });
  it('APP-011 export writes, shares and cleans up; failures reset busy state', async () => {
    await mount(); await timed(() => actions.exportBackup());
    expect(io.writeBackupFile).toHaveBeenCalledWith(expect.stringContaining('FD001'), expect.any(String));
    expect(io.shareBackupFile).toHaveBeenCalled(); expect(io.deleteBackupFile).toHaveBeenCalledWith('/cache/backup.json'); expect(state.exporting).toBe(false);
    jest.mocked(io.writeBackupFile).mockRejectedValueOnce(new Error('disk full'));
    await timed(() => actions.exportBackup()); expect(state.toast).toBe('Export failed — try again'); expect(state.exporting).toBe(false);
  });
  it('APP-012 encrypted export serializes encrypted payload', async () => {
    await mount(); jest.mocked(crypto.encryptBackupJson).mockResolvedValue({ ciphertext: 'secret' } as never);
    await timed(() => actions.exportBackup('passphrase'));
    expect(crypto.encryptBackupJson).toHaveBeenCalledWith(expect.any(String), 'passphrase');
    expect(io.writeBackupFile).toHaveBeenCalledWith('{"ciphertext":"secret"}', expect.any(String));
  });
  it('APP-013 import cancellation, malformed text and read failures clear busy state', async () => {
    await mount(); jest.mocked(io.pickBackupFileText).mockResolvedValueOnce(null);
    await run(() => actions.importBackup()); expect(state.confirmDialog).toBeNull(); expect(state.importing).toBe(false);
    jest.mocked(io.pickBackupFileText).mockResolvedValueOnce('not JSON'); await run(() => actions.importBackup()); expect(state.toast).toContain('valid FD/RD backup');
    jest.mocked(io.pickBackupFileText).mockRejectedValueOnce(new Error('read')); await run(() => actions.importBackup()); expect(state.toast).toBe('Could not read that file');
  });
  it.each(['overwrite', 'skip'] as const)('APP-014 import %s waits for confirmation and applies selected mode', async mode => {
    await mount(); jest.mocked(io.pickBackupFileText).mockResolvedValue(serializeBackup(buildBackupEnvelope([fd({ remarks: 'backup' }), fd({ id: 'fd-2', fdNumber: 'FD002' })], [], {})));
    await run(() => actions.importBackup()); expect(db.importAll).not.toHaveBeenCalled(); expect(state.confirmDialog?.secondaryLabel).toBe('Skip existing');
    await run(() => mode === 'overwrite' ? actions.runConfirm() : actions.runConfirmSecondary());
    expect(jest.mocked(db.importAll).mock.calls[0][0]).toHaveLength(mode === 'overwrite' ? 2 : 1);
    expect(state.importing).toBe(false);
  });
  it('APP-015 import transaction failure reports unchanged existing data', async () => {
    await mount(); jest.mocked(io.pickBackupFileText).mockResolvedValue(serializeBackup(buildBackupEnvelope([fd()], [], {})));
    await run(() => actions.importBackup()); jest.mocked(db.importAll).mockRejectedValueOnce(new Error('constraint'));
    await run(() => actions.runConfirm()); expect(state.toast).toContain('existing data was not changed'); expect(state.importing).toBe(false);
  });
  it('APP-016 encrypted import supports wrong-passphrase retry and cancellation', async () => {
    await mount(); jest.mocked(crypto.isEncryptedPayload).mockReturnValue(true); jest.mocked(io.pickBackupFileText).mockResolvedValue('{"ciphertext":"secret"}');
    await run(() => actions.importBackup()); expect(state.pendingEncryptedImportText).not.toBeNull();
    jest.mocked(crypto.decryptBackupJson).mockResolvedValueOnce(null); await timed(() => actions.submitImportPassphrase('wrong'));
    expect(state.passphraseError).toBe('Incorrect passphrase');
    jest.mocked(crypto.decryptBackupJson).mockResolvedValueOnce(serializeBackup(buildBackupEnvelope([fd()], [], {}))); await timed(() => actions.submitImportPassphrase('correct'));
    expect(state.pendingEncryptedImportText).toBeNull(); expect(state.confirmDialog?.action).toBe('import');
    await run(() => actions.cancelImportPassphrase()); expect(state.pendingEncryptedImportText).toBeNull();
  });
  it('APP-017 clear-all resets lock state and reloads; failures report error', async () => {
    await mount(); jest.mocked(db.loadAll).mockResolvedValue({ fds: [], rds: [] });
    await run(() => actions.clearAllData()); expect(mockWipe).toHaveBeenCalled(); expect(state.fdList).toEqual([]); expect(state.toast).toBe('All data deleted');
    jest.mocked(db.deleteAllData).mockRejectedValueOnce(new Error('disk')); await run(() => actions.clearAllData()); expect(state.toast).toBe('Delete failed — try again');
  });
  it('APP-018 maps action navigation to correct routes and IDs', async () => {
    await mount(); await run(() => { actions.openFDDetail('fd-1'); actions.openRDDetail('rd-1'); actions.goMaturityTimeline(); actions.goNotifications(); actions.goBackupRestore(); actions.goClearData(); actions.goSecurity(); actions.goPinSetup('change'); actions.goReminderSettings(); actions.openFdCalculator(); actions.openRdCalculator(); });
    expect(jest.mocked(navigate).mock.calls).toEqual([['FdDetail', { id: 'fd-1' }], ['RdDetail', { id: 'rd-1' }], ['MaturityTimeline'], ['Notifications'], ['BackupRestore'], ['ClearData'], ['Security'], ['PinSetup', { mode: 'change' }], ['Reminders'], ['FdCalculator'], ['RdCalculator']]);
  });
  it('BUG-003 foreground return recomputes time-dependent portfolio values', async () => {
    await mount(); const before = state.fdList[0].daysRemaining;
    jest.setSystemTime(new Date(2026, 5, 16, 12));
    await run(() => listeners.forEach(listener => listener('active')));
    expect(state.fdList[0].daysRemaining).toBe(before - 1);
  });
  it('BUG-004 failed save must not leave an unpersisted record in the portfolio', async () => {
    await mount(); await run(() => actions.openAddFD());
    await run(() => { actions.setDraftField('principalAmount', 10000); actions.setDraftField('bankName', 'Test Bank'); });
    jest.mocked(db.upsertFd).mockRejectedValueOnce(new Error('disk full'));
    await run(() => actions.saveDraftFD(null));
    expect(state.toast).toBe('Failed to save — try again'); expect(state.fdList).toHaveLength(1);
  });
  it('BUG-006 renewal uses the maturity date promised by the confirmation dialog', async () => {
    await mount(); const maturityDate = state.fdList[0].maturityDate;
    await run(() => actions.askConfirm('renew', 'FD', 'fd-1', 'Renew?', 'Renew from maturity', 'Renew'));
    await run(() => actions.runConfirm());
    expect(state.fdList[0].startDate).toBe(maturityDate);
    expect(db.upsertFd).toHaveBeenLastCalledWith(expect.objectContaining({ startDate: maturityDate }));
  });
  it('APP-019 foreground resynchronizes reminders and settings failures do not reject UI actions', async () => {
    jest.mocked(db.getSetting).mockImplementation(async key => key === 'remindersEnabled' ? 'true' : null);
    await mount(); jest.mocked(notifications.syncScheduledReminders).mockClear();
    await run(() => listeners.forEach(listener => listener('active'))); expect(notifications.syncScheduledReminders).toHaveBeenCalled();
    jest.mocked(db.setSetting).mockRejectedValueOnce(new Error('disk')); await run(() => actions.setThemeDark()); expect(state.theme).toBe('dark');
  });
  it('APP-020 import confirmation cancellation discards pending data', async () => {
    await mount(); jest.mocked(io.pickBackupFileText).mockResolvedValue(serializeBackup(buildBackupEnvelope([fd()], [], {})));
    await run(() => actions.importBackup()); await run(() => actions.closeConfirm());
    expect(state.pendingImport).toBeNull(); expect(state.confirmDialog).toBeNull(); expect(db.importAll).not.toHaveBeenCalled();
  });
});
