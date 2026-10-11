# Test Execution Report

Date: 2026-10-11 (Asia/Calcutta). Revision: `7cd8954bc845b89b6ffd9cca38a9201caea6ab53` plus testing-only working-tree changes.

Environment: Windows/PowerShell; Node v24.12.0; npm 11.7.0; Jest 29; React Native preset; SQLite adapter backed by better-sqlite3. Shared synthetic fixture clock: 15 June 2026, local noon.

## Baseline versus expanded suite

| Run | Suites | Passed tests | Failed tests | Skipped / todo | Total tests |
|---|---|---|---|---|---|
| Verified pre-change baseline | 11 passed | 148 | 0 | 0 | 148 |
| Expanded full run | 17 passed / 5 failed | 317 | 8 | 0 / 0 | 325 |

Full run command: `npm test -- --runInBand --watch=false --coverage --json --outputFile=coverage/test-results.json`. Exit status: 1. No production bugs were fixed.

Execution duration: 70.55 seconds summed across suite durations (not wall-clock).

## Static checks and supplemental evidence

| Check / command | Result |
|---|---|
| `node node_modules/typescript/bin/tsc --noEmit` | Passed (exit 0) |
| `npm run lint -- --quiet` | Passed (exit 0) |
| timezone-kolkata.json | 46 passed / 0 failed / 0 skipped |
| timezone-los-angeles.json | 46 passed / 0 failed / 0 skipped |
| repeat-results.json | 107 passed / 5 failed / 0 skipped |

Repeat run verifies the same lifecycle/UI cases with isolated mocks, fixed clocks and unmount cleanup. Provider tests assert AppState subscriptions are removed; the harness clears its fake timers. Timezone runs start separate Node/Jest processes with TZ set before loading modules.

## Failures

| Bug | Regression | Evidence |
|---|---|---|
| BUG-001 | DER: derived records BUG-001 future RD has no installments due before its start | [src/data/derive.test.ts](../../src/data/derive.test.ts) |
| BUG-002 | DER: derived records BUG-002 month-end RD installment is due on its clamped date | [src/data/derive.test.ts](../../src/data/derive.test.ts) |
| BUG-008 | BUG-008 overflowing principal or installment must fail validation | [src/data/validation.boundaries.test.ts](../../src/data/validation.boundaries.test.ts) |
| BUG-007 | UI user interactions BUG-007 matured FD offers renewal for its pending renewal decision | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) |
| BUG-003 | APP: provider orchestration BUG-003 foreground return recomputes time-dependent portfolio values | [src/state/AppContext.test.tsx](../../src/state/AppContext.test.tsx) |
| BUG-004 | APP: provider orchestration BUG-004 failed save must not leave an unpersisted record in the portfolio | [src/state/AppContext.test.tsx](../../src/state/AppContext.test.tsx) |
| BUG-006 | APP: provider orchestration BUG-006 renewal uses the maturity date promised by the confirmation dialog | [src/state/AppContext.test.tsx](../../src/state/AppContext.test.tsx) |
| BUG-005 | LOCK: security provider BUG-005 inactive then background must preserve the original grace-period start | [src/state/LockContext.test.tsx](../../src/state/LockContext.test.tsx) |

Unexpected/test-harness failures in final full run: **0**. Confirmed bug failures remain intentionally visible and are linked in [BUG_REPORT.md](BUG_REPORT.md). A nonzero Jest exit is expected until those defects are fixed.

## Device status and unfinished validation

Read-only ADB discovery found a connected Redmi 8 running Android 16 / API 36, with com.fdrdmanager installed. This does not establish that its installed build matches this revision. No app data, device clock, settings, installed APK or native project files were changed.

Manual Android cases: **25 not run**. Native acceptance requires a disposable profile/test build and execution of [TEST_CASES.md](TEST_CASES.md); no device pass is claimed from mocks or device discovery. iOS: **1 checklist entry unverified / not run** because this host is Windows.

Build/install tests were not run. Dependency installation was unnecessary; no package dependency changes were made. The pre-existing package-lock.json modification was preserved.

## Reproduce

```powershell
npm test -- --runInBand --watch=false --coverage --json --outputFile=coverage/test-results.json
node node_modules/typescript/bin/tsc --noEmit
npm run lint -- --quiet
python tests/report.py
```

The generator reads saved coverage/check-results.json for static-check outcomes; rerunning it alone does not rerun checks. Run the checks first and refresh that evidence if the code changes. Detailed test results and metrics are retained in ignored coverage/; all cases and source modules are listed in the other Markdown reports.

