"""Generate reviewable testing reports from Jest evidence. No application changes.

Run after Jest: python tests/report.py
Inputs live in ignored coverage/; Markdown snapshots live in docs/testing/.
"""
import hashlib
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs' / 'testing'
DATE = '2026-10-11'
COMMAND = 'npm test -- --runInBand --watch=false --coverage --json --outputFile=coverage/test-results.json'


def read(name):
    return json.loads((ROOT / 'coverage' / name).read_text(encoding='utf-8'))


def relative(name):
    return Path(name).resolve().relative_to(ROOT).as_posix()


def link(name):
    return f'[{name}](../../{name})'


def table_cell(text):
    return str(text).replace('|', '\\|').replace('\n', ' ')


def write(name, lines):
    (OUT / name).write_text('\n'.join(lines) + '\n', encoding='utf-8')


# Title, severity, source, source symbol, executable test, steps, expected, actual.
BUGS = [
    ('BUG-001', 'Future RD incorrectly has an installment due', 'Medium', 'src/data/derive.ts', 'export function computeInstallmentsDue', 'src/data/derive.test.ts',
     'Freeze local date at 15 June 2026. Calculate installments due for an RD starting 1 July 2026 with 12 installments.', '0 installments due before the first installment date.', '1 installment due.'),
    ('BUG-002', 'Month-end RD installment count lags its clamped schedule', 'Medium', 'src/data/derive.ts', 'function monthsElapsed', 'src/data/derive.test.ts',
     'Create a 12-month RD starting 31 January 2026. Calculate installments due on 28 February 2026.', '2 installments due: 31 January and the clamped 28 February date.', 'Only 1 installment due.'),
    ('BUG-003', 'Portfolio values remain stale after foreground return', 'High', 'src/state/AppContext.tsx', 'export function useAppState', 'src/state/AppContext.test.tsx',
     'Hydrate the synthetic FD on 15 June 2026. Advance the clock one day without changing records and emit the active AppState event.', 'Days remaining changes from 200 to 199, with derivations refreshed.', 'Days remaining remains 200. Memoization depends on raw record arrays, not the date.'),
    ('BUG-004', 'Failed save leaves an unpersisted deposit visible', 'High', 'src/state/AppContext.tsx', 'saveDraftFD: id =>', 'src/state/AppContext.test.tsx',
     'Hydrate one FD, open Add FD, fill a synthetic principal/bank, reject upsertFd with disk-full, then save.', 'Failure feedback and only the original persisted FD remain; unsaved data remains recoverable.', 'Failure toast appears, but the portfolio contains 2 FDs. The new record was dispatched before the write succeeded.'),
    ('BUG-005', 'Inactive-to-background transition restarts lock grace timer', 'High', 'src/state/LockContext.tsx', "if (next === 'background' || next === 'inactive')", 'src/state/LockContext.test.tsx',
     'Unlock with 30-second grace. Emit inactive, wait 20 seconds, emit background, wait 15 seconds, then emit active.', 'Lock after 35 seconds away from the foreground.', 'Remains unlocked because only 15 seconds since background are counted.'),
    ('BUG-006', 'FD renewal starts today instead of the promised maturity date', 'High', 'src/state/AppContext.tsx', 'const newStartDate = todayIso()', 'src/state/AppContext.test.tsx',
     'On 15 June 2026, renew an FD maturing 1 January 2027 through the renewal confirmation action. The detail dialog promises renewal from maturity.', 'Renewed start date is 1 January 2027.', 'Renewed start date is 15 June 2026, shortening/replacing the current term.'),
    ('BUG-007', 'Matured FD has no renewal action', 'Medium', 'src/screens/FdDetailScreen.tsx', "const canRenew = fd.status === 'Active'", 'src/screens/screens.test.tsx',
     'Render FD detail on 15 June 2026 for a one-year FD starting 1 January 2025.', 'A renewal action is available for the matured deposit with a pending renewal decision.', 'Renew button is absent because only Active FDs can renew.'),
    ('BUG-008', 'Overflowing amount passes form validation', 'Medium', 'src/data/validation.ts', 'const principal = toNumber', 'src/data/validation.boundaries.test.ts',
     'Validate an otherwise valid FD draft whose principalAmount is the numeric string 1e309.', 'Amount validation error because the parsed amount is Infinity.', 'No principal validation error. The validator checks NaN and positivity, not finiteness. The RD path has the same check, but its subsequent assertion is not reached in this failing test.'),
]

# Manual test ID, prerequisites, steps, expected result. None were executed.
MANUAL = [
    ('AND-001', 'Fresh disposable Android app profile.', 'Cold launch in airplane mode; visit all tabs.', 'Empty portfolio renders, calculators work, and no network-dependent flow blocks use.'),
    ('AND-002', 'Synthetic FD-A and RD-A saved.', 'Force-stop and relaunch the test app; reopen details.', 'Entered fields and settings persist; derived values reflect the device date.'),
    ('AND-003', 'Synthetic FD-A and RD-A.', 'Edit principal/installments, close a record, cancel then confirm deletion; relaunch.', 'Only confirmed actions persist and linked screens remain consistent.'),
    ('AND-004', 'Emulator clock control; RD-M starts 31 January 2026, tenure 12 months.', 'Set emulator date to 28 February 2026; inspect installment due/missed and next installment date.', 'February installment is due on 28 February. Known BUG-002 may fail.'),
    ('AND-005', 'Future-start RD-F with zero installments paid.', 'Open its detail before the start date.', 'No missed installment or overdue warning before start. Known BUG-001 may fail.'),
    ('AND-006', 'FD-A loaded; emulator clock control.', 'Background the test app; advance the emulator one day; foreground and inspect totals/status/days.', 'All date-dependent values refresh. Known BUG-003 may fail.'),
    ('AND-007', 'Android notification permission undecided; FD-N matures device-today + 2 days.', 'Enable reminders, grant permission, select 1-day lead, inspect OS notification settings.', 'Permission is requested when enabling; app reports enabled and a local reminder is scheduled.'),
    ('AND-008', 'Permission undecided or denied.', 'Enable reminders and deny the OS prompt.', 'Reminder switch remains off and actionable denial feedback appears.'),
    ('AND-009', 'Reminders enabled and permission initially granted.', 'Revoke permission in Android Settings; return to app and reopen Reminder Settings.', 'Permission warning reflects the current OS state; no claim of successful delivery.'),
    ('AND-010', 'FD-N; permission granted; test clock before the adapter fire time.', 'Select 1-day lead and wait/advance only emulator clock to the scheduled day/time.', 'One reminder arrives with correct bank and FD identifier. Record actual timestamp and notification screenshot.'),
    ('AND-011', 'FD-N reminder scheduled.', 'Change lead days, edit maturity, then delete FD-N; inspect pending/delivered notifications.', 'Scheduled reminders update without duplicates; deleted deposit reminder is cancelled.'),
    ('AND-012', 'Test emulator/device with scheduled reminder.', 'Reboot; reopen app before due time and verify rescheduling; separately reboot without reopening.', 'Reopening reconciles reminders. Delivery without reopening is a documented unsupported behavior, not a new defect.'),
    ('AND-013', 'Disposable profile; no PIN configured.', 'Set matching PIN, relaunch, enter incorrect then correct PIN; change and disable PIN with current PIN.', 'No portfolio flashes before unlock; only correct PIN changes/disables lock.'),
    ('AND-014', 'PIN configured; grace set to 30 seconds.', 'Switch away for 29 seconds and return; repeat for at least 30 seconds; test inactive then background transition.', 'Unlock remains within grace and locks at its boundary. Known BUG-005 may fail for staged transitions.'),
    ('AND-015', 'PIN configured; no lockout yet.', 'Submit wrong PIN five times, restart during lockout, retry correct PIN before and after expiry.', 'Attempts and expiry persist; retry blocked during lockout and accepted afterward.'),
    ('AND-016', 'Device supports biometrics, enrollment present, PIN configured.', 'Enable biometrics; relaunch; accept, cancel, and fail scans; use PIN fallback.', 'Successful scan unlocks; cancellation/failure leaves app locked without incrementing PIN attempts.'),
    ('AND-017', 'Device with no supported/enrolled biometrics.', 'Open security settings and locked screen.', 'No unusable biometric shortcut; PIN remains available.'),
    ('AND-018', 'FD-A/RD-A saved; file-sharing target installed.', 'Export plaintext JSON; save it; reopen with picker and inspect preview; cancel restore.', 'File has correct synthetic data; cancellation makes no portfolio changes; temporary cache file is cleaned up after sharing.'),
    ('AND-019', 'Synthetic backup; passphrase sample-passphrase.', 'Export encrypted backup; import; try wrong passphrase, then correct passphrase.', 'Encrypted file lacks plaintext portfolio fields; wrong passphrase preserves retry; correct passphrase opens preview.'),
    ('AND-020', 'Backup contains existing FD-A with edited remarks and new FD-B.', 'Restore with skip-existing; repeat with overwrite; relaunch.', 'Skip keeps FD-A unchanged and adds FD-B; overwrite changes FD-A; unrelated records remain.'),
    ('AND-021', 'Backup screen open.', 'Cancel picker/share; choose malformed JSON and unsupported-version files.', 'Cancellation is harmless; invalid files show feedback and make no database changes.'),
    ('AND-022', 'All screens accessible; light/dark themes.', 'Switch themes, relaunch, increase font scale; inspect forms/charts/dialogs while scrolling.', 'Theme persists; essential text/actions remain readable and reachable without clipping.'),
    ('AND-023', 'Screen reader enabled; forms and navigation accessible.', 'Navigate tabs, read labels and selected state, enter numeric/date fields, dismiss keyboard, press hardware Back in sheets/details/lock.', 'Controls have understandable labels/states; Back closes sheets or returns appropriately and cannot bypass lock.'),
    ('AND-024', 'Disposable profile with backup, PIN, reminders and deposits.', 'Type a wrong confirmation, then DELETE; confirm wipe; relaunch.', 'Wrong text disables deletion; confirmed wipe removes all deposits/settings and resets lock/reminders.'),
    ('AND-025', 'FD-A active and a separate matured FD.', 'Read renewal confirmation and renew; attempt renewal on matured FD.', 'Renewal date matches displayed promise and matured renewal is available. Known BUG-006/007 may fail.'),
]


def generate():
    OUT.mkdir(parents=True, exist_ok=True)
    results = read('test-results.json')
    coverage = read('coverage-summary.json')
    checks_path = ROOT / 'coverage' / 'check-results.json'
    checks = read('check-results.json') if checks_path.exists() else {}
    revision = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
    cases = []
    for suite in results['testResults']:
        path = relative(suite['name'])
        for case in suite['assertionResults']:
            title = case['fullName']
            digest = hashlib.sha256((path + ':' + title).encode()).hexdigest()[:8]
            match = re.search(r'\b(?:BUG|APP|LOCK|SEL|DER|CAL|FMT|BIO|UI|REF|THM|NAV|VAL)-\d{3}\b', title)
            case_id = match.group() + '-' + digest if match else 'LEG-' + digest
            cases.append((case_id, title, path, case['status']))
    cases.sort(key=lambda row: (row[2], row[1]))
    failed = [c for c in cases if c[3] == 'failed']
    confirmed_ids = {b[0] for b in BUGS}
    unexpected = [c for c in failed if c[0].split('-')[0] != 'BUG' or '-'.join(c[0].split('-')[:2]) not in confirmed_ids]

    inventory = [
        '# Test Cases', '', f'Snapshot: {DATE} (Asia/Calcutta).', '',
        '## Automated inventory', '',
        f'{len(cases)} individually executed cases. Scenario/expected behavior is the assertion title; each linked suite contains exact inputs and assertions. Parameterized cases are listed separately. IDs use an explicit family plus a stable title/path hash; retained legacy tests receive LEG IDs.', '',
        '| Case ID | Scenario / expected behavior | Suite | Result |', '|---|---|---|---|',
    ]
    inventory += [f'| {cid} | {table_cell(title)} | {link(path)} | {status} |' for cid, title, path, status in cases]
    inventory += [
        '', '## Manual Android checklist', '',
        'All 25 cases below are **not run**. Use a disposable app profile or emulator; never wipe a personal portfolio for validation. Record app build/revision, device model, Android/API, local date/timezone, tester, result, timestamp, screenshot/log evidence, and bug ID for each executed case.', '',
        'Synthetic data: FD-A = FD001, Test Bank, Jane Doe, principal 100000, 7% quarterly, start/deposit 2026-01-01, tenure 1 year, payout At Maturity. RD-A = RD001, Test Bank, installment 5000, 6.5% quarterly, start 2026-01-01, tenure 12 months, 6 paid. Use synthetic account 1234567890. For zero-rate calculator checks RD-A maturity is 60000. Use emulator clock changes for historical dates, not a personal device clock.', '',
    ]
    for cid, prerequisites, steps, expected in MANUAL:
        inventory += [f'### {cid}', '', f'- Prerequisites/data: {prerequisites}', f'- Steps: {steps}', f'- Expected: {expected}', '- Result: **not run**; tester/time/evidence: pending.', '']
    inventory += ['### IOS-001', '', 'On a macOS/Xcode environment, execute the corresponding persistence, file-picker, sharing, biometric and date-picker scenarios on iOS. Result: **unverified / not run**; this Windows host cannot execute iOS.', '']
    write('TEST_CASES.md', inventory)

    total = coverage['total']
    metrics = ['statements', 'branches', 'functions', 'lines']
    source_files = sorted([ROOT / 'App.tsx'] + list((ROOT / 'src').rglob('*.ts')) + list((ROOT / 'src').rglob('*.tsx')))
    source_files = [p for p in source_files if '.test.' not in p.name]
    mapping = {relative(path): value for path, value in coverage.items() if path != 'total'}
    coverage_lines = ['# Codebase Coverage Report', '', f'Snapshot: {DATE}; source revision {revision} plus testing-only working-tree changes.', '',
                      '## Measured coverage', '', '| Metric | Covered / total | Percent |', '|---|---|---|']
    coverage_lines += [f'| {m.title()} | {total[m]["covered"]} / {total[m]["total"]} | {total[m]["pct"]}% |' for m in metrics]
    coverage_lines += ['', 'Coverage includes App.tsx and all application src TypeScript/TSX, including unimported files. Tests, mocks, declarations and generated code are excluded. Runtime entrypoints index.js, native Android/iOS code, build tooling, fonts/images and dependency code are outside Istanbul coverage and classified below. Failing regressions execute code and contribute coverage; percentages do not establish correctness.', '',
                       '## Feature-to-test map', '', '| Feature | Automated evidence | Native/manual evidence |', '|---|---|---|',
                       '| Finance, dates, calculator wrappers | finance.test.ts; portfolioData.test.ts; derive.test.ts | AND-004/005/006/025 |',
                       '| SQLite CRUD, migration, rollback and settings | db.test.ts (real in-memory SQLite) | AND-002/003/024 |',
                       '| Backup schema, crypto and file orchestration | backupSchema.test.ts; backupCrypto.test.ts; backupIO.test.ts; AppContext.test.tsx | AND-018 through AND-021 |',
                       '| App actions, lifecycle, reminders and state | AppContext.test.tsx; reminders.test.ts; notifeeClient.test.ts | AND-006 through AND-012 |',
                       '| PIN, lockout, grace, biometric gate | security.test.ts; biometrics.test.ts; LockContext.test.tsx; screens.test.tsx | AND-013 through AND-017 |',
                       '| All 20 screens and shared controls | screens.test.tsx; ErrorBoundary.test.tsx; App.test.tsx | AND-022/023 |',
                       '| Filtering, sorting, aggregates, charts, payouts and timeline | selectors.test.ts | AND-003/006/022 |',
                       '| Themes, navigation guards and refresh | ThemeContext.test.tsx; navigationRef.test.ts; useRefresh.test.tsx | AND-002/022/023 |', '',
                       '## Every application source module', '',
                       'Classification is measured, not a claim of exhaustive behavior: Full executable coverage = all four counters 100%; Partial = at least one executable counter below 100%; Declarative = no executable statements; Excluded declaration = type-only .d.ts.', '',
                       '| Source | Statements | Branches | Functions | Lines | Classification / remaining validation |', '|---|---|---|---|---|---|']
    for p in source_files:
        path = p.relative_to(ROOT).as_posix()
        item = mapping.get(path)
        if p.name.endswith('.d.ts'):
            values = ['excluded'] * 4
            note = 'Excluded declaration; checked by TypeScript.'
        elif not item:
            values = ['not instrumented'] * 4
            note = 'Not instrumented; inspect coverage configuration before claiming coverage.'
        else:
            values = [str(item[m]['pct']) + '%' for m in metrics]
            if item['statements']['total'] == 0:
                note = 'Declarative; checked by TypeScript.'
            else:
                note = ('Full executable coverage' if all(item[m]['pct'] == 100 for m in metrics) else 'Partial executable coverage')
                if path.startswith('src/screens/') or path.startswith('src/components/'):
                    note += '; RN renderer checks; native layout, gestures, accessibility and animation require device validation.'
                elif path in ('src/state/AppContext.tsx', 'src/state/LockContext.tsx'):
                    note += '; provider actions with controlled native boundaries; lifecycle/write-error regressions remain.'
                elif path in ('src/data/db.ts', 'src/data/notifeeClient.ts', 'src/data/backupIO.ts', 'src/data/biometrics.ts'):
                    note += '; real SQLite or native mocks; device adapter/permission/filesystem behavior unverified.'
                else:
                    note += '; see HTML report for uncovered lines/branches.'
        coverage_lines.append(f'| {link(path)} | ' + ' | '.join(values) + f' | {note} |')
    coverage_lines += ['', '## Explicit gaps and limits', '',
                       '- Open the generated [HTML report](../../coverage/index.html) for exact uncovered lines/branches. Partial modules are not represented as fully tested.',
                       '- Screen tests exercise handlers with mocked state/action hooks. Provider suites separately exercise real contexts with mocked dependencies; they are not mobile end-to-end tests.',
                       '- SQL tests execute real SQL with better-sqlite3; they do not verify op-sqlite native compilation, native thread behavior, real filesystem corruption or every historical deployed schema.',
                       '- Native integration, OS delivery, share-target handoff, real biometric prompts, gestures, visual clipping and screen-reader behavior remain not run.',
                       '- Native Android/iOS sources and manifests require build/device validation. Existing documented reboot and unencrypted-database limitations are not new bugs.',
                       '- index.js and scripts/patch-native-cmake-versions.js are startup/build tooling; covered by inspection and app smoke only, not native build execution.',
                       '- Fonts, bank images, logo mappings and theme constants are loaded by screen tests; their visual appearance is unverified.',
                       '- iOS remains unverified. No blanket percentage threshold was imposed; selected policy is risk-based accounting.', '',
                       'Artifacts: coverage/index.html, coverage/coverage-summary.json, coverage/lcov.info and coverage/test-results.json. Coverage artifacts are ignored by git; Markdown reports are reviewable snapshots.', '']
    write('COVERAGE_REPORT.md', coverage_lines)

    report = ['# Test Execution Report', '', f'Date: {DATE} (Asia/Calcutta). Revision: `{revision}` plus testing-only working-tree changes.', '',
              'Environment: Windows/PowerShell; Node v24.12.0; npm 11.7.0; Jest 29; React Native preset; SQLite adapter backed by better-sqlite3. Shared synthetic fixture clock: 15 June 2026, local noon.', '',
              '## Baseline versus expanded suite', '', '| Run | Suites | Passed tests | Failed tests | Skipped / todo | Total tests |', '|---|---|---|---|---|---|',
              '| Verified pre-change baseline | 11 passed | 148 | 0 | 0 | 148 |',
              f'| Expanded full run | {results["numPassedTestSuites"]} passed / {results["numFailedTestSuites"]} failed | {results["numPassedTests"]} | {results["numFailedTests"]} | {results["numPendingTests"]} / {results.get("numTodoTests", 0)} | {results["numTotalTests"]} |', '',
              f'Full run command: `{COMMAND}`. Exit status: {1 if results["numFailedTests"] else 0}. No production bugs were fixed.', '',
              f'Execution duration: {(sum(suite["endTime"] - suite["startTime"] for suite in results["testResults"]) / 1000):.2f} seconds summed across suite durations (not wall-clock).', '',
              '## Static checks and supplemental evidence', '', '| Check / command | Result |', '|---|---|']
    for command, code in checks.items():
        report.append(f'| `{command}` | {"Passed" if code == 0 else "Failed"} (exit {code}) |')
    if not checks:
        report.append('| TypeScript / ESLint | No saved check evidence |')
    for filename in ['timezone-kolkata.json', 'timezone-los-angeles.json', 'repeat-results.json']:
        if (ROOT / 'coverage' / filename).exists():
            supplemental = read(filename)
            report.append(f'| {filename} | {supplemental["numPassedTests"]} passed / {supplemental["numFailedTests"]} failed / {supplemental["numPendingTests"]} skipped |')
    report += ['', 'Repeat run verifies the same lifecycle/UI cases with isolated mocks, fixed clocks and unmount cleanup. Provider tests assert AppState subscriptions are removed; the harness clears its fake timers. Timezone runs start separate Node/Jest processes with TZ set before loading modules.', '',
               '## Failures', '', '| Bug | Regression | Evidence |', '|---|---|---|']
    report += [f'| {cid.rsplit("-", 1)[0]} | {table_cell(title)} | {link(path)} |' for cid, title, path, status in failed]
    report += ['', f'Unexpected/test-harness failures in final full run: **{len(unexpected)}**. Confirmed bug failures remain intentionally visible and are linked in [BUG_REPORT.md](BUG_REPORT.md). A nonzero Jest exit is expected until those defects are fixed.', '',
               '## Device status and unfinished validation', '',
               'Read-only ADB discovery found a connected Redmi 8 running Android 16 / API 36, with com.fdrdmanager installed. This does not establish that its installed build matches this revision. No app data, device clock, settings, installed APK or native project files were changed.', '',
               'Manual Android cases: **25 not run**. Native acceptance requires a disposable profile/test build and execution of [TEST_CASES.md](TEST_CASES.md); no device pass is claimed from mocks or device discovery. iOS: **1 checklist entry unverified / not run** because this host is Windows.', '',
               'Build/install tests were not run. Dependency installation was unnecessary; no package dependency changes were made. The pre-existing package-lock.json modification was preserved.', '',
               '## Reproduce', '', '```powershell', COMMAND,
               'node node_modules/typescript/bin/tsc --noEmit', 'npm run lint -- --quiet', 'python tests/report.py', '```', '',
               'The generator reads saved coverage/check-results.json for static-check outcomes; rerunning it alone does not rerun checks. Run the checks first and refresh that evidence if the code changes. Detailed test results and metrics are retained in ignored coverage/; all cases and source modules are listed in the other Markdown reports.', '']
    write('TEST_REPORT.md', report)

    bugs = ['# Bug Report', '', f'Snapshot: {DATE}. Status: **open; fixes deferred**. Findings are reproduced by automated tests against unmodified application source, not by native device execution.', '',
            'Severity: High = data reliability/security/business outcome; Medium = incorrect validation, schedule or blocked workflow. These are review priorities, not proof of exploitation.', '',
            '## Confirmed defects', '', '| ID | Severity | Title | Status |', '|---|---|---|---|']
    failed_titles = [c[1] for c in failed]
    for bug_id, title, severity, source, symbol, test, steps, expected, actual in BUGS:
        status = 'Confirmed; failing regression' if any(bug_id in t for t in failed_titles) else 'Not confirmed in this run'
        bugs.append(f'| {bug_id} | {severity} | {title} | {status}; fix deferred |')
    for bug_id, title, severity, source, symbol, test, steps, expected, actual in BUGS:
        lines = (ROOT / source).read_text(encoding='utf-8').splitlines()
        line = next((i for i, text in enumerate(lines, 1) if symbol in text), None)
        bugs += ['', f'## {bug_id}: {title}', '', f'- Severity: **{severity}**. Status: open, fix deferred.',
                 f'- Source: {link(source)}, line {line} (`{symbol}`).', f'- Executable regression: {link(test)}; filter with `npm test -- --runInBand --testNamePattern={bug_id}`.',
                 f'- Preconditions and steps: {steps}', f'- Expected: {expected}', f'- Actual/evidence: {actual}',
                 '- Reproduction layer: Jest unit/provider/renderer test; native device reproduction pending.']
    bugs += ['', '## Suspected issues requiring additional confirmation', '',
             '- OS permission revocation may leave the in-memory permission flag stale until a reload; execute AND-009 before classifying it as a confirmed device defect.',
             '- Restoring PIN/lock settings may require lock-provider rehydration; verify restore and restart on a disposable profile before reporting a confirmed security-state issue.', '',
             '## Harness/environment findings', '',
             f'- Final unexpected harness failures: {len(unexpected)}. Initial test-authoring failures (text traversal, timer setup and type annotations) were corrected in tests only and are not product bugs.',
             '- Native/manual validation remains not run; no native-platform defect is asserted from missing execution.', '',
             '## Existing documented limitations', '',
             '- RD payments are recorded manually; FD payouts are schedule-based rather than receipt-tracked.',
             '- Reminders may not fire after reboot unless the app is reopened to resynchronize.',
             '- The SQLite database is not encrypted at rest; app lock protects the UI.', '',
             'No application source fixes, migrations or expectation changes to conceal failures were made.', '']
    write('BUG_REPORT.md', bugs)
    print(f'Generated four reports: {len(cases)} automated cases, {len(failed)} failures, {len(source_files)} application source modules, {len(MANUAL)} manual Android cases.')


if __name__ == '__main__':
    generate()
