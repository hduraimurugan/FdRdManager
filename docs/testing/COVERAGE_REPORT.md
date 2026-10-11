# Codebase Coverage Report

Snapshot: 2026-10-11; source revision 7cd8954bc845b89b6ffd9cca38a9201caea6ab53 plus testing-only working-tree changes.

## Measured coverage

| Metric | Covered / total | Percent |
|---|---|---|
| Statements | 1858 / 2016 | 92.16% |
| Branches | 1350 / 1737 | 77.72% |
| Functions | 531 / 607 | 87.47% |
| Lines | 1632 / 1748 | 93.36% |

Coverage includes App.tsx and all application src TypeScript/TSX, including unimported files. Tests, mocks, declarations and generated code are excluded. Runtime entrypoints index.js, native Android/iOS code, build tooling, fonts/images and dependency code are outside Istanbul coverage and classified below. Failing regressions execute code and contribute coverage; percentages do not establish correctness.

## Feature-to-test map

| Feature | Automated evidence | Native/manual evidence |
|---|---|---|
| Finance, dates, calculator wrappers | finance.test.ts; portfolioData.test.ts; derive.test.ts | AND-004/005/006/025 |
| SQLite CRUD, migration, rollback and settings | db.test.ts (real in-memory SQLite) | AND-002/003/024 |
| Backup schema, crypto and file orchestration | backupSchema.test.ts; backupCrypto.test.ts; backupIO.test.ts; AppContext.test.tsx | AND-018 through AND-021 |
| App actions, lifecycle, reminders and state | AppContext.test.tsx; reminders.test.ts; notifeeClient.test.ts | AND-006 through AND-012 |
| PIN, lockout, grace, biometric gate | security.test.ts; biometrics.test.ts; LockContext.test.tsx; screens.test.tsx | AND-013 through AND-017 |
| All 20 screens and shared controls | screens.test.tsx; ErrorBoundary.test.tsx; App.test.tsx | AND-022/023 |
| Filtering, sorting, aggregates, charts, payouts and timeline | selectors.test.ts | AND-003/006/022 |
| Themes, navigation guards and refresh | ThemeContext.test.tsx; navigationRef.test.ts; useRefresh.test.tsx | AND-002/022/023 |

## Every application source module

Classification is measured, not a claim of exhaustive behavior: Full executable coverage = all four counters 100%; Partial = at least one executable counter below 100%; Declarative = no executable statements; Excluded declaration = type-only .d.ts.

| Source | Statements | Branches | Functions | Lines | Classification / remaining validation |
|---|---|---|---|---|---|
| [App.tsx](../../App.tsx) | 28.57% | 0% | 33.33% | 28.57% | Partial executable coverage; see HTML report for uncovered lines/branches. |
| [src/components/Avatar.tsx](../../src/components/Avatar.tsx) | 100% | 0% | 100% | 100% | Partial executable coverage; RN renderer checks; native layout, gestures, accessibility and animation require device validation. |
| [src/components/BankLogo.tsx](../../src/components/BankLogo.tsx) | 55.55% | 66.66% | 100% | 55.55% | Partial executable coverage; RN renderer checks; native layout, gestures, accessibility and animation require device validation. |
| [src/components/BarChart.tsx](../../src/components/BarChart.tsx) | 100% | 100% | 100% | 100% | Full executable coverage; RN renderer checks; native layout, gestures, accessibility and animation require device validation. |
| [src/components/BottomSheet.tsx](../../src/components/BottomSheet.tsx) | 65.51% | 40% | 33.33% | 66.66% | Partial executable coverage; RN renderer checks; native layout, gestures, accessibility and animation require device validation. |
| [src/components/BottomTabBar.tsx](../../src/components/BottomTabBar.tsx) | 100% | 100% | 100% | 100% | Full executable coverage; RN renderer checks; native layout, gestures, accessibility and animation require device validation. |
| [src/components/Card.tsx](../../src/components/Card.tsx) | 100% | 100% | 100% | 100% | Full executable coverage; RN renderer checks; native layout, gestures, accessibility and animation require device validation. |
| [src/components/ConfirmDialog.tsx](../../src/components/ConfirmDialog.tsx) | 100% | 50% | 100% | 100% | Partial executable coverage; RN renderer checks; native layout, gestures, accessibility and animation require device validation. |
| [src/components/DateField.tsx](../../src/components/DateField.tsx) | 60% | 58.33% | 42.85% | 61.11% | Partial executable coverage; RN renderer checks; native layout, gestures, accessibility and animation require device validation. |
| [src/components/DonutChart.tsx](../../src/components/DonutChart.tsx) | 100% | 100% | 100% | 100% | Full executable coverage; RN renderer checks; native layout, gestures, accessibility and animation require device validation. |
| [src/components/EmptyState.tsx](../../src/components/EmptyState.tsx) | 94.44% | 57.57% | 100% | 94.44% | Partial executable coverage; RN renderer checks; native layout, gestures, accessibility and animation require device validation. |
| [src/components/ErrorBoundary.tsx](../../src/components/ErrorBoundary.tsx) | 100% | 75% | 100% | 100% | Partial executable coverage; RN renderer checks; native layout, gestures, accessibility and animation require device validation. |
| [src/components/ErrorState.tsx](../../src/components/ErrorState.tsx) | 100% | 77.77% | 100% | 100% | Partial executable coverage; RN renderer checks; native layout, gestures, accessibility and animation require device validation. |
| [src/components/Fab.tsx](../../src/components/Fab.tsx) | 100% | 100% | 100% | 100% | Full executable coverage; RN renderer checks; native layout, gestures, accessibility and animation require device validation. |
| [src/components/FilterSheet.tsx](../../src/components/FilterSheet.tsx) | 65.62% | 50% | 68.75% | 66.66% | Partial executable coverage; RN renderer checks; native layout, gestures, accessibility and animation require device validation. |
| [src/components/FormField.tsx](../../src/components/FormField.tsx) | 100% | 100% | 100% | 100% | Full executable coverage; RN renderer checks; native layout, gestures, accessibility and animation require device validation. |
| [src/components/FormSelect.tsx](../../src/components/FormSelect.tsx) | 88.88% | 100% | 80% | 88.88% | Partial executable coverage; RN renderer checks; native layout, gestures, accessibility and animation require device validation. |
| [src/components/icons/Icons.tsx](../../src/components/icons/Icons.tsx) | 93.54% | 45.05% | 93.54% | 93.54% | Partial executable coverage; RN renderer checks; native layout, gestures, accessibility and animation require device validation. |
| [src/components/ProgressBar.tsx](../../src/components/ProgressBar.tsx) | 100% | 100% | 100% | 100% | Full executable coverage; RN renderer checks; native layout, gestures, accessibility and animation require device validation. |
| [src/components/SkeletonBlock.tsx](../../src/components/SkeletonBlock.tsx) | 100% | 100% | 100% | 100% | Full executable coverage; RN renderer checks; native layout, gestures, accessibility and animation require device validation. |
| [src/components/StatPill.tsx](../../src/components/StatPill.tsx) | 100% | 100% | 100% | 100% | Full executable coverage; RN renderer checks; native layout, gestures, accessibility and animation require device validation. |
| [src/components/StatusBadge.tsx](../../src/components/StatusBadge.tsx) | 100% | 100% | 100% | 100% | Full executable coverage; RN renderer checks; native layout, gestures, accessibility and animation require device validation. |
| [src/components/ToastOverlay.tsx](../../src/components/ToastOverlay.tsx) | 16.66% | 0% | 0% | 20% | Partial executable coverage; RN renderer checks; native layout, gestures, accessibility and animation require device validation. |
| [src/components/TopAppBar.tsx](../../src/components/TopAppBar.tsx) | 100% | 81.81% | 100% | 100% | Partial executable coverage; RN renderer checks; native layout, gestures, accessibility and animation require device validation. |
| [src/data/backupCrypto.ts](../../src/data/backupCrypto.ts) | 100% | 100% | 100% | 100% | Full executable coverage; see HTML report for uncovered lines/branches. |
| [src/data/backupIO.ts](../../src/data/backupIO.ts) | 100% | 100% | 100% | 100% | Full executable coverage; real SQLite or native mocks; device adapter/permission/filesystem behavior unverified. |
| [src/data/backupSchema.ts](../../src/data/backupSchema.ts) | 92.06% | 84.72% | 100% | 100% | Partial executable coverage; see HTML report for uncovered lines/branches. |
| [src/data/bankLogos.ts](../../src/data/bankLogos.ts) | 100% | 100% | 100% | 100% | Full executable coverage; see HTML report for uncovered lines/branches. |
| [src/data/biometrics.ts](../../src/data/biometrics.ts) | 100% | 100% | 100% | 100% | Full executable coverage; real SQLite or native mocks; device adapter/permission/filesystem behavior unverified. |
| [src/data/db.ts](../../src/data/db.ts) | 100% | 60.29% | 100% | 100% | Partial executable coverage; real SQLite or native mocks; device adapter/permission/filesystem behavior unverified. |
| [src/data/derive.ts](../../src/data/derive.ts) | 94.05% | 78.31% | 100% | 93.54% | Partial executable coverage; see HTML report for uncovered lines/branches. |
| [src/data/finance.ts](../../src/data/finance.ts) | 93.18% | 79.66% | 100% | 94.87% | Partial executable coverage; see HTML report for uncovered lines/branches. |
| [src/data/notifeeClient.ts](../../src/data/notifeeClient.ts) | 93.02% | 80% | 92.3% | 97.05% | Partial executable coverage; real SQLite or native mocks; device adapter/permission/filesystem behavior unverified. |
| [src/data/portfolioData.ts](../../src/data/portfolioData.ts) | 98.07% | 98.03% | 100% | 100% | Partial executable coverage; see HTML report for uncovered lines/branches. |
| [src/data/reminders.ts](../../src/data/reminders.ts) | 95% | 70% | 100% | 100% | Partial executable coverage; see HTML report for uncovered lines/branches. |
| [src/data/security.ts](../../src/data/security.ts) | 97.22% | 94.11% | 100% | 100% | Partial executable coverage; see HTML report for uncovered lines/branches. |
| [src/data/validation.ts](../../src/data/validation.ts) | 100% | 100% | 100% | 100% | Full executable coverage; see HTML report for uncovered lines/branches. |
| [src/hooks/useRefresh.ts](../../src/hooks/useRefresh.ts) | 100% | 100% | 100% | 100% | Full executable coverage; see HTML report for uncovered lines/branches. |
| [src/navigation/navigationRef.ts](../../src/navigation/navigationRef.ts) | 100% | 100% | 100% | 100% | Full executable coverage; see HTML report for uncovered lines/branches. |
| [src/navigation/RootNavigator.tsx](../../src/navigation/RootNavigator.tsx) | 33.33% | 100% | 0% | 33.33% | Partial executable coverage; see HTML report for uncovered lines/branches. |
| [src/navigation/types.ts](../../src/navigation/types.ts) | 0% | 0% | 0% | 0% | Declarative; checked by TypeScript. |
| [src/screens/AddEditFdScreen.tsx](../../src/screens/AddEditFdScreen.tsx) | 100% | 93.1% | 100% | 100% | Partial executable coverage; RN renderer checks; native layout, gestures, accessibility and animation require device validation. |
| [src/screens/AddEditRdScreen.tsx](../../src/screens/AddEditRdScreen.tsx) | 100% | 88.7% | 100% | 100% | Partial executable coverage; RN renderer checks; native layout, gestures, accessibility and animation require device validation. |
| [src/screens/BackupRestoreScreen.tsx](../../src/screens/BackupRestoreScreen.tsx) | 92.1% | 71.87% | 75% | 92.1% | Partial executable coverage; RN renderer checks; native layout, gestures, accessibility and animation require device validation. |
| [src/screens/CalculatorsHubScreen.tsx](../../src/screens/CalculatorsHubScreen.tsx) | 100% | 100% | 100% | 100% | Full executable coverage; RN renderer checks; native layout, gestures, accessibility and animation require device validation. |
| [src/screens/ClearDataScreen.tsx](../../src/screens/ClearDataScreen.tsx) | 100% | 62.5% | 100% | 100% | Partial executable coverage; RN renderer checks; native layout, gestures, accessibility and animation require device validation. |
| [src/screens/FdCalculatorScreen.tsx](../../src/screens/FdCalculatorScreen.tsx) | 100% | 66.66% | 100% | 100% | Partial executable coverage; RN renderer checks; native layout, gestures, accessibility and animation require device validation. |
| [src/screens/FdDetailScreen.tsx](../../src/screens/FdDetailScreen.tsx) | 81.81% | 68.75% | 60% | 78.94% | Partial executable coverage; RN renderer checks; native layout, gestures, accessibility and animation require device validation. |
| [src/screens/HomeScreen.tsx](../../src/screens/HomeScreen.tsx) | 90% | 75% | 75% | 88% | Partial executable coverage; RN renderer checks; native layout, gestures, accessibility and animation require device validation. |
| [src/screens/LockScreen.tsx](../../src/screens/LockScreen.tsx) | 81.08% | 68% | 62.5% | 87.5% | Partial executable coverage; RN renderer checks; native layout, gestures, accessibility and animation require device validation. |
| [src/screens/MainTabsScreen.tsx](../../src/screens/MainTabsScreen.tsx) | 90.32% | 78.57% | 85.71% | 89.65% | Partial executable coverage; RN renderer checks; native layout, gestures, accessibility and animation require device validation. |
| [src/screens/MaturityTimelineScreen.tsx](../../src/screens/MaturityTimelineScreen.tsx) | 100% | 50% | 100% | 100% | Partial executable coverage; RN renderer checks; native layout, gestures, accessibility and animation require device validation. |
| [src/screens/MoreScreen.tsx](../../src/screens/MoreScreen.tsx) | 100% | 66.66% | 100% | 100% | Partial executable coverage; RN renderer checks; native layout, gestures, accessibility and animation require device validation. |
| [src/screens/NotificationsScreen.tsx](../../src/screens/NotificationsScreen.tsx) | 100% | 66.66% | 100% | 100% | Partial executable coverage; RN renderer checks; native layout, gestures, accessibility and animation require device validation. |
| [src/screens/PayoutsScreen.tsx](../../src/screens/PayoutsScreen.tsx) | 80.95% | 62.5% | 72.72% | 81.25% | Partial executable coverage; RN renderer checks; native layout, gestures, accessibility and animation require device validation. |
| [src/screens/PinSetupScreen.tsx](../../src/screens/PinSetupScreen.tsx) | 72.72% | 61.53% | 85.71% | 74.19% | Partial executable coverage; RN renderer checks; native layout, gestures, accessibility and animation require device validation. |
| [src/screens/PortfolioScreen.tsx](../../src/screens/PortfolioScreen.tsx) | 95.23% | 68.96% | 87.5% | 100% | Partial executable coverage; RN renderer checks; native layout, gestures, accessibility and animation require device validation. |
| [src/screens/RdCalculatorScreen.tsx](../../src/screens/RdCalculatorScreen.tsx) | 100% | 75% | 100% | 100% | Partial executable coverage; RN renderer checks; native layout, gestures, accessibility and animation require device validation. |
| [src/screens/RdDetailScreen.tsx](../../src/screens/RdDetailScreen.tsx) | 93.75% | 91.66% | 83.33% | 92.85% | Partial executable coverage; RN renderer checks; native layout, gestures, accessibility and animation require device validation. |
| [src/screens/ReminderSettingsScreen.tsx](../../src/screens/ReminderSettingsScreen.tsx) | 92.3% | 84.61% | 80% | 92.3% | Partial executable coverage; RN renderer checks; native layout, gestures, accessibility and animation require device validation. |
| [src/screens/SecuritySettingsScreen.tsx](../../src/screens/SecuritySettingsScreen.tsx) | 54.83% | 56.25% | 55.55% | 56.66% | Partial executable coverage; RN renderer checks; native layout, gestures, accessibility and animation require device validation. |
| [src/state/AppContext.tsx](../../src/state/AppContext.tsx) | 95.92% | 75.55% | 85.03% | 97.81% | Partial executable coverage; provider actions with controlled native boundaries; lifecycle/write-error regressions remain. |
| [src/state/LockContext.tsx](../../src/state/LockContext.tsx) | 95% | 87.69% | 76.92% | 98.14% | Partial executable coverage; provider actions with controlled native boundaries; lifecycle/write-error regressions remain. |
| [src/state/selectors.ts](../../src/state/selectors.ts) | 97.61% | 86.79% | 95.77% | 98.71% | Partial executable coverage; see HTML report for uncovered lines/branches. |
| [src/theme/colors.ts](../../src/theme/colors.ts) | 90.9% | 50% | 50% | 100% | Partial executable coverage; see HTML report for uncovered lines/branches. |
| [src/theme/ThemeContext.tsx](../../src/theme/ThemeContext.tsx) | 100% | 100% | 100% | 100% | Full executable coverage; see HTML report for uncovered lines/branches. |
| [src/theme/typography.ts](../../src/theme/typography.ts) | 100% | 100% | 100% | 100% | Full executable coverage; see HTML report for uncovered lines/branches. |
| [src/types/assets.d.ts](../../src/types/assets.d.ts) | excluded | excluded | excluded | excluded | Excluded declaration; checked by TypeScript. |

## Explicit gaps and limits

- Open the generated [HTML report](../../coverage/index.html) for exact uncovered lines/branches. Partial modules are not represented as fully tested.
- Screen tests exercise handlers with mocked state/action hooks. Provider suites separately exercise real contexts with mocked dependencies; they are not mobile end-to-end tests.
- SQL tests execute real SQL with better-sqlite3; they do not verify op-sqlite native compilation, native thread behavior, real filesystem corruption or every historical deployed schema.
- Native integration, OS delivery, share-target handoff, real biometric prompts, gestures, visual clipping and screen-reader behavior remain not run.
- Native Android/iOS sources and manifests require build/device validation. Existing documented reboot and unencrypted-database limitations are not new bugs.
- index.js and scripts/patch-native-cmake-versions.js are startup/build tooling; covered by inspection and app smoke only, not native build execution.
- Fonts, bank images, logo mappings and theme constants are loaded by screen tests; their visual appearance is unverified.
- iOS remains unverified. No blanket percentage threshold was imposed; selected policy is risk-based accounting.

Artifacts: coverage/index.html, coverage/coverage-summary.json, coverage/lcov.info and coverage/test-results.json. Coverage artifacts are ignored by git; Markdown reports are reviewable snapshots.

