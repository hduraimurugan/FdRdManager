# Bug Report

Snapshot: 2026-10-11. Status: **BUG-005, BUG-006, BUG-007 and BUG-008 fixed; other fixes deferred**. Original findings were reproduced by automated tests against unmodified application source, not by native device execution.

Severity: High = data reliability/security/business outcome; Medium = incorrect validation, schedule or blocked workflow. These are review priorities, not proof of exploitation.

## Confirmed defects

| ID | Severity | Title | Status |
|---|---|---|---|
| BUG-001 | Medium | Future RD incorrectly has an installment due | Confirmed; failing regression; fix deferred |
| BUG-002 | Medium | Month-end RD installment count lags its clamped schedule | Confirmed; failing regression; fix deferred |
| BUG-003 | High | Portfolio values remain stale after foreground return | Confirmed; failing regression; fix deferred |
| BUG-004 | High | Failed save leaves an unpersisted deposit visible | Confirmed; failing regression; fix deferred |
| BUG-005 | High | Inactive-to-background transition restarts lock grace timer | Fixed; regression passing |
| BUG-006 | High | FD renewal starts today instead of the promised maturity date | Fixed; regression passing |
| BUG-007 | Medium | Matured FD has no renewal action | Fixed; regression passing |
| BUG-008 | Medium | Overflowing amount passes form validation | Fixed; regression passing |

## BUG-001: Future RD incorrectly has an installment due

- Severity: **Medium**. Status: open, fix deferred.
- Source: [src/data/derive.ts](../../src/data/derive.ts), line 119 (`export function computeInstallmentsDue`).
- Executable regression: [src/data/derive.test.ts](../../src/data/derive.test.ts); filter with `npm test -- --runInBand --testNamePattern=BUG-001`.
- Preconditions and steps: Freeze local date at 15 June 2026. Calculate installments due for an RD starting 1 July 2026 with 12 installments.
- Expected: 0 installments due before the first installment date.
- Actual/evidence: 1 installment due.
- Reproduction layer: Jest unit/provider/renderer test; native device reproduction pending.

## BUG-002: Month-end RD installment count lags its clamped schedule

- Severity: **Medium**. Status: open, fix deferred.
- Source: [src/data/derive.ts](../../src/data/derive.ts), line 112 (`function monthsElapsed`).
- Executable regression: [src/data/derive.test.ts](../../src/data/derive.test.ts); filter with `npm test -- --runInBand --testNamePattern=BUG-002`.
- Preconditions and steps: Create a 12-month RD starting 31 January 2026. Calculate installments due on 28 February 2026.
- Expected: 2 installments due: 31 January and the clamped 28 February date.
- Actual/evidence: Only 1 installment due.
- Reproduction layer: Jest unit/provider/renderer test; native device reproduction pending.

## BUG-003: Portfolio values remain stale after foreground return

- Severity: **High**. Status: open, fix deferred.
- Source: [src/state/AppContext.tsx](../../src/state/AppContext.tsx), line 982 (`export function useAppState`).
- Executable regression: [src/state/AppContext.test.tsx](../../src/state/AppContext.test.tsx); filter with `npm test -- --runInBand --testNamePattern=BUG-003`.
- Preconditions and steps: Hydrate the synthetic FD on 15 June 2026. Advance the clock one day without changing records and emit the active AppState event.
- Expected: Days remaining changes from 200 to 199, with derivations refreshed.
- Actual/evidence: Days remaining remains 200. Memoization depends on raw record arrays, not the date.
- Reproduction layer: Jest unit/provider/renderer test; native device reproduction pending.

## BUG-004: Failed save leaves an unpersisted deposit visible

- Severity: **High**. Status: open, fix deferred.
- Source: [src/state/AppContext.tsx](../../src/state/AppContext.tsx), line 820 (`saveDraftFD: id =>`).
- Executable regression: [src/state/AppContext.test.tsx](../../src/state/AppContext.test.tsx); filter with `npm test -- --runInBand --testNamePattern=BUG-004`.
- Preconditions and steps: Hydrate one FD, open Add FD, fill a synthetic principal/bank, reject upsertFd with disk-full, then save.
- Expected: Failure feedback and only the original persisted FD remain; unsaved data remains recoverable.
- Actual/evidence: Failure toast appears, but the portfolio contains 2 FDs. The new record was dispatched before the write succeeded.
- Reproduction layer: Jest unit/provider/renderer test; native device reproduction pending.

## BUG-005: Inactive-to-background transition restarts lock grace timer

- Severity: **High**. Status: fixed on 2026-10-11.
- Source: [src/state/LockContext.tsx](../../src/state/LockContext.tsx), line 157 (`if (next === 'background' || next === 'inactive')`).
- Executable regression: [src/state/LockContext.test.tsx](../../src/state/LockContext.test.tsx); filter with `npm test -- --runInBand --testNamePattern=BUG-005`.
- Preconditions and steps: Unlock with 30-second grace. Emit inactive, wait 20 seconds, emit background, wait 15 seconds, then emit active.
- Expected: Lock after 35 seconds away from the foreground.
- Original actual/evidence: Remained unlocked because only 15 seconds since background were counted.
- Fix: Record the first inactive/background timestamp and preserve it through subsequent non-foreground transitions. Clear the timestamp on every active return so each later absence gets its own grace period.
- Verification: All 16 lock-provider tests pass, including the original 35-second scenario, repeated background events, the 30-second boundary and separate foreground/absence cycles. Targeted ESLint passes.
- Reproduction layer: Jest unit/provider/renderer test; native device reproduction pending.

## BUG-006: FD renewal starts today instead of the promised maturity date

- Severity: **High**. Status: fixed on 2026-10-11.
- Source: [src/state/AppContext.tsx](../../src/state/AppContext.tsx), renewal branch of `runConfirm`.
- Executable regression: [src/state/AppContext.test.tsx](../../src/state/AppContext.test.tsx); filter with `npm test -- --runInBand --testNamePattern=BUG-006`.
- Preconditions and steps: On 15 June 2026, renew an FD maturing 1 January 2027 through the renewal confirmation action. The detail dialog promises renewal from maturity.
- Expected: Renewed start date is 1 January 2027.
- Original actual/evidence: Renewed start date was 15 June 2026, shortening/replacing the current term.
- Fix: FD renewal computes the existing maturity date from the stored start date and tenure, then uses it as the new start date in both reducer state and persistence. Tenure is preserved and renewal count increments once. Matured FDs also renew from their previous maturity date.
- Verification: All 3 BUG-006 regressions pass, covering active/matured FDs, month-end clamping with extra days, derived next maturity, persisted fields and reload. Targeted ESLint passes. The broader provider/screen run has 104 passing tests and 1 failure from the existing BUG-004 failed-save defect.
- Reproduction layer: Jest unit/provider/renderer test; native device reproduction pending.

## BUG-007: Matured FD has no renewal action

- Severity: **Medium**. Status: fixed on 2026-10-11.
- Source: [src/screens/FdDetailScreen.tsx](../../src/screens/FdDetailScreen.tsx), line 39 (`const canRenew`).
- Executable regression: [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx); filter with `npm test -- --runInBand --testNamePattern=BUG-007`.
- Preconditions and steps: Render FD detail on 15 June 2026 for a one-year FD starting 1 January 2025.
- Expected: A renewal action is available for the matured deposit with a pending renewal decision.
- Original actual/evidence: Renew button was absent because only Active FDs could renew.
- Fix: The Renew action is available for Active and Matured FDs and opens the existing renewal confirmation for the selected record. Closed and Prematurely Closed FDs remain ineligible.
- Verification: All 74 screen tests pass, including matured/active renewal confirmation and closed-status exclusion regressions. Targeted ESLint reports 0 errors and 4 existing warnings. The separate renewal start-date defect (BUG-006) is now fixed.
- Reproduction layer: Jest unit/provider/renderer test; native device reproduction pending.

## BUG-008: Overflowing amount passes form validation

- Severity: **Medium**. Status: fixed on 2026-10-11.
- Source: [src/data/validation.ts](../../src/data/validation.ts), line 32 (`const principal = toNumber`).
- Executable regression: [src/data/validation.boundaries.test.ts](../../src/data/validation.boundaries.test.ts); filter with `npm test -- --runInBand --testNamePattern=BUG-008`.
- Preconditions and steps: Validate an otherwise valid FD draft whose principalAmount is the numeric string 1e309.
- Expected: Amount validation error because the parsed amount is Infinity.
- Original actual/evidence: No principal validation error. The validator checked NaN and positivity, not finiteness. The RD path had the same check, but its subsequent assertion was not reached in the original failing test.
- Fix: FD principal and RD monthly installment validation now require `Number.isFinite`, returning `Enter a valid amount` for overflowing and other non-finite amounts.
- Verification: Both validation suites pass (35 tests); targeted ESLint passes. Independent FD and RD regressions cover positive/negative overflow, Infinity strings and values, and NaN; finite positive amounts remain accepted.
- Reproduction layer: Jest unit/provider/renderer test; native device reproduction pending.

## Suspected issues requiring additional confirmation

- OS permission revocation may leave the in-memory permission flag stale until a reload; execute AND-009 before classifying it as a confirmed device defect.
- Restoring PIN/lock settings may require lock-provider rehydration; verify restore and restart on a disposable profile before reporting a confirmed security-state issue.

## Harness/environment findings

- Final unexpected harness failures: 0. Initial test-authoring failures (text traversal, timer setup and type annotations) were corrected in tests only and are not product bugs.
- Native/manual validation remains not run; no native-platform defect is asserted from missing execution.

## Existing documented limitations

- RD payments are recorded manually; FD payouts are schedule-based rather than receipt-tracked.
- Reminders may not fire after reboot unless the app is reopened to resynchronize.
- The SQLite database is not encrypted at rest; app lock protects the UI.

BUG-005 lock grace timing, BUG-006 renewal start date, BUG-007 renewal action visibility and BUG-008 application validation are fixed with expanded regression coverage. Other confirmed defects remain deferred; no migrations or expectation changes to conceal failures were made.

