// App-lock state: PIN + optional biometric gate shown in front of the whole app.
// Deliberately a separate context from AppContext (portfolio data) — lock state doesn't
// depend on FD/RD data and has its own independent action set, matching how
// ThemeContext is already kept separate. Mounted above AppProvider in App.tsx so it can
// gate rendering of the entire app, including before portfolio data has hydrated.

import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { getSetting, setSetting, openDb } from '../data/db';
import { hashPin, verifyPin, validatePinFormat, serializeStoredPin, parseStoredPin, lockoutDelaySeconds, StoredPin } from '../data/security';
import { isBiometricAvailable, promptBiometric } from '../data/biometrics';

const PIN_KEY = 'pinAuth';
const LOCK_ENABLED_KEY = 'lockEnabled';
const BIOMETRIC_ENABLED_KEY = 'biometricEnabled';
const LOCK_GRACE_KEY = 'lockGraceSeconds';
const FAILED_ATTEMPTS_KEY = 'pinFailedAttempts';
const LOCKOUT_UNTIL_KEY = 'pinLockoutUntil';

export const GRACE_PERIOD_OPTIONS = [0, 30, 60, 300] as const;

/** 'checking' avoids ever flashing unlocked content while settings are still loading —
 * Root() renders a blank view for 'checking', not the real app. */
export type LockStatus = 'checking' | 'locked' | 'unlocked';

interface LockState {
  status: LockStatus;
  pinConfigured: boolean;
  lockEnabled: boolean;
  biometricEnabled: boolean;
  biometricAvailable: boolean;
  graceSeconds: number;
  failedAttempts: number;
  lockoutUntil: number | null;
}

const initialState: LockState = {
  status: 'checking',
  pinConfigured: false,
  lockEnabled: false,
  biometricEnabled: false,
  biometricAvailable: false,
  graceSeconds: 0,
  failedAttempts: 0,
  lockoutUntil: null,
};

type Action =
  | { type: 'HYDRATE'; pinConfigured: boolean; lockEnabled: boolean; biometricEnabled: boolean; biometricAvailable: boolean; graceSeconds: number; failedAttempts: number; lockoutUntil: number | null }
  | { type: 'SET_STATUS'; status: LockStatus }
  | { type: 'SET_PIN_CONFIGURED'; configured: boolean; lockEnabled: boolean }
  | { type: 'SET_LOCK_ENABLED'; enabled: boolean }
  | { type: 'SET_BIOMETRIC_ENABLED'; enabled: boolean }
  | { type: 'SET_GRACE'; seconds: number }
  | { type: 'SET_ATTEMPTS'; failedAttempts: number; lockoutUntil: number | null };

function reducer(state: LockState, action: Action): LockState {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, ...action, status: action.lockEnabled && action.pinConfigured ? 'locked' : 'unlocked' };
    case 'SET_STATUS':
      return { ...state, status: action.status };
    case 'SET_PIN_CONFIGURED':
      return { ...state, pinConfigured: action.configured, lockEnabled: action.lockEnabled };
    case 'SET_LOCK_ENABLED':
      return { ...state, lockEnabled: action.enabled };
    case 'SET_BIOMETRIC_ENABLED':
      return { ...state, biometricEnabled: action.enabled };
    case 'SET_GRACE':
      return { ...state, graceSeconds: action.seconds };
    case 'SET_ATTEMPTS':
      return { ...state, failedAttempts: action.failedAttempts, lockoutUntil: action.lockoutUntil };
    default:
      return state;
  }
}

export interface LockActions {
  /** Sets up a PIN for the first time and turns the lock on. Rejects with a validation
   * message if the PIN format is invalid. */
  setupPin: (pin: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  /** Requires the current PIN, matching how disabling any device security feature
   * normally works — otherwise anyone holding an already-unlocked phone could turn
   * future protection off without ever knowing the code. */
  disableLock: (currentPin: string) => Promise<boolean>;
  changePin: (currentPin: string, newPin: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  setBiometricEnabled: (enabled: boolean) => void;
  setGraceSeconds: (seconds: number) => void;
  /** Returns the number of seconds still remaining if locked out, or 0 if an attempt is
   * allowed right now. */
  lockoutSecondsRemaining: () => number;
  unlockWithPin: (pin: string) => Promise<boolean>;
  unlockWithBiometric: () => Promise<boolean>;
  /** Called after AppContext's "delete all data" wipes the whole settings table —
   * re-syncs this context's state with what's actually left (nothing). */
  refreshAfterExternalWipe: () => Promise<void>;
}

const StateContext = createContext<LockState>(initialState);
const ActionsContext = createContext<LockActions | null>(null);

async function readLockSettings() {
  const [pinRaw, lockEnabledRaw, biometricEnabledRaw, graceRaw, attemptsRaw, lockoutRaw, biometric] = await Promise.all([
    getSetting(PIN_KEY),
    getSetting(LOCK_ENABLED_KEY),
    getSetting(BIOMETRIC_ENABLED_KEY),
    getSetting(LOCK_GRACE_KEY),
    getSetting(FAILED_ATTEMPTS_KEY),
    getSetting(LOCKOUT_UNTIL_KEY),
    isBiometricAvailable(),
  ]);
  const storedPin = parseStoredPin(pinRaw);
  return {
    storedPin,
    pinConfigured: storedPin !== null,
    lockEnabled: lockEnabledRaw === 'true',
    biometricEnabled: biometricEnabledRaw === 'true',
    biometricAvailable: biometric.available,
    graceSeconds: Number(graceRaw) || 0,
    failedAttempts: Number(attemptsRaw) || 0,
    lockoutUntil: lockoutRaw ? Number(lockoutRaw) : null,
  };
}

export function LockProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;
  const storedPinRef = useRef<StoredPin | null>(null);
  const backgroundedAtRef = useRef<number | null>(null);

  const hydrate = useCallback(async () => {
    await openDb();
    const settings = await readLockSettings();
    storedPinRef.current = settings.storedPin;
    dispatch({
      type: 'HYDRATE',
      pinConfigured: settings.pinConfigured,
      lockEnabled: settings.lockEnabled,
      biometricEnabled: settings.biometricEnabled,
      biometricAvailable: settings.biometricAvailable,
      graceSeconds: settings.graceSeconds,
      failedAttempts: settings.failedAttempts,
      lockoutUntil: settings.lockoutUntil,
    });
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Lock-on-background: record when the app leaves the foreground, and re-lock on
  // return only once the configured grace period has elapsed — a quick switch to
  // another app to copy a number, say, doesn't force a full re-unlock.
  useEffect(() => {
    const onChange = (next: AppStateStatus) => {
      if (next === 'background' || next === 'inactive') {
        // Inactive and background belong to the same time away from the foreground.
        if (backgroundedAtRef.current === null) backgroundedAtRef.current = Date.now();
      } else if (next === 'active') {
        const { lockEnabled, pinConfigured, status, graceSeconds } = stateRef.current;
        const backgroundedAt = backgroundedAtRef.current;
        backgroundedAtRef.current = null;
        if (!lockEnabled || !pinConfigured || status === 'checking') return;
        if (backgroundedAt === null) return;
        const elapsedSeconds = (Date.now() - backgroundedAt) / 1000;
        if (elapsedSeconds >= graceSeconds) {
          dispatch({ type: 'SET_STATUS', status: 'locked' });
        }
      }
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, []);

  const actions = useMemo<LockActions>(() => ({
    setupPin: async pin => {
      const formatError = validatePinFormat(pin);
      if (formatError) return { ok: false, error: formatError };
      const stored = await hashPin(pin);
      storedPinRef.current = stored;
      await Promise.all([setSetting(PIN_KEY, serializeStoredPin(stored)), setSetting(LOCK_ENABLED_KEY, 'true')]);
      dispatch({ type: 'SET_PIN_CONFIGURED', configured: true, lockEnabled: true });
      return { ok: true };
    },
    disableLock: async currentPin => {
      const stored = storedPinRef.current;
      if (!stored || !(await verifyPin(currentPin, stored))) return false;
      storedPinRef.current = null;
      await Promise.all([
        setSetting(PIN_KEY, ''),
        setSetting(LOCK_ENABLED_KEY, 'false'),
        setSetting(BIOMETRIC_ENABLED_KEY, 'false'),
        setSetting(FAILED_ATTEMPTS_KEY, '0'),
        setSetting(LOCKOUT_UNTIL_KEY, ''),
      ]);
      dispatch({ type: 'SET_PIN_CONFIGURED', configured: false, lockEnabled: false });
      dispatch({ type: 'SET_BIOMETRIC_ENABLED', enabled: false });
      return true;
    },
    changePin: async (currentPin, newPin) => {
      const stored = storedPinRef.current;
      if (!stored || !(await verifyPin(currentPin, stored))) return { ok: false, error: 'Current PIN is incorrect' };
      const formatError = validatePinFormat(newPin);
      if (formatError) return { ok: false, error: formatError };
      const next = await hashPin(newPin);
      storedPinRef.current = next;
      await setSetting(PIN_KEY, serializeStoredPin(next));
      return { ok: true };
    },
    setBiometricEnabled: enabled => {
      dispatch({ type: 'SET_BIOMETRIC_ENABLED', enabled });
      setSetting(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false').catch(() => {});
    },
    setGraceSeconds: seconds => {
      dispatch({ type: 'SET_GRACE', seconds });
      setSetting(LOCK_GRACE_KEY, String(seconds)).catch(() => {});
    },
    lockoutSecondsRemaining: () => {
      const { lockoutUntil } = stateRef.current;
      if (!lockoutUntil) return 0;
      return Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000));
    },
    unlockWithPin: async pin => {
      const existingLockoutUntil = stateRef.current.lockoutUntil;
      if (existingLockoutUntil && existingLockoutUntil > Date.now()) return false;
      const stored = storedPinRef.current;
      const correct = !!stored && (await verifyPin(pin, stored));
      if (correct) {
        dispatch({ type: 'SET_ATTEMPTS', failedAttempts: 0, lockoutUntil: null });
        setSetting(FAILED_ATTEMPTS_KEY, '0').catch(() => {});
        setSetting(LOCKOUT_UNTIL_KEY, '').catch(() => {});
        dispatch({ type: 'SET_STATUS', status: 'unlocked' });
        return true;
      }
      const failedAttempts = stateRef.current.failedAttempts + 1;
      const delay = lockoutDelaySeconds(failedAttempts);
      const lockoutUntil = delay > 0 ? Date.now() + delay * 1000 : null;
      dispatch({ type: 'SET_ATTEMPTS', failedAttempts, lockoutUntil });
      setSetting(FAILED_ATTEMPTS_KEY, String(failedAttempts)).catch(() => {});
      setSetting(LOCKOUT_UNTIL_KEY, lockoutUntil ? String(lockoutUntil) : '').catch(() => {});
      return false;
    },
    unlockWithBiometric: async () => {
      // A failed/cancelled biometric scan (bad lighting, wrong finger) isn't a
      // brute-force attempt, so it never touches the PIN lockout counter.
      const ok = await promptBiometric('Unlock FD/RD Manager');
      if (ok) dispatch({ type: 'SET_STATUS', status: 'unlocked' });
      return ok;
    },
    refreshAfterExternalWipe: async () => {
      storedPinRef.current = null;
      dispatch({ type: 'SET_PIN_CONFIGURED', configured: false, lockEnabled: false });
      dispatch({ type: 'SET_BIOMETRIC_ENABLED', enabled: false });
      dispatch({ type: 'SET_ATTEMPTS', failedAttempts: 0, lockoutUntil: null });
    },
  }), []);

  return (
    <StateContext.Provider value={state}>
      <ActionsContext.Provider value={actions}>{children}</ActionsContext.Provider>
    </StateContext.Provider>
  );
}

export function useLockState(): LockState {
  return useContext(StateContext);
}

export function useLockActions(): LockActions {
  const ctx = useContext(ActionsContext);
  if (!ctx) throw new Error('useLockActions must be used within LockProvider');
  return ctx;
}
