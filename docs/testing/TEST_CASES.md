# Test Cases

Snapshot: 2026-10-11 (Asia/Calcutta).

## Automated inventory

325 individually executed cases. Scenario/expected behavior is the assertion title; each linked suite contains exact inputs and assertions. Parameterized cases are listed separately. IDs use an explicit family plus a stable title/path hash; retained legacy tests receive LEG IDs.

| Case ID | Scenario / expected behavior | Suite | Result |
|---|---|---|---|
| LEG-aeb93bdd | renders correctly | [__tests__/App.test.tsx](../../__tests__/App.test.tsx) | passed |
| LEG-15dfee64 | ErrorBoundary "Try again" resets the boundary so a fixed subtree can render again | [src/components/ErrorBoundary.test.tsx](../../src/components/ErrorBoundary.test.tsx) | passed |
| LEG-a846589b | ErrorBoundary renders children normally when nothing throws | [src/components/ErrorBoundary.test.tsx](../../src/components/ErrorBoundary.test.tsx) | passed |
| LEG-63e17446 | ErrorBoundary renders the fallback instead of crashing when a child throws during render | [src/components/ErrorBoundary.test.tsx](../../src/components/ErrorBoundary.test.tsx) | passed |
| LEG-17bea18e | encryptBackupJson / decryptBackupJson never leaks the plaintext into the encrypted payload | [src/data/backupCrypto.test.ts](../../src/data/backupCrypto.test.ts) | passed |
| LEG-a071b2d6 | encryptBackupJson / decryptBackupJson produces a different salt, nonce, and ciphertext each time, even for the same plaintext and passphrase | [src/data/backupCrypto.test.ts](../../src/data/backupCrypto.test.ts) | passed |
| LEG-65cc86d6 | encryptBackupJson / decryptBackupJson returns null (not throws) for a wrong passphrase | [src/data/backupCrypto.test.ts](../../src/data/backupCrypto.test.ts) | passed |
| LEG-62a7ca86 | encryptBackupJson / decryptBackupJson returns null (not throws) if the ciphertext was tampered with | [src/data/backupCrypto.test.ts](../../src/data/backupCrypto.test.ts) | passed |
| LEG-fb496486 | encryptBackupJson / decryptBackupJson round-trips non-ASCII text — 2, 3, and 4-byte UTF-8 sequences (café, ₹, emoji) | [src/data/backupCrypto.test.ts](../../src/data/backupCrypto.test.ts) | passed |
| LEG-b00797e8 | encryptBackupJson / decryptBackupJson round-trips plain ASCII JSON | [src/data/backupCrypto.test.ts](../../src/data/backupCrypto.test.ts) | passed |
| LEG-fc22ea85 | encryptBackupJson / decryptBackupJson stamps the current envelope version and KDF name | [src/data/backupCrypto.test.ts](../../src/data/backupCrypto.test.ts) | passed |
| LEG-e7a42e36 | isEncryptedPayload recognizes a real encrypted payload | [src/data/backupCrypto.test.ts](../../src/data/backupCrypto.test.ts) | passed |
| LEG-bc57aeb7 | isEncryptedPayload rejects a plain (unencrypted) backup envelope | [src/data/backupCrypto.test.ts](../../src/data/backupCrypto.test.ts) | passed |
| LEG-01b2653f | isEncryptedPayload rejects an object missing required fields | [src/data/backupCrypto.test.ts](../../src/data/backupCrypto.test.ts) | passed |
| LEG-ac7db245 | isEncryptedPayload rejects non-objects and null | [src/data/backupCrypto.test.ts](../../src/data/backupCrypto.test.ts) | passed |
| BIO-001-b8c9f1e7 | BIO: native backup adapter BIO-001 writes UTF-8 into cache and returns the exact path | [src/data/backupIO.test.ts](../../src/data/backupIO.test.ts) | passed |
| BIO-002-f51a8269 | BIO: native backup adapter BIO-002 propagates write failures | [src/data/backupIO.test.ts](../../src/data/backupIO.test.ts) | passed |
| BIO-003-d5ca5069 | BIO: native backup adapter BIO-003 shares JSON with cancellation allowed | [src/data/backupIO.test.ts](../../src/data/backupIO.test.ts) | passed |
| BIO-004-6660f522 | BIO: native backup adapter BIO-004 cancellation does not reject | [src/data/backupIO.test.ts](../../src/data/backupIO.test.ts) | passed |
| BIO-005-940c1a4e | BIO: native backup adapter BIO-005 cleanup is idempotent when the file is missing | [src/data/backupIO.test.ts](../../src/data/backupIO.test.ts) | passed |
| BIO-006-14829dcf | BIO: native backup adapter BIO-006 picker cancellation returns null | [src/data/backupIO.test.ts](../../src/data/backupIO.test.ts) | passed |
| BIO-007-210049e4 | BIO: native backup adapter BIO-007 reads the selected content URI | [src/data/backupIO.test.ts](../../src/data/backupIO.test.ts) | passed |
| BIO-008-1085f76b | BIO: native backup adapter BIO-008 propagates picker and fetch errors | [src/data/backupIO.test.ts](../../src/data/backupIO.test.ts) | passed |
| LEG-47be70a6 | backupSchema accepts a backup at or below the current schema version | [src/data/backupSchema.test.ts](../../src/data/backupSchema.test.ts) | passed |
| LEG-79be9e52 | backupSchema accepts a file with no app id stamped at all (lenient on absence, not on a wrong value) | [src/data/backupSchema.test.ts](../../src/data/backupSchema.test.ts) | passed |
| LEG-a9d5916c | backupSchema accepts a legitimately empty backup | [src/data/backupSchema.test.ts](../../src/data/backupSchema.test.ts) | passed |
| LEG-2e7c8904 | backupSchema defaults missing optional fields on a row, like rowToFd does | [src/data/backupSchema.test.ts](../../src/data/backupSchema.test.ts) | passed |
| LEG-f191b68c | backupSchema drops rows missing required identity fields while keeping valid rows | [src/data/backupSchema.test.ts](../../src/data/backupSchema.test.ts) | passed |
| LEG-bebbb9ba | backupSchema rejects a backup from a newer schema version than this build understands | [src/data/backupSchema.test.ts](../../src/data/backupSchema.test.ts) | passed |
| LEG-ae88d7ab | backupSchema rejects a file stamped with a different app id | [src/data/backupSchema.test.ts](../../src/data/backupSchema.test.ts) | passed |
| LEG-e9c62b2f | backupSchema rejects a non-envelope object | [src/data/backupSchema.test.ts](../../src/data/backupSchema.test.ts) | passed |
| LEG-91bc1b83 | backupSchema rejects malformed JSON | [src/data/backupSchema.test.ts](../../src/data/backupSchema.test.ts) | passed |
| LEG-8eca1fca | backupSchema rejects when every row is invalid despite non-empty input arrays | [src/data/backupSchema.test.ts](../../src/data/backupSchema.test.ts) | passed |
| LEG-62f029ff | backupSchema round-trips fds/rds/settings through build -> serialize -> validate | [src/data/backupSchema.test.ts](../../src/data/backupSchema.test.ts) | passed |
| LEG-fd1fa416 | computeImportPreview carries the skippedCount through unchanged (rows already dropped by validateBackupJson) | [src/data/backupSchema.test.ts](../../src/data/backupSchema.test.ts) | passed |
| LEG-aa379435 | computeImportPreview classifies a record as an overwrite when its id already exists locally | [src/data/backupSchema.test.ts](../../src/data/backupSchema.test.ts) | passed |
| LEG-9f2761fa | computeImportPreview classifies every incoming record as new when nothing overlaps existing ids | [src/data/backupSchema.test.ts](../../src/data/backupSchema.test.ts) | passed |
| LEG-c417a7cd | filterForImport filters fds and rds independently | [src/data/backupSchema.test.ts](../../src/data/backupSchema.test.ts) | passed |
| LEG-dcefafd2 | filterForImport overwrite mode passes every record through unchanged | [src/data/backupSchema.test.ts](../../src/data/backupSchema.test.ts) | passed |
| LEG-1cdb2ac3 | filterForImport skip-existing mode drops any record whose id already exists locally | [src/data/backupSchema.test.ts](../../src/data/backupSchema.test.ts) | passed |
| LEG-46166dd6 | filterForImport skip-existing mode keeps every record when none of the ids overlap | [src/data/backupSchema.test.ts](../../src/data/backupSchema.test.ts) | passed |
| LEG-1141d466 | isBiometricAvailable reports available with the sensor type when the native module says so | [src/data/biometrics.test.ts](../../src/data/biometrics.test.ts) | passed |
| LEG-c974bbc0 | isBiometricAvailable reports unavailable when no sensor is enrolled (the mock default) | [src/data/biometrics.test.ts](../../src/data/biometrics.test.ts) | passed |
| LEG-0af893e9 | isBiometricAvailable resolves unavailable rather than throwing if the native call rejects | [src/data/biometrics.test.ts](../../src/data/biometrics.test.ts) | passed |
| LEG-71928812 | promptBiometric resolves false (not throws) on a native error, so callers can always fall back to PIN | [src/data/biometrics.test.ts](../../src/data/biometrics.test.ts) | passed |
| LEG-ccbdd4cd | promptBiometric resolves false (not throws) when the user cancels | [src/data/biometrics.test.ts](../../src/data/biometrics.test.ts) | passed |
| LEG-4f2293c3 | promptBiometric resolves true when the user authenticates successfully | [src/data/biometrics.test.ts](../../src/data/biometrics.test.ts) | passed |
| LEG-5db0ff36 | FD CRUD deleteFd on a nonexistent id is a harmless no-op | [src/data/db.test.ts](../../src/data/db.test.ts) | passed |
| LEG-1a03f4ff | FD CRUD deleteFd removes exactly the targeted record and leaves others untouched | [src/data/db.test.ts](../../src/data/db.test.ts) | passed |
| LEG-d948a012 | FD CRUD preserves a null jointHolder distinctly from an empty string | [src/data/db.test.ts](../../src/data/db.test.ts) | passed |
| LEG-7de60829 | FD CRUD rejects an insert missing a NOT NULL column | [src/data/db.test.ts](../../src/data/db.test.ts) | passed |
| LEG-af0cd40c | FD CRUD upsertFd inserts a new record; loadAll returns it with every field intact | [src/data/db.test.ts](../../src/data/db.test.ts) | passed |
| LEG-6e86d562 | FD CRUD upsertFd with an existing id updates in place rather than inserting a duplicate | [src/data/db.test.ts](../../src/data/db.test.ts) | passed |
| LEG-1c739ab9 | RD CRUD deleteRd removes exactly the targeted record | [src/data/db.test.ts](../../src/data/db.test.ts) | passed |
| LEG-c9b8a057 | RD CRUD upsertRd inserts a new record; loadAll returns it with every field intact | [src/data/db.test.ts](../../src/data/db.test.ts) | passed |
| LEG-f5810b37 | RD CRUD upsertRd with an existing id updates in place rather than inserting a duplicate | [src/data/db.test.ts](../../src/data/db.test.ts) | passed |
| LEG-97010239 | deleteAllData leaves the database usable afterward — a new record can still be added | [src/data/db.test.ts](../../src/data/db.test.ts) | passed |
| LEG-275ac9b6 | deleteAllData wipes every FD, RD, and setting | [src/data/db.test.ts](../../src/data/db.test.ts) | passed |
| LEG-09c3613f | importAll (transactional bulk restore) inserts fds, rds and settings together in one call | [src/data/db.test.ts](../../src/data/db.test.ts) | passed |
| LEG-24e5d8f8 | importAll (transactional bulk restore) rolls back the entire import if any row in the batch fails — prior data is untouched | [src/data/db.test.ts](../../src/data/db.test.ts) | passed |
| LEG-b3d64aec | importAll (transactional bulk restore) upserts on top of existing data by id, leaving unrelated rows untouched | [src/data/db.test.ts](../../src/data/db.test.ts) | passed |
| LEG-1a664899 | schema + migration a future ALTER-TABLE-style migration, gated by PRAGMA user_version, preserves pre-existing rows | [src/data/db.test.ts](../../src/data/db.test.ts) | passed |
| LEG-5cdabeae | schema + migration creates all three tables and sets PRAGMA user_version = 1 on first open | [src/data/db.test.ts](../../src/data/db.test.ts) | passed |
| LEG-e5c311d4 | schema + migration openDb() is idempotent — concurrent calls share one migration run, not several | [src/data/db.test.ts](../../src/data/db.test.ts) | passed |
| LEG-dd63202c | schema + migration re-running migrate() on an already-migrated, populated database preserves every row | [src/data/db.test.ts](../../src/data/db.test.ts) | passed |
| LEG-3d11f977 | settings getSetting returns null for an unknown key | [src/data/db.test.ts](../../src/data/db.test.ts) | passed |
| LEG-6987359a | settings setSetting on an existing key overwrites rather than duplicating | [src/data/db.test.ts](../../src/data/db.test.ts) | passed |
| LEG-a45f9e56 | settings setSetting/getSetting round-trip | [src/data/db.test.ts](../../src/data/db.test.ts) | passed |
| BUG-001-34c4a2f2 | DER: derived records BUG-001 future RD has no installments due before its start | [src/data/derive.test.ts](../../src/data/derive.test.ts) | failed |
| BUG-002-f88475e1 | DER: derived records BUG-002 month-end RD installment is due on its clamped date | [src/data/derive.test.ts](../../src/data/derive.test.ts) | failed |
| DER-001-358925b1 | DER: derived records DER-001 computes simple FD values independently and clamps accrual before start/after maturity | [src/data/derive.test.ts](../../src/data/derive.test.ts) | passed |
| DER-002-13867d9e | DER: derived records DER-002 compounds quarterly using an independent equation | [src/data/derive.test.ts](../../src/data/derive.test.ts) | passed |
| DER-003-6e95370d | DER: derived records DER-003 payout FD retains principal and exposes next interest event | [src/data/derive.test.ts](../../src/data/derive.test.ts) | passed |
| DER-004-ef99ae5a | DER: derived records DER-004 excludes Closed records from events and notices | [src/data/derive.test.ts](../../src/data/derive.test.ts) | passed |
| DER-004-58e1afd5 | DER: derived records DER-004 excludes Prematurely Closed records from events and notices | [src/data/derive.test.ts](../../src/data/derive.test.ts) | passed |
| DER-005-302dc5a1 | DER: derived records DER-005 handles leap-year month-end maturity | [src/data/derive.test.ts](../../src/data/derive.test.ts) | passed |
| DER-006-5b75df21 | DER: derived records DER-006 zero-rate RD totals reflect paid installments | [src/data/derive.test.ts](../../src/data/derive.test.ts) | passed |
| DER-007-2d841186 | DER: derived records DER-007 caps installment due count for tenure 0 | [src/data/derive.test.ts](../../src/data/derive.test.ts) | passed |
| DER-007-39c2e564 | DER: derived records DER-007 caps installment due count for tenure 12 | [src/data/derive.test.ts](../../src/data/derive.test.ts) | passed |
| DER-007-6e86c9e9 | DER: derived records DER-007 caps installment due count for tenure 24 | [src/data/derive.test.ts](../../src/data/derive.test.ts) | passed |
| DER-008-e01a7f27 | DER: derived records DER-008 generates stable, linked overdue RD events | [src/data/derive.test.ts](../../src/data/derive.test.ts) | passed |
| DER-009-3f40b3f9 | DER: derived records DER-009 ranks matured and missed-installment notices before medium notices | [src/data/derive.test.ts](../../src/data/derive.test.ts) | passed |
| DER-010-c63f6a17 | DER: derived records DER-010 maturity notice threshold at 1 days | [src/data/derive.test.ts](../../src/data/derive.test.ts) | passed |
| DER-010-edee9f98 | DER: derived records DER-010 maturity notice threshold at 14 days | [src/data/derive.test.ts](../../src/data/derive.test.ts) | passed |
| DER-010-25142d0f | DER: derived records DER-010 maturity notice threshold at 30 days | [src/data/derive.test.ts](../../src/data/derive.test.ts) | passed |
| DER-010-5babae32 | DER: derived records DER-010 maturity notice threshold at 31 days | [src/data/derive.test.ts](../../src/data/derive.test.ts) | passed |
| DER-010-96d0c00a | DER: derived records DER-010 maturity notice threshold at 7 days | [src/data/derive.test.ts](../../src/data/derive.test.ts) | passed |
| DER-010-fc276058 | DER: derived records DER-010 maturity notice threshold at 8 days | [src/data/derive.test.ts](../../src/data/derive.test.ts) | passed |
| LEG-6361706a | addMonthsClamped / addTenure (C6 — month-end and leap-day rollover) addTenure combines years/months (clamped) with exact day offsets | [src/data/finance.test.ts](../../src/data/finance.test.ts) | passed |
| LEG-f7003862 | addMonthsClamped / addTenure (C6 — month-end and leap-day rollover) clamps 29 Feb (leap day) + 1 year to 28 Feb the following year | [src/data/finance.test.ts](../../src/data/finance.test.ts) | passed |
| LEG-5c352198 | addMonthsClamped / addTenure (C6 — month-end and leap-day rollover) clamps 31 Aug + 6 months to the last day of February | [src/data/finance.test.ts](../../src/data/finance.test.ts) | passed |
| LEG-cc728b99 | addMonthsClamped / addTenure (C6 — month-end and leap-day rollover) clamps 31 Jan + 1 month to the last day of February, not into March | [src/data/finance.test.ts](../../src/data/finance.test.ts) | passed |
| LEG-35925828 | addMonthsClamped / addTenure (C6 — month-end and leap-day rollover) clamps 31 May + 1 month to 30 June | [src/data/finance.test.ts](../../src/data/finance.test.ts) | passed |
| LEG-f5cf20fe | addMonthsClamped / addTenure (C6 — month-end and leap-day rollover) does not clamp when the day already exists in the target month | [src/data/finance.test.ts](../../src/data/finance.test.ts) | passed |
| LEG-95f9f993 | addMonthsClamped / addTenure (C6 — month-end and leap-day rollover) handles a zero tenure without throwing | [src/data/finance.test.ts](../../src/data/finance.test.ts) | passed |
| LEG-a8b4a04c | daysBetween / yearsBetween / isLeapYear (C12 — leap years) counts calendar days independent of time-of-day | [src/data/finance.test.ts](../../src/data/finance.test.ts) | passed |
| LEG-5934e67e | daysBetween / yearsBetween / isLeapYear (C12 — leap years) identifies leap years correctly, including century exceptions | [src/data/finance.test.ts](../../src/data/finance.test.ts) | passed |
| LEG-4b07a16f | daysBetween / yearsBetween / isLeapYear (C12 — leap years) yearsBetween a tenure spanning a leap day is slightly over one year | [src/data/finance.test.ts](../../src/data/finance.test.ts) | passed |
| LEG-fa24eccd | fdAccruedAmount (C10 — interestType is honoured) C10 — a Simple-interest FD is no longer silently compounded | [src/data/finance.test.ts](../../src/data/finance.test.ts) | passed |
| LEG-07772e6d | fdAccruedAmount (C10 — interestType is honoured) returns the principal unchanged for a zero or negative tenure | [src/data/finance.test.ts](../../src/data/finance.test.ts) | passed |
| LEG-a86e26cf | fdAccruedAmount (C10 — interestType is honoured) treats an unrecognised interestType as compound (form default) | [src/data/finance.test.ts](../../src/data/finance.test.ts) | passed |
| LEG-874c6e69 | finiteOr (C12 — NaN guards) passes finite numbers through unchanged, including zero and negatives | [src/data/finance.test.ts](../../src/data/finance.test.ts) | passed |
| LEG-6d35fa0c | finiteOr (C12 — NaN guards) replaces NaN and Infinity with the fallback | [src/data/finance.test.ts](../../src/data/finance.test.ts) | passed |
| LEG-7f20115a | isPayoutFd / payoutPerPeriod / payoutSchedule (C7, C8 — payout FD interest) C7 — payout FD total interest is no longer forced to zero | [src/data/finance.test.ts](../../src/data/finance.test.ts) | passed |
| LEG-5333e138 | isPayoutFd / payoutPerPeriod / payoutSchedule (C7, C8 — payout FD interest) C8 — payout amount is keyed on payout frequency, not compounding frequency | [src/data/finance.test.ts](../../src/data/finance.test.ts) | passed |
| LEG-743a22f3 | isPayoutFd / payoutPerPeriod / payoutSchedule (C7, C8 — payout FD interest) builds a monthly payout schedule that never runs past maturity | [src/data/finance.test.ts](../../src/data/finance.test.ts) | passed |
| LEG-50a0b2aa | isPayoutFd / payoutPerPeriod / payoutSchedule (C7, C8 — payout FD interest) is a payout FD for any periodic payout mode | [src/data/finance.test.ts](../../src/data/finance.test.ts) | passed |
| LEG-0875c4be | isPayoutFd / payoutPerPeriod / payoutSchedule (C7, C8 — payout FD interest) is not a payout FD when interest reinvests at maturity | [src/data/finance.test.ts](../../src/data/finance.test.ts) | passed |
| LEG-85af6b48 | isPayoutFd / payoutPerPeriod / payoutSchedule (C7, C8 — payout FD interest) returns an empty schedule for an at-maturity FD | [src/data/finance.test.ts](../../src/data/finance.test.ts) | passed |
| LEG-90740926 | parseIsoDate / toIsoDate (C1 — timezone-safe date handling) parses as local midnight, not UTC midnight | [src/data/finance.test.ts](../../src/data/finance.test.ts) | passed |
| LEG-8278b8f0 | parseIsoDate / toIsoDate (C1 — timezone-safe date handling) round-trips a date string without shifting days | [src/data/finance.test.ts](../../src/data/finance.test.ts) | passed |
| LEG-b2f8eabc | parseIsoDate / toIsoDate (C1 — timezone-safe date handling) todayIso() matches the platform's local calendar date in every timezone | [src/data/finance.test.ts](../../src/data/finance.test.ts) | passed |
| LEG-9161ca41 | rdAccruedAmount accrued value at full tenure equals the maturity amount | [src/data/finance.test.ts](../../src/data/finance.test.ts) | passed |
| LEG-4ba95441 | rdAccruedAmount accrued value is zero with no installments paid | [src/data/finance.test.ts](../../src/data/finance.test.ts) | passed |
| LEG-48715c26 | rdMaturityAmount / rdInterestTotal (C9 — RD bank-standard formula) handles a zero rate as pure deposit with no interest | [src/data/finance.test.ts](../../src/data/finance.test.ts) | passed |
| LEG-bc4163bf | rdMaturityAmount / rdInterestTotal (C9 — RD bank-standard formula) handles zero installment or zero tenure without NaN | [src/data/finance.test.ts](../../src/data/finance.test.ts) | passed |
| LEG-bfb7364d | rdMaturityAmount / rdInterestTotal (C9 — RD bank-standard formula) interest total equals maturity amount minus total deposited | [src/data/finance.test.ts](../../src/data/finance.test.ts) | passed |
| LEG-44020476 | rdMaturityAmount / rdInterestTotal (C9 — RD bank-standard formula) is no longer the old simple-interest-on-reducing-balance approximation | [src/data/finance.test.ts](../../src/data/finance.test.ts) | passed |
| LEG-15c87d00 | rdMaturityAmount / rdInterestTotal (C9 — RD bank-standard formula) matches the bank formula at 12/36/60/120 months for ₹5,000 @ 6.5% | [src/data/finance.test.ts](../../src/data/finance.test.ts) | passed |
| LEG-a7e01fc9 | rdMaturityDate adds months with end-of-month clamping, same as FD tenure | [src/data/finance.test.ts](../../src/data/finance.test.ts) | passed |
| LEG-17b1007e | cancelAllReminders cancels only ids with the reminder prefix | [src/data/notifeeClient.test.ts](../../src/data/notifeeClient.test.ts) | passed |
| LEG-a575c33d | cancelAllReminders does nothing when there is nothing of ours scheduled | [src/data/notifeeClient.test.ts](../../src/data/notifeeClient.test.ts) | passed |
| LEG-9c556879 | displayCompletionNotification displays an immediate notification with the given title and body | [src/data/notifeeClient.test.ts](../../src/data/notifeeClient.test.ts) | passed |
| LEG-6617968b | displayCompletionNotification ensures its own channel exists, separate from the reminders channel | [src/data/notifeeClient.test.ts](../../src/data/notifeeClient.test.ts) | passed |
| LEG-a9137688 | hasNotificationPermission / requestNotificationPermission reports granted when the mock reports AUTHORIZED (the default) | [src/data/notifeeClient.test.ts](../../src/data/notifeeClient.test.ts) | passed |
| LEG-869c646d | hasNotificationPermission / requestNotificationPermission reports not granted when the native module reports DENIED | [src/data/notifeeClient.test.ts](../../src/data/notifeeClient.test.ts) | passed |
| LEG-f063f34d | hasNotificationPermission / requestNotificationPermission requestNotificationPermission resolves true only on AUTHORIZED | [src/data/notifeeClient.test.ts](../../src/data/notifeeClient.test.ts) | passed |
| LEG-6cb343fd | syncScheduledReminders cancels scheduled reminders that are no longer in the plan | [src/data/notifeeClient.test.ts](../../src/data/notifeeClient.test.ts) | passed |
| LEG-11cf06bd | syncScheduledReminders creates a trigger notification for each planned reminder | [src/data/notifeeClient.test.ts](../../src/data/notifeeClient.test.ts) | passed |
| LEG-2b9f1d40 | syncScheduledReminders ensures the notification channel exists before scheduling anything | [src/data/notifeeClient.test.ts](../../src/data/notifeeClient.test.ts) | passed |
| LEG-8d1c07cc | syncScheduledReminders never cancels ids that are not ours (different prefix) | [src/data/notifeeClient.test.ts](../../src/data/notifeeClient.test.ts) | passed |
| LEG-7646931c | syncScheduledReminders skips (re)creating a reminder whose computed fire timestamp has already passed | [src/data/notifeeClient.test.ts](../../src/data/notifeeClient.test.ts) | passed |
| CAL-001-d8bf6569 | CAL: calculator and formatting contracts CAL-001 independently calculates Half-Yearly compound FD and tax | [src/data/portfolioData.test.ts](../../src/data/portfolioData.test.ts) | passed |
| CAL-001-8eb8c8a9 | CAL: calculator and formatting contracts CAL-001 independently calculates Monthly compound FD and tax | [src/data/portfolioData.test.ts](../../src/data/portfolioData.test.ts) | passed |
| CAL-001-065ddd7b | CAL: calculator and formatting contracts CAL-001 independently calculates Quarterly compound FD and tax | [src/data/portfolioData.test.ts](../../src/data/portfolioData.test.ts) | passed |
| CAL-001-d9a2207a | CAL: calculator and formatting contracts CAL-001 independently calculates Yearly compound FD and tax | [src/data/portfolioData.test.ts](../../src/data/portfolioData.test.ts) | passed |
| CAL-002-3040a97b | CAL: calculator and formatting contracts CAL-002 independently sums RD installments at rate 0 | [src/data/portfolioData.test.ts](../../src/data/portfolioData.test.ts) | passed |
| CAL-002-f51254c6 | CAL: calculator and formatting contracts CAL-002 independently sums RD installments at rate 6 | [src/data/portfolioData.test.ts](../../src/data/portfolioData.test.ts) | passed |
| CAL-003-3acb57d8 | CAL: calculator and formatting contracts CAL-003 zero amounts and tenure do not emit non-finite results | [src/data/portfolioData.test.ts](../../src/data/portfolioData.test.ts) | passed |
| FMT-001-58a5b892 | CAL: calculator and formatting contracts FMT-001 formats -100 | [src/data/portfolioData.test.ts](../../src/data/portfolioData.test.ts) | passed |
| FMT-001-8944750d | CAL: calculator and formatting contracts FMT-001 formats 100000 | [src/data/portfolioData.test.ts](../../src/data/portfolioData.test.ts) | passed |
| FMT-001-5d43e4f9 | CAL: calculator and formatting contracts FMT-001 formats NaN | [src/data/portfolioData.test.ts](../../src/data/portfolioData.test.ts) | passed |
| FMT-001-9ba1967f | CAL: calculator and formatting contracts FMT-001 formats null | [src/data/portfolioData.test.ts](../../src/data/portfolioData.test.ts) | passed |
| FMT-001-c4916309 | CAL: calculator and formatting contracts FMT-001 formats undefined | [src/data/portfolioData.test.ts](../../src/data/portfolioData.test.ts) | passed |
| FMT-002-2ea4b6f5 | CAL: calculator and formatting contracts FMT-002 handles signed and compact INR thresholds | [src/data/portfolioData.test.ts](../../src/data/portfolioData.test.ts) | passed |
| FMT-003-2d34c3dd | CAL: calculator and formatting contracts FMT-003 preserves local date-only values and missing dates | [src/data/portfolioData.test.ts](../../src/data/portfolioData.test.ts) | passed |
| LEG-bd6ccdf6 | planReminders excludes a reminder whose fire date has already passed | [src/data/reminders.test.ts](../../src/data/reminders.test.ts) | passed |
| LEG-d2059609 | planReminders includes a reminder whose fire date is exactly today | [src/data/reminders.test.ts](../../src/data/reminders.test.ts) | passed |
| LEG-a966dfb8 | planReminders includes the bank name and formatted maturity amount in the body | [src/data/reminders.test.ts](../../src/data/reminders.test.ts) | passed |
| LEG-b705e41f | planReminders mixes FD and RD reminders together when both are present | [src/data/reminders.test.ts](../../src/data/reminders.test.ts) | passed |
| LEG-f2c2ff94 | planReminders plans one reminder per active FD, leadDays before its maturity date | [src/data/reminders.test.ts](../../src/data/reminders.test.ts) | passed |
| LEG-2f872438 | planReminders plans one reminder per active RD, leadDays before its maturity date | [src/data/reminders.test.ts](../../src/data/reminders.test.ts) | passed |
| LEG-ce295e84 | planReminders produces a stable, deterministic id per record so re-planning updates rather than duplicates | [src/data/reminders.test.ts](../../src/data/reminders.test.ts) | passed |
| LEG-3c1a6841 | planReminders produces distinct ids for an FD and RD that happen to share a numeric id suffix | [src/data/reminders.test.ts](../../src/data/reminders.test.ts) | passed |
| LEG-a8eb27ff | planReminders returns nothing when reminders are disabled, regardless of the portfolio | [src/data/reminders.test.ts](../../src/data/reminders.test.ts) | passed |
| LEG-6206fbf5 | planReminders skips matured, closed, and prematurely-closed records | [src/data/reminders.test.ts](../../src/data/reminders.test.ts) | passed |
| LEG-f4b28138 | hashPin / verifyPin a hashed PIN verifies successfully against the same PIN | [src/data/security.test.ts](../../src/data/security.test.ts) | passed |
| LEG-93bf6321 | hashPin / verifyPin never stores the PIN itself — only a hash and salt | [src/data/security.test.ts](../../src/data/security.test.ts) | passed |
| LEG-da0c9866 | hashPin / verifyPin produces a different salt (and therefore a different hash) each time, even for the same PIN | [src/data/security.test.ts](../../src/data/security.test.ts) | passed |
| LEG-e88cc718 | hashPin / verifyPin rejects a PIN that only partially matches (prefix) | [src/data/security.test.ts](../../src/data/security.test.ts) | passed |
| LEG-e0b431ab | hashPin / verifyPin rejects a wrong PIN | [src/data/security.test.ts](../../src/data/security.test.ts) | passed |
| LEG-65c0146b | lockoutDelaySeconds caps the delay rather than growing unboundedly | [src/data/security.test.ts](../../src/data/security.test.ts) | passed |
| LEG-8c4c931e | lockoutDelaySeconds escalates the delay as failures accumulate | [src/data/security.test.ts](../../src/data/security.test.ts) | passed |
| LEG-4c91a13b | lockoutDelaySeconds imposes no delay for the first few wrong attempts | [src/data/security.test.ts](../../src/data/security.test.ts) | passed |
| LEG-1f8818b8 | lockoutDelaySeconds is monotonically non-decreasing | [src/data/security.test.ts](../../src/data/security.test.ts) | passed |
| LEG-d73dc30f | serializeStoredPin / parseStoredPin a round-tripped record still verifies the original PIN | [src/data/security.test.ts](../../src/data/security.test.ts) | passed |
| LEG-a6b1f3b1 | serializeStoredPin / parseStoredPin returns null for a missing value | [src/data/security.test.ts](../../src/data/security.test.ts) | passed |
| LEG-53e594f1 | serializeStoredPin / parseStoredPin returns null for malformed JSON rather than throwing | [src/data/security.test.ts](../../src/data/security.test.ts) | passed |
| LEG-d721d558 | serializeStoredPin / parseStoredPin returns null for well-formed JSON missing the expected shape | [src/data/security.test.ts](../../src/data/security.test.ts) | passed |
| LEG-b500ed04 | serializeStoredPin / parseStoredPin round-trips through JSON | [src/data/security.test.ts](../../src/data/security.test.ts) | passed |
| LEG-26ed0ca8 | validatePinFormat accepts a 4-8 digit numeric PIN | [src/data/security.test.ts](../../src/data/security.test.ts) | passed |
| LEG-4f73b82f | validatePinFormat rejects a PIN longer than 8 digits | [src/data/security.test.ts](../../src/data/security.test.ts) | passed |
| LEG-b9073b54 | validatePinFormat rejects a PIN shorter than 4 digits | [src/data/security.test.ts](../../src/data/security.test.ts) | passed |
| LEG-c13749ed | validatePinFormat rejects an empty string | [src/data/security.test.ts](../../src/data/security.test.ts) | passed |
| LEG-da219948 | validatePinFormat rejects non-numeric input | [src/data/security.test.ts](../../src/data/security.test.ts) | passed |
| BUG-008-39721c72 | BUG-008 overflowing principal or installment must fail validation | [src/data/validation.boundaries.test.ts](../../src/data/validation.boundaries.test.ts) | failed |
| VAL-001-2c829aae | VAL-001 negative tenure -1 is rejected for both deposit types | [src/data/validation.boundaries.test.ts](../../src/data/validation.boundaries.test.ts) | passed |
| VAL-001-8a060e80 | VAL-001 negative tenure -12 is rejected for both deposit types | [src/data/validation.boundaries.test.ts](../../src/data/validation.boundaries.test.ts) | passed |
| VAL-002-9c413d3c | VAL-002 blank, NaN and rate bounds fail consistently for RD | [src/data/validation.boundaries.test.ts](../../src/data/validation.boundaries.test.ts) | passed |
| LEG-b6c7674b | validateFdDraft accepts a fully filled-in draft | [src/data/validation.test.ts](../../src/data/validation.test.ts) | passed |
| LEG-165425b6 | validateFdDraft accepts a rate of exactly 0 or 30 | [src/data/validation.test.ts](../../src/data/validation.test.ts) | passed |
| LEG-e07a8234 | validateFdDraft accepts a tenure expressed only in days | [src/data/validation.test.ts](../../src/data/validation.test.ts) | passed |
| LEG-0892a245 | validateFdDraft rejects a deposit date after the start date | [src/data/validation.test.ts](../../src/data/validation.test.ts) | passed |
| LEG-09a8b6a6 | validateFdDraft rejects a non-numeric principal (the exact C2 bug: typing garbage silently saved ₹0) | [src/data/validation.test.ts](../../src/data/validation.test.ts) | passed |
| LEG-7d6dd651 | validateFdDraft rejects a rate outside 0-30% | [src/data/validation.test.ts](../../src/data/validation.test.ts) | passed |
| LEG-c400919f | validateFdDraft rejects a zero or negative principal | [src/data/validation.test.ts](../../src/data/validation.test.ts) | passed |
| LEG-5049c854 | validateFdDraft rejects a zero tenure (all of years/months/days blank or 0) | [src/data/validation.test.ts](../../src/data/validation.test.ts) | passed |
| LEG-849f40ea | validateFdDraft requires fdNumber and bankName | [src/data/validation.test.ts](../../src/data/validation.test.ts) | passed |
| LEG-9fc3336d | validateRdDraft accepts a fully filled-in draft | [src/data/validation.test.ts](../../src/data/validation.test.ts) | passed |
| LEG-0e785b16 | validateRdDraft accepts installmentsPaid equal to the full tenure | [src/data/validation.test.ts](../../src/data/validation.test.ts) | passed |
| LEG-e8957b82 | validateRdDraft rejects a non-numeric or non-positive monthly instalment | [src/data/validation.test.ts](../../src/data/validation.test.ts) | passed |
| LEG-f0e8ce46 | validateRdDraft rejects a zero tenure | [src/data/validation.test.ts](../../src/data/validation.test.ts) | passed |
| LEG-4bb7cdd4 | validateRdDraft rejects installmentsPaid greater than the total tenure in months | [src/data/validation.test.ts](../../src/data/validation.test.ts) | passed |
| LEG-67e242f0 | validateRdDraft requires rdNumber and bankName | [src/data/validation.test.ts](../../src/data/validation.test.ts) | passed |
| REF-001-88cafd7d | REF-001 exposes loading until reload completes | [src/hooks/useRefresh.test.tsx](../../src/hooks/useRefresh.test.tsx) | passed |
| REF-002-749c698c | REF-002 resets loading even if reload rejects | [src/hooks/useRefresh.test.tsx](../../src/hooks/useRefresh.test.tsx) | passed |
| NAV-001-0121c1a2 | NAV-001 suppresses navigation before ready and forwards route parameters when ready | [src/navigation/navigationRef.test.ts](../../src/navigation/navigationRef.test.ts) | passed |
| NAV-002-c44369c7 | NAV-002 back requires readiness and a back history entry | [src/navigation/navigationRef.test.ts](../../src/navigation/navigationRef.test.ts) | passed |
| UI-001-ed053fd0 | UI rendering in dark theme UI-001 AddEditFdScreen displays its expected content | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-001-eb45d098 | UI rendering in dark theme UI-001 AddEditRdScreen displays its expected content | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-001-8a95502f | UI rendering in dark theme UI-001 BackupRestoreScreen displays its expected content | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-001-86338b02 | UI rendering in dark theme UI-001 CalculatorsHubScreen displays its expected content | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-001-45bbba7f | UI rendering in dark theme UI-001 ClearDataScreen displays its expected content | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-001-959e2af8 | UI rendering in dark theme UI-001 FdCalculatorScreen displays its expected content | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-001-c1112e83 | UI rendering in dark theme UI-001 FdDetailScreen displays its expected content | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-001-dc78634c | UI rendering in dark theme UI-001 HomeScreen displays its expected content | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-001-c45986ae | UI rendering in dark theme UI-001 LockScreen displays its expected content | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-001-75963f34 | UI rendering in dark theme UI-001 MainTabsScreen displays its expected content | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-001-bbe269a6 | UI rendering in dark theme UI-001 MaturityTimelineScreen displays its expected content | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-001-778372de | UI rendering in dark theme UI-001 MoreScreen displays its expected content | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-001-23cd576c | UI rendering in dark theme UI-001 NotificationsScreen displays its expected content | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-001-8e345b43 | UI rendering in dark theme UI-001 PayoutsScreen displays its expected content | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-001-7efd5075 | UI rendering in dark theme UI-001 PinSetupScreen displays its expected content | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-001-ee740fc5 | UI rendering in dark theme UI-001 PortfolioScreen displays its expected content | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-001-7365eb02 | UI rendering in dark theme UI-001 RdCalculatorScreen displays its expected content | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-001-16ef4eb2 | UI rendering in dark theme UI-001 RdDetailScreen displays its expected content | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-001-1d2ce9f8 | UI rendering in dark theme UI-001 ReminderSettingsScreen displays its expected content | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-001-37c126f6 | UI rendering in dark theme UI-001 SecuritySettingsScreen displays its expected content | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-001-d9cb57e6 | UI rendering in light theme UI-001 AddEditFdScreen displays its expected content | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-001-210bde77 | UI rendering in light theme UI-001 AddEditRdScreen displays its expected content | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-001-05d9e482 | UI rendering in light theme UI-001 BackupRestoreScreen displays its expected content | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-001-d590c084 | UI rendering in light theme UI-001 CalculatorsHubScreen displays its expected content | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-001-d9f273b8 | UI rendering in light theme UI-001 ClearDataScreen displays its expected content | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-001-db991f5e | UI rendering in light theme UI-001 FdCalculatorScreen displays its expected content | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-001-d47666c1 | UI rendering in light theme UI-001 FdDetailScreen displays its expected content | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-001-e79f3e69 | UI rendering in light theme UI-001 HomeScreen displays its expected content | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-001-887cfab7 | UI rendering in light theme UI-001 LockScreen displays its expected content | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-001-e3c396f9 | UI rendering in light theme UI-001 MainTabsScreen displays its expected content | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-001-de976dd1 | UI rendering in light theme UI-001 MaturityTimelineScreen displays its expected content | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-001-d2803b48 | UI rendering in light theme UI-001 MoreScreen displays its expected content | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-001-26062fc1 | UI rendering in light theme UI-001 NotificationsScreen displays its expected content | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-001-bcd37bda | UI rendering in light theme UI-001 PayoutsScreen displays its expected content | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-001-4b2b7c11 | UI rendering in light theme UI-001 PinSetupScreen displays its expected content | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-001-86a716ac | UI rendering in light theme UI-001 PortfolioScreen displays its expected content | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-001-fd676e34 | UI rendering in light theme UI-001 RdCalculatorScreen displays its expected content | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-001-07d66504 | UI rendering in light theme UI-001 RdDetailScreen displays its expected content | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-001-6c6fc61f | UI rendering in light theme UI-001 ReminderSettingsScreen displays its expected content | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-001-bfde3fc6 | UI rendering in light theme UI-001 SecuritySettingsScreen displays its expected content | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| BUG-007-0fe6a979 | UI user interactions BUG-007 matured FD offers renewal for its pending renewal decision | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | failed |
| UI-002-9f4fdcd8 | UI user interactions UI-002 calculator hub routes to both calculators | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-003-b23eed92 | UI user interactions UI-003 HomeScreen shows load error and retry | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-003-dbfab17c | UI user interactions UI-003 PortfolioScreen shows load error and retry | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-004-aa496154 | UI user interactions UI-004 HomeScreen loading and empty states exclude saved content | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-004-49cb867c | UI user interactions UI-004 PortfolioScreen loading and empty states exclude saved content | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-005-d23df082 | UI user interactions UI-005 portfolio search, FD/RD tabs and record navigation | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-006-7dd39466 | UI user interactions UI-006 FdDetailScreen edit and delete target the record | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-006-870d49c4 | UI user interactions UI-006 RdDetailScreen edit and delete target the record | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-007-55afc599 | UI user interactions UI-007 FdDetailScreen missing record shows fallback | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-007-dfa2f5bd | UI user interactions UI-007 RdDetailScreen missing record shows fallback | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-008-e6343fc4 | UI user interactions UI-008 AddEditFdScreen validates before saving and forwards draft changes | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-008-56791562 | UI user interactions UI-008 AddEditRdScreen validates before saving and forwards draft changes | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-009-fc319425 | UI user interactions UI-009 FdCalculatorScreen shows calculated results and forwards input changes | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-009-8450a080 | UI user interactions UI-009 RdCalculatorScreen shows calculated results and forwards input changes | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-010-4760f957 | UI user interactions UI-010 More changes theme, profile and routes to backup | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-011-6fdbb8db | UI user interactions UI-011 clear data requires typed confirmation | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-012-17a0c82f | UI user interactions UI-012 backup plaintext export and import buttons invoke actions | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-013-c4f4fed7 | UI user interactions UI-013 reminders show denial feedback and persist selected lead days | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-014-e25bf233 | UI user interactions UI-014 security setup and configured grace controls | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-015-d3970d8a | UI user interactions UI-015 PIN setup rejects mismatch then saves a matching PIN | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-016-8ac84413 | UI user interactions UI-016 lock filters input, submits PIN and displays rejection | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-017-f2e5e65e | UI user interactions UI-017 Main tabs exposes accessible tabs and add-deposit FAB | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-018-57d67878 | UI user interactions UI-018 notifications and timeline retain FD/RD navigation links | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-019-f7f420ea | UI user interactions UI-019 payouts select the associated deposit | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-020-93a1d360 | UI user interactions UI-020 confirmation exposes primary, secondary and cancel actions | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-021-e5e3ec00 | UI user interactions UI-021 select control opens options and forwards selection | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-022-4911a211 | UI user interactions UI-022 Android date picker preserves local calendar date and ignores cancellation | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-023-bf423dc8 | UI user interactions UI-023 encrypted export validates passphrase length and confirmation | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-024-0c7582fb | UI user interactions UI-024 Main pager commits swipe destination and ignores out-of-range offsets | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| UI-025-4419508a | UI user interactions UI-025 expanded deposit details show stored fields and toggle actions | [src/screens/screens.test.tsx](../../src/screens/screens.test.tsx) | passed |
| APP-001-aa9c5409 | APP: provider orchestration APP-001 hydrates records and persisted preferences | [src/state/AppContext.test.tsx](../../src/state/AppContext.test.tsx) | passed |
| APP-002-1f2c0c90 | APP: provider orchestration APP-002 load failure can be retried | [src/state/AppContext.test.tsx](../../src/state/AppContext.test.tsx) | passed |
| APP-003-3a284325 | APP: provider orchestration APP-003 changes filters, tabs and resets filters | [src/state/AppContext.test.tsx](../../src/state/AppContext.test.tsx) | passed |
| APP-004-2e23c57e | APP: provider orchestration APP-004 persists theme/name and updates calculator fields and detail toggles | [src/state/AppContext.test.tsx](../../src/state/AppContext.test.tsx) | passed |
| APP-005-6242466a | APP: provider orchestration APP-005 toast replacement resets expiration | [src/state/AppContext.test.tsx](../../src/state/AppContext.test.tsx) | passed |
| APP-006-9c023674 | APP: provider orchestration APP-006 adds and edits FD with stored numeric fields | [src/state/AppContext.test.tsx](../../src/state/AppContext.test.tsx) | passed |
| APP-006-1673eca0 | APP: provider orchestration APP-006 adds and edits RD with stored numeric fields | [src/state/AppContext.test.tsx](../../src/state/AppContext.test.tsx) | passed |
| APP-007-77094a4d | APP: provider orchestration APP-007 missing FD draft cannot be saved | [src/state/AppContext.test.tsx](../../src/state/AppContext.test.tsx) | passed |
| APP-007-9972a6b1 | APP: provider orchestration APP-007 missing RD draft cannot be saved | [src/state/AppContext.test.tsx](../../src/state/AppContext.test.tsx) | passed |
| APP-008-a8f0d144 | APP: provider orchestration APP-008 confirmation cancellation preserves FD | [src/state/AppContext.test.tsx](../../src/state/AppContext.test.tsx) | passed |
| APP-008-2b7263e5 | APP: provider orchestration APP-008 confirmation cancellation preserves RD | [src/state/AppContext.test.tsx](../../src/state/AppContext.test.tsx) | passed |
| APP-009-8608451a | APP: provider orchestration APP-009 closes, renews and deletes FD | [src/state/AppContext.test.tsx](../../src/state/AppContext.test.tsx) | passed |
| APP-009-99a4cae4 | APP: provider orchestration APP-009 closes, renews and deletes RD | [src/state/AppContext.test.tsx](../../src/state/AppContext.test.tsx) | passed |
| APP-010-8181d2ba | APP: provider orchestration APP-010 denied reminders remain disabled; enabling/disabling and lead time persist | [src/state/AppContext.test.tsx](../../src/state/AppContext.test.tsx) | passed |
| APP-011-70563a5d | APP: provider orchestration APP-011 export writes, shares and cleans up; failures reset busy state | [src/state/AppContext.test.tsx](../../src/state/AppContext.test.tsx) | passed |
| APP-012-71456977 | APP: provider orchestration APP-012 encrypted export serializes encrypted payload | [src/state/AppContext.test.tsx](../../src/state/AppContext.test.tsx) | passed |
| APP-013-3b41389a | APP: provider orchestration APP-013 import cancellation, malformed text and read failures clear busy state | [src/state/AppContext.test.tsx](../../src/state/AppContext.test.tsx) | passed |
| APP-014-c3c17786 | APP: provider orchestration APP-014 import overwrite waits for confirmation and applies selected mode | [src/state/AppContext.test.tsx](../../src/state/AppContext.test.tsx) | passed |
| APP-014-e925954d | APP: provider orchestration APP-014 import skip waits for confirmation and applies selected mode | [src/state/AppContext.test.tsx](../../src/state/AppContext.test.tsx) | passed |
| APP-015-d1b2acc6 | APP: provider orchestration APP-015 import transaction failure reports unchanged existing data | [src/state/AppContext.test.tsx](../../src/state/AppContext.test.tsx) | passed |
| APP-016-8e8f4a16 | APP: provider orchestration APP-016 encrypted import supports wrong-passphrase retry and cancellation | [src/state/AppContext.test.tsx](../../src/state/AppContext.test.tsx) | passed |
| APP-017-cc22dae1 | APP: provider orchestration APP-017 clear-all resets lock state and reloads; failures report error | [src/state/AppContext.test.tsx](../../src/state/AppContext.test.tsx) | passed |
| APP-018-7a967bac | APP: provider orchestration APP-018 maps action navigation to correct routes and IDs | [src/state/AppContext.test.tsx](../../src/state/AppContext.test.tsx) | passed |
| APP-019-c831d356 | APP: provider orchestration APP-019 foreground resynchronizes reminders and settings failures do not reject UI actions | [src/state/AppContext.test.tsx](../../src/state/AppContext.test.tsx) | passed |
| APP-020-db3565a9 | APP: provider orchestration APP-020 import confirmation cancellation discards pending data | [src/state/AppContext.test.tsx](../../src/state/AppContext.test.tsx) | passed |
| BUG-003-e3b4bef4 | APP: provider orchestration BUG-003 foreground return recomputes time-dependent portfolio values | [src/state/AppContext.test.tsx](../../src/state/AppContext.test.tsx) | failed |
| BUG-004-1731c920 | APP: provider orchestration BUG-004 failed save must not leave an unpersisted record in the portfolio | [src/state/AppContext.test.tsx](../../src/state/AppContext.test.tsx) | failed |
| BUG-006-dd962a40 | APP: provider orchestration BUG-006 renewal uses the maturity date promised by the confirmation dialog | [src/state/AppContext.test.tsx](../../src/state/AppContext.test.tsx) | failed |
| BUG-005-bdd68e77 | LOCK: security provider BUG-005 inactive then background must preserve the original grace-period start | [src/state/LockContext.test.tsx](../../src/state/LockContext.test.tsx) | failed |
| LOCK-001-de03364c | LOCK: security provider LOCK-001 fresh install starts unlocked, configured install starts locked | [src/state/LockContext.test.tsx](../../src/state/LockContext.test.tsx) | passed |
| LOCK-002-7acadf3a | LOCK: security provider LOCK-002 invalid setup is rejected without hashing or persistence | [src/state/LockContext.test.tsx](../../src/state/LockContext.test.tsx) | passed |
| LOCK-003-dad3a685 | LOCK: security provider LOCK-003 setup stores only serialized hash and enables lock | [src/state/LockContext.test.tsx](../../src/state/LockContext.test.tsx) | passed |
| LOCK-004-18d69854 | LOCK: security provider LOCK-004 changing PIN verifies current PIN and validates new format | [src/state/LockContext.test.tsx](../../src/state/LockContext.test.tsx) | passed |
| LOCK-005-87cf34be | LOCK: security provider LOCK-005 disable requires correct PIN and clears biometric preference | [src/state/LockContext.test.tsx](../../src/state/LockContext.test.tsx) | passed |
| LOCK-006-9e6ad913 | LOCK: security provider LOCK-006 wrong attempts trigger lockout, successful PIN clears attempts | [src/state/LockContext.test.tsx](../../src/state/LockContext.test.tsx) | passed |
| LOCK-007-cada3939 | LOCK: security provider LOCK-007 persisted lockout survives hydration | [src/state/LockContext.test.tsx](../../src/state/LockContext.test.tsx) | passed |
| LOCK-008-f62349e5 | LOCK: security provider LOCK-008 biometric cancellation preserves counters, success unlocks | [src/state/LockContext.test.tsx](../../src/state/LockContext.test.tsx) | passed |
| LOCK-009-b88250f8 | LOCK: security provider LOCK-009 grace boundary at 29999 milliseconds | [src/state/LockContext.test.tsx](../../src/state/LockContext.test.tsx) | passed |
| LOCK-009-a042d4ae | LOCK: security provider LOCK-009 grace boundary at 30000 milliseconds | [src/state/LockContext.test.tsx](../../src/state/LockContext.test.tsx) | passed |
| LOCK-010-418c716f | LOCK: security provider LOCK-010 persists preferences and resets lock state after external wipe | [src/state/LockContext.test.tsx](../../src/state/LockContext.test.tsx) | passed |
| LOCK-011-e3a77459 | LOCK: security provider LOCK-011 reports unavailable biometrics and propagates failed PIN persistence | [src/state/LockContext.test.tsx](../../src/state/LockContext.test.tsx) | passed |
| SEL-001-8c5ca724 | SEL: portfolio selectors SEL-001 searches bank, number and holder: fd001 | [src/state/selectors.test.ts](../../src/state/selectors.test.ts) | passed |
| SEL-001-619f73a8 | SEL: portfolio selectors SEL-001 searches bank, number and holder: jane | [src/state/selectors.test.ts](../../src/state/selectors.test.ts) | passed |
| SEL-001-71fdde56 | SEL: portfolio selectors SEL-001 searches bank, number and holder: test bank | [src/state/selectors.test.ts](../../src/state/selectors.test.ts) | passed |
| SEL-002-26c9e1d1 | SEL: portfolio selectors SEL-002 supports RD search and combined filters without mutating input | [src/state/selectors.test.ts](../../src/state/selectors.test.ts) | passed |
| SEL-003-4b6463e8 | SEL: portfolio selectors SEL-003 prioritizes active maturities over closed records | [src/state/selectors.test.ts](../../src/state/selectors.test.ts) | passed |
| SEL-004-d4762a1a | SEL: portfolio selectors SEL-004 aggregates invested amount, active counts and distributions | [src/state/selectors.test.ts](../../src/state/selectors.test.ts) | passed |
| SEL-005-ec2c2241 | SEL: portfolio selectors SEL-005 groups payout date boundaries with overdue precedence | [src/state/selectors.test.ts](../../src/state/selectors.test.ts) | passed |
| SEL-006-bf0ac192 | SEL: portfolio selectors SEL-006 projects only interest over six months with a nonzero display floor | [src/state/selectors.test.ts](../../src/state/selectors.test.ts) | passed |
| SEL-007-cc1abb65 | SEL: portfolio selectors SEL-007 timeline excludes closed and distant maturities and shows renewal badges | [src/state/selectors.test.ts](../../src/state/selectors.test.ts) | passed |
| SEL-008-0d5db292 | SEL: portfolio selectors SEL-008 decorations respect theme and urgency (dark) | [src/state/selectors.test.ts](../../src/state/selectors.test.ts) | passed |
| SEL-008-b8739465 | SEL: portfolio selectors SEL-008 decorations respect theme and urgency (light) | [src/state/selectors.test.ts](../../src/state/selectors.test.ts) | passed |
| SEL-009-f12bf9a1 | SEL: portfolio selectors SEL-009 statements show elapsed payouts newest first | [src/state/selectors.test.ts](../../src/state/selectors.test.ts) | passed |
| SEL-010-d723ff6a | SEL: portfolio selectors SEL-010 draft estimates handle payout, numeric strings and empty input | [src/state/selectors.test.ts](../../src/state/selectors.test.ts) | passed |
| SEL-011-f5fe590f | SEL: portfolio selectors SEL-011 avatars are deterministic and notifications retain record links | [src/state/selectors.test.ts](../../src/state/selectors.test.ts) | passed |
| THM-001-01b15dcf | THM-001 changes tokens with the selected theme | [src/theme/ThemeContext.test.tsx](../../src/theme/ThemeContext.test.tsx) | passed |

## Manual Android checklist

All 25 cases below are **not run**. Use a disposable app profile or emulator; never wipe a personal portfolio for validation. Record app build/revision, device model, Android/API, local date/timezone, tester, result, timestamp, screenshot/log evidence, and bug ID for each executed case.

Synthetic data: FD-A = FD001, Test Bank, Jane Doe, principal 100000, 7% quarterly, start/deposit 2026-01-01, tenure 1 year, payout At Maturity. RD-A = RD001, Test Bank, installment 5000, 6.5% quarterly, start 2026-01-01, tenure 12 months, 6 paid. Use synthetic account 1234567890. For zero-rate calculator checks RD-A maturity is 60000. Use emulator clock changes for historical dates, not a personal device clock.

### AND-001

- Prerequisites/data: Fresh disposable Android app profile.
- Steps: Cold launch in airplane mode; visit all tabs.
- Expected: Empty portfolio renders, calculators work, and no network-dependent flow blocks use.
- Result: **not run**; tester/time/evidence: pending.

### AND-002

- Prerequisites/data: Synthetic FD-A and RD-A saved.
- Steps: Force-stop and relaunch the test app; reopen details.
- Expected: Entered fields and settings persist; derived values reflect the device date.
- Result: **not run**; tester/time/evidence: pending.

### AND-003

- Prerequisites/data: Synthetic FD-A and RD-A.
- Steps: Edit principal/installments, close a record, cancel then confirm deletion; relaunch.
- Expected: Only confirmed actions persist and linked screens remain consistent.
- Result: **not run**; tester/time/evidence: pending.

### AND-004

- Prerequisites/data: Emulator clock control; RD-M starts 31 January 2026, tenure 12 months.
- Steps: Set emulator date to 28 February 2026; inspect installment due/missed and next installment date.
- Expected: February installment is due on 28 February. Known BUG-002 may fail.
- Result: **not run**; tester/time/evidence: pending.

### AND-005

- Prerequisites/data: Future-start RD-F with zero installments paid.
- Steps: Open its detail before the start date.
- Expected: No missed installment or overdue warning before start. Known BUG-001 may fail.
- Result: **not run**; tester/time/evidence: pending.

### AND-006

- Prerequisites/data: FD-A loaded; emulator clock control.
- Steps: Background the test app; advance the emulator one day; foreground and inspect totals/status/days.
- Expected: All date-dependent values refresh. Known BUG-003 may fail.
- Result: **not run**; tester/time/evidence: pending.

### AND-007

- Prerequisites/data: Android notification permission undecided; FD-N matures device-today + 2 days.
- Steps: Enable reminders, grant permission, select 1-day lead, inspect OS notification settings.
- Expected: Permission is requested when enabling; app reports enabled and a local reminder is scheduled.
- Result: **not run**; tester/time/evidence: pending.

### AND-008

- Prerequisites/data: Permission undecided or denied.
- Steps: Enable reminders and deny the OS prompt.
- Expected: Reminder switch remains off and actionable denial feedback appears.
- Result: **not run**; tester/time/evidence: pending.

### AND-009

- Prerequisites/data: Reminders enabled and permission initially granted.
- Steps: Revoke permission in Android Settings; return to app and reopen Reminder Settings.
- Expected: Permission warning reflects the current OS state; no claim of successful delivery.
- Result: **not run**; tester/time/evidence: pending.

### AND-010

- Prerequisites/data: FD-N; permission granted; test clock before the adapter fire time.
- Steps: Select 1-day lead and wait/advance only emulator clock to the scheduled day/time.
- Expected: One reminder arrives with correct bank and FD identifier. Record actual timestamp and notification screenshot.
- Result: **not run**; tester/time/evidence: pending.

### AND-011

- Prerequisites/data: FD-N reminder scheduled.
- Steps: Change lead days, edit maturity, then delete FD-N; inspect pending/delivered notifications.
- Expected: Scheduled reminders update without duplicates; deleted deposit reminder is cancelled.
- Result: **not run**; tester/time/evidence: pending.

### AND-012

- Prerequisites/data: Test emulator/device with scheduled reminder.
- Steps: Reboot; reopen app before due time and verify rescheduling; separately reboot without reopening.
- Expected: Reopening reconciles reminders. Delivery without reopening is a documented unsupported behavior, not a new defect.
- Result: **not run**; tester/time/evidence: pending.

### AND-013

- Prerequisites/data: Disposable profile; no PIN configured.
- Steps: Set matching PIN, relaunch, enter incorrect then correct PIN; change and disable PIN with current PIN.
- Expected: No portfolio flashes before unlock; only correct PIN changes/disables lock.
- Result: **not run**; tester/time/evidence: pending.

### AND-014

- Prerequisites/data: PIN configured; grace set to 30 seconds.
- Steps: Switch away for 29 seconds and return; repeat for at least 30 seconds; test inactive then background transition.
- Expected: Unlock remains within grace and locks at its boundary. Known BUG-005 may fail for staged transitions.
- Result: **not run**; tester/time/evidence: pending.

### AND-015

- Prerequisites/data: PIN configured; no lockout yet.
- Steps: Submit wrong PIN five times, restart during lockout, retry correct PIN before and after expiry.
- Expected: Attempts and expiry persist; retry blocked during lockout and accepted afterward.
- Result: **not run**; tester/time/evidence: pending.

### AND-016

- Prerequisites/data: Device supports biometrics, enrollment present, PIN configured.
- Steps: Enable biometrics; relaunch; accept, cancel, and fail scans; use PIN fallback.
- Expected: Successful scan unlocks; cancellation/failure leaves app locked without incrementing PIN attempts.
- Result: **not run**; tester/time/evidence: pending.

### AND-017

- Prerequisites/data: Device with no supported/enrolled biometrics.
- Steps: Open security settings and locked screen.
- Expected: No unusable biometric shortcut; PIN remains available.
- Result: **not run**; tester/time/evidence: pending.

### AND-018

- Prerequisites/data: FD-A/RD-A saved; file-sharing target installed.
- Steps: Export plaintext JSON; save it; reopen with picker and inspect preview; cancel restore.
- Expected: File has correct synthetic data; cancellation makes no portfolio changes; temporary cache file is cleaned up after sharing.
- Result: **not run**; tester/time/evidence: pending.

### AND-019

- Prerequisites/data: Synthetic backup; passphrase sample-passphrase.
- Steps: Export encrypted backup; import; try wrong passphrase, then correct passphrase.
- Expected: Encrypted file lacks plaintext portfolio fields; wrong passphrase preserves retry; correct passphrase opens preview.
- Result: **not run**; tester/time/evidence: pending.

### AND-020

- Prerequisites/data: Backup contains existing FD-A with edited remarks and new FD-B.
- Steps: Restore with skip-existing; repeat with overwrite; relaunch.
- Expected: Skip keeps FD-A unchanged and adds FD-B; overwrite changes FD-A; unrelated records remain.
- Result: **not run**; tester/time/evidence: pending.

### AND-021

- Prerequisites/data: Backup screen open.
- Steps: Cancel picker/share; choose malformed JSON and unsupported-version files.
- Expected: Cancellation is harmless; invalid files show feedback and make no database changes.
- Result: **not run**; tester/time/evidence: pending.

### AND-022

- Prerequisites/data: All screens accessible; light/dark themes.
- Steps: Switch themes, relaunch, increase font scale; inspect forms/charts/dialogs while scrolling.
- Expected: Theme persists; essential text/actions remain readable and reachable without clipping.
- Result: **not run**; tester/time/evidence: pending.

### AND-023

- Prerequisites/data: Screen reader enabled; forms and navigation accessible.
- Steps: Navigate tabs, read labels and selected state, enter numeric/date fields, dismiss keyboard, press hardware Back in sheets/details/lock.
- Expected: Controls have understandable labels/states; Back closes sheets or returns appropriately and cannot bypass lock.
- Result: **not run**; tester/time/evidence: pending.

### AND-024

- Prerequisites/data: Disposable profile with backup, PIN, reminders and deposits.
- Steps: Type a wrong confirmation, then DELETE; confirm wipe; relaunch.
- Expected: Wrong text disables deletion; confirmed wipe removes all deposits/settings and resets lock/reminders.
- Result: **not run**; tester/time/evidence: pending.

### AND-025

- Prerequisites/data: FD-A active and a separate matured FD.
- Steps: Read renewal confirmation and renew; attempt renewal on matured FD.
- Expected: Renewal date matches displayed promise and matured renewal is available. Known BUG-006/007 may fail.
- Result: **not run**; tester/time/evidence: pending.

### IOS-001

On a macOS/Xcode environment, execute the corresponding persistence, file-picker, sharing, biometric and date-picker scenarios on iOS. Result: **unverified / not run**; this Windows host cannot execute iOS.

