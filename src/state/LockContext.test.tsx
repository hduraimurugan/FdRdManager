import React from 'react';
import { AppState } from 'react-native';
import type { AppStateStatus } from 'react-native';
import { LockProvider, useLockState, useLockActions, LockActions } from './LockContext';
import * as db from '../data/db';
import * as security from '../data/security';
import * as bio from '../data/biometrics';
import { NOW } from '../../tests/support/fixtures';
import { render, cleanup, act } from '../../tests/support/renderer';
jest.mock('../data/db');
jest.mock('../data/security', () => ({ ...jest.requireActual('../data/security'), hashPin: jest.fn(), verifyPin: jest.fn(), parseStoredPin: jest.fn() }));
jest.mock('../data/biometrics');
let state: ReturnType<typeof useLockState>;
let actions: LockActions;
const listeners = new Set<(next: AppStateStatus) => void>();
const pin = { hash: '00'.repeat(32), salt: '11'.repeat(16), iterations: 100000 };
function Probe() { state = useLockState(); actions = useLockActions(); return null; }
async function mount(settings: Record<string, string> = {}) {
  jest.mocked(db.getSetting).mockImplementation(async key => settings[key] ?? null);
  return render(<LockProvider><Probe /></LockProvider>);
}
async function run(fn: () => unknown) { await act(async () => { await fn(); }); }
beforeEach(() => {
  jest.resetAllMocks(); jest.useFakeTimers(); jest.setSystemTime(NOW);
  jest.mocked(db.openDb).mockResolvedValue(undefined as never);
  jest.mocked(db.setSetting).mockResolvedValue(undefined);
  jest.mocked(security.hashPin).mockResolvedValue(pin as never);
  jest.mocked(security.parseStoredPin).mockReturnValue(pin as never);
  jest.mocked(security.verifyPin).mockImplementation(async candidate => candidate === '1234');
  jest.mocked(bio.isBiometricAvailable).mockResolvedValue({ available: true } as never);
  jest.mocked(bio.promptBiometric).mockResolvedValue(false);
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, handler) => { listeners.add(handler); return { remove: () => listeners.delete(handler) }; });
});
afterEach(async () => { await cleanup(); expect(listeners.size).toBe(0); jest.clearAllTimers(); jest.useRealTimers(); jest.restoreAllMocks(); });
describe('LOCK: security provider', () => {
  it('LOCK-001 fresh install starts unlocked, configured install starts locked', async () => {
    jest.mocked(security.parseStoredPin).mockReturnValue(null); await mount(); expect(state.status).toBe('unlocked');
    await cleanup(); jest.mocked(security.parseStoredPin).mockReturnValue(pin as never);
    await mount({ lockEnabled: 'true', biometricEnabled: 'true', lockGraceSeconds: '30' });
    expect(state).toMatchObject({ status: 'locked', pinConfigured: true, biometricAvailable: true, biometricEnabled: true, graceSeconds: 30 });
  });
  it('LOCK-002 invalid setup is rejected without hashing or persistence', async () => {
    await mount(); await run(async () => expect((await actions.setupPin('abc')).ok).toBe(false));
    expect(security.hashPin).not.toHaveBeenCalled(); expect(db.setSetting).not.toHaveBeenCalled();
  });
  it('LOCK-003 setup stores only serialized hash and enables lock', async () => {
    await mount(); await run(async () => expect(await actions.setupPin('1234')).toEqual({ ok: true }));
    expect(db.setSetting).toHaveBeenCalledWith('lockEnabled', 'true');
    expect(jest.mocked(db.setSetting).mock.calls.find(([key]) => key === 'pinAuth')?.[1]).not.toContain('1234');
    expect(state.pinConfigured).toBe(true);
  });
  it('LOCK-004 changing PIN verifies current PIN and validates new format', async () => {
    await mount(); await run(async () => expect((await actions.changePin('wrong', '5678')).ok).toBe(false));
    await run(async () => expect((await actions.changePin('1234', 'abc')).ok).toBe(false));
    await run(async () => expect((await actions.changePin('1234', '5678')).ok).toBe(true));
    expect(security.hashPin).toHaveBeenCalledTimes(1); expect(security.hashPin).toHaveBeenCalledWith('5678');
  });
  it('LOCK-005 disable requires correct PIN and clears biometric preference', async () => {
    await mount({ lockEnabled: 'true', biometricEnabled: 'true' });
    await run(async () => expect(await actions.disableLock('wrong')).toBe(false)); expect(state.lockEnabled).toBe(true);
    await run(async () => expect(await actions.disableLock('1234')).toBe(true));
    expect(state).toMatchObject({ pinConfigured: false, lockEnabled: false, biometricEnabled: false });
    expect(db.setSetting).toHaveBeenCalledWith('pinAuth', '');
  });
  it('LOCK-006 wrong attempts trigger lockout, successful PIN clears attempts', async () => {
    await mount({ lockEnabled: 'true' });
    for (let i = 0; i < 5; i++) await run(() => actions.unlockWithPin('wrong'));
    expect(state.failedAttempts).toBe(5); expect(actions.lockoutSecondsRemaining()).toBeGreaterThan(0);
    const calls = jest.mocked(security.verifyPin).mock.calls.length;
    await run(async () => expect(await actions.unlockWithPin('1234')).toBe(false)); expect(security.verifyPin).toHaveBeenCalledTimes(calls);
    await run(() => jest.advanceTimersByTime(301000));
    await run(async () => expect(await actions.unlockWithPin('1234')).toBe(true));
    expect(state).toMatchObject({ status: 'unlocked', failedAttempts: 0, lockoutUntil: null });
  });
  it('LOCK-007 persisted lockout survives hydration', async () => {
    await mount({ lockEnabled: 'true', pinFailedAttempts: '7', pinLockoutUntil: String(NOW.getTime() + 60000) });
    expect(state.failedAttempts).toBe(7); expect(actions.lockoutSecondsRemaining()).toBe(60);
    await run(() => actions.unlockWithPin('1234')); expect(security.verifyPin).not.toHaveBeenCalled();
  });
  it('LOCK-008 biometric cancellation preserves counters, success unlocks', async () => {
    await mount({ lockEnabled: 'true', biometricEnabled: 'true', pinFailedAttempts: '2' });
    await run(() => actions.unlockWithBiometric()); expect(state).toMatchObject({ status: 'locked', failedAttempts: 2 });
    jest.mocked(bio.promptBiometric).mockResolvedValueOnce(true); await run(() => actions.unlockWithBiometric()); expect(state.status).toBe('unlocked');
  });
  it.each([29999, 30000])('LOCK-009 grace boundary at %i milliseconds', async elapsed => {
    await mount({ lockEnabled: 'true', lockGraceSeconds: '30' }); await run(() => actions.unlockWithPin('1234'));
    await run(() => listeners.forEach(listener => listener('background')));
    await run(() => jest.advanceTimersByTime(elapsed));
    await run(() => listeners.forEach(listener => listener('active')));
    expect(state.status).toBe(elapsed < 30000 ? 'unlocked' : 'locked');
  });
  it('LOCK-010 persists preferences and resets lock state after external wipe', async () => {
    await mount({ lockEnabled: 'true' }); await run(() => { actions.setGraceSeconds(60); actions.setBiometricEnabled(true); });
    expect(db.setSetting).toHaveBeenCalledWith('lockGraceSeconds', '60'); expect(db.setSetting).toHaveBeenCalledWith('biometricEnabled', 'true');
    await run(() => actions.refreshAfterExternalWipe()); expect(state).toMatchObject({ pinConfigured: false, lockEnabled: false, biometricEnabled: false, failedAttempts: 0 });
  });
  it('LOCK-011 reports unavailable biometrics and propagates failed PIN persistence', async () => {
    jest.mocked(bio.isBiometricAvailable).mockResolvedValue({ available: false } as never); await mount(); expect(state.biometricAvailable).toBe(false);
    jest.mocked(db.setSetting).mockRejectedValueOnce(new Error('disk full'));
    await run(async () => { await expect(actions.setupPin('1234')).rejects.toThrow('disk full'); });
  });
  it('BUG-005 inactive then background must preserve the original grace-period start', async () => {
    await mount({ lockEnabled: 'true', lockGraceSeconds: '30' }); await run(() => actions.unlockWithPin('1234'));
    await run(() => listeners.forEach(listener => listener('inactive'))); await run(() => jest.advanceTimersByTime(20000));
    await run(() => listeners.forEach(listener => listener('background'))); await run(() => jest.advanceTimersByTime(15000));
    await run(() => listeners.forEach(listener => listener('active'))); expect(state.status).toBe('locked');
  });
});
