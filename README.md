<p align="center">
  <img src="fastlane/metadata/android/en-US/images/icon.png" width="110" alt="FD/RD Manager app icon">
</p>

<h1 align="center">FD/RD Manager</h1>

<p align="center">
  Track Fixed Deposits &amp; Recurring Deposits — 100% offline, no ads, no trackers, no account.
</p>

<p align="center">
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-blue.svg"></a>
  <img alt="Platform: Android" src="https://img.shields.io/badge/platform-Android-3DDC84?logo=android&logoColor=white">
  <img alt="Made with React Native" src="https://img.shields.io/badge/Made%20with-React%20Native-61DAFB?logo=react&logoColor=white">
  <img alt="Min SDK 24" src="https://img.shields.io/badge/API-24%2B-brightgreen">
  <img alt="No internet permission" src="https://img.shields.io/badge/permissions-1%20(notifications%20only)-success">
</p>

<p align="center">
  <a href="https://github.com/hduraimurugan/FdRdManager/releases/latest/download/app-release.apk">
    <img alt="Download APK" src="https://img.shields.io/badge/Download-APK-6C4CE0?style=for-the-badge&logo=android&logoColor=white">
  </a>
</p>

FD/RD Manager is a React Native app for tracking Fixed Deposit (FD) and Recurring Deposit (RD) investments: portfolio overview, per-deposit detail, payout/maturity tracking, standalone FD/RD calculators, and light/dark theming. Everything you enter stays on your device — there is no backend, no account, and no data ever leaves your phone.

## Contents

- [Download](#download)
- [Why FD/RD Manager](#why-fdrd-manager)
- [Features](#features)
- [Privacy & permissions](#privacy--permissions)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Building from source](#building-from-source)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)
  - [Run on Android](#run-on-android)
  - [Run on iOS](#run-on-ios)
  - [Windows: known Android build issue](#windows-known-android-build-issue)
  - [Metro connection issues on a physical device](#metro-connection-issues-on-a-physical-device)
  - [Everyday scripts](#everyday-scripts)
  - [Release signing](#release-signing)
- [Data & persistence](#data--persistence)
- [Maturity reminders](#maturity-reminders)
- [Known limitations](#known-limitations)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Download

| | |
|---|---|
| **Latest release (APK)** | [Download the latest signed APK](https://github.com/hduraimurugan/FdRdManager/releases/latest/download/app-release.apk) |
| **All releases** | [github.com/hduraimurugan/FdRdManager/releases](https://github.com/hduraimurugan/FdRdManager/releases) |
| **Requirements** | Android 7.0 (API 24) or newer |

The APK is self-signed with this project's own release key (see [Release signing](#release-signing)) — it is **not** distributed through Google Play or F-Droid, so you'll need to allow "install from unknown sources" for your browser/file manager. Every release is built from this exact source tree; you're welcome to [build it yourself](#building-from-source) instead and compare.

## Why FD/RD Manager

- **Fully offline.** No network calls at runtime — the release build ships with no `INTERNET` permission at all (see [Privacy & permissions](#privacy--permissions)).
- **No ads, no analytics, no accounts.** Nothing to sign up for, nothing being measured.
- **Your data stays yours.** Local SQLite storage on-device, with encrypted export/import when you want a backup.
- **Open source.** MIT-licensed — read every line, or [build it from source](#building-from-source).

## Features

- **Home** — invested/current-value/interest/maturity summary, bank & type distribution, 6-month interest projection, upcoming maturities.
- **Portfolio** — FD/RD tabs with search, filter (bank/type/status), and sort; add/edit/delete/close/renew a deposit.
- **Bank selection** — offline searchable directory of 116 public, private, small-finance, regional rural, and foreign banks in India; search abbreviations such as SBI or enter an unlisted bank manually. Text badges replace bank artwork throughout the app. Existing bank names and backups stay compatible.
- **Payouts** — overdue, due-today, this-week, this-month and upcoming payouts/installments, grouped.
- **Calculators** — standalone FD (simple vs. compound) and RD calculators, independent of your saved data.
- **Notifications** & **Maturity timeline** — cross-linked to the relevant FD/RD.
- **Notification reminders** — optional on-device OS alerts for maturity, auto-renewal, missed RD installments, and all interest/maturity payouts. Choose an additional maturity reminder 1/3/7/14 days before maturity.
- **App lock** — optional PIN, with optional biometric unlock as a shortcut; lock-on-background with a configurable grace period.
- **Backup & Restore** — export to a JSON file (optionally passphrase-encrypted with AES-256-GCM) and restore from one, with a preview of new vs. overwritten records and a choice to skip existing ones.
- **Delete all data** — a typed-confirmation full wipe (More → Data).
- **More** — light/dark theme toggle (persisted).

## Privacy & permissions

FD/RD Manager is built on the same principle most F-Droid apps hold to: the app should only ask for what it strictly needs, and nothing about your finances should leave your device.

| Permission | Why |
|---|---|
| `POST_NOTIFICATIONS` | Requested at runtime on Android 13+ only when you turn on [maturity reminders](#maturity-reminders); required by Android to show any local notification. |

That's the only permission in the release manifest. There is **no `INTERNET` permission** — the app cannot make network calls even if it wanted to — and no analytics, crash-reporting, or ad SDKs are bundled. `android:allowBackup="false"` also keeps your data out of Android's cloud auto-backup.

The one caveat: the on-device SQLite database itself is **not encrypted at rest** (app-private storage keeps it away from other apps, but a rooted device or a raw ADB backup could read it). See [Known limitations](#known-limitations).

## Tech stack

- React Native 0.87, React 19, TypeScript
- [`@react-navigation/native-stack`](https://reactnavigation.org/) for navigation (a single stack; the bottom tab bar is a custom component driven by app state, not a separate navigator)
- `@op-engineering/op-sqlite` for on-device storage
- `@react-native-community/datetimepicker` for date entry
- `react-native-svg` for icons and the investment-by-type donut chart
- `react-native-linear-gradient` for all gradient fills
- `react-native-safe-area-context`, `react-native-screens`, `react-native-gesture-handler`
- `@noble/hashes` + `@noble/ciphers` (pure JS/TS, no native code) for PIN hashing (PBKDF2-SHA256) and encrypted-backup crypto (AES-256-GCM); `react-native-get-random-values` polyfills the `crypto.getRandomValues` they need (Hermes doesn't provide it)
- `react-native-biometrics` for biometric unlock — depends only on AndroidX `androidx.biometric` / Apple's `LocalAuthentication`, no Google Play Services
- `@notifee/react-native` for local maturity-reminder notifications — used strictly for on-device trigger notifications, never Firebase Cloud Messaging, so it stays Google-Play-Services-free (verify this holds if the dependency is ever upgraded)
- Bundled **Inter** font (Regular/Medium/SemiBold/Bold/ExtraBold), linked natively for both platforms
- App state via a single `useReducer`-based context (`src/state/AppContext.tsx`) — no Redux/MobX/Zustand
- App-lock state lives in its own context (`src/state/LockContext.tsx`), mounted above `AppContext` so it can gate the whole app before portfolio data even loads

## Project structure

```
App.tsx                     Root: providers, navigation, global overlays (toast, confirm dialog), lock gate
src/
  assets/fonts/              Bundled Inter .ttf files
  components/                Shared UI (Card, TopAppBar, BottomTabBar, FilterSheet, forms, DateField, icons/...)
  data/
    finance.ts                 Single source of truth for all date/interest math (FD/RD maturity, compounding, payouts)
    portfolioData.ts          Types, reference lists (banks/types/...), formatters — delegates calculations to finance.ts
    validation.ts              Add/Edit FD/RD form validation (pure)
    db.ts                     SQLite repository — the ONLY module that talks to the database
    derive.ts                 Turns stored rows + today's date into live values, events, notifications
    backupSchema.ts            Backup envelope, validation, duplicate-detection/preview (pure)
    backupCrypto.ts            Passphrase-encrypted backup payloads: PBKDF2 + AES-256-GCM (pure)
    backupIO.ts                 Native file write/share/pick orchestration for backups
    security.ts                 PIN hashing (PBKDF2-SHA256) + lockout-delay schedule (pure)
    biometrics.ts               Thin wrapper around react-native-biometrics
    reminders.ts                 Which maturity-reminder notifications should exist right now (pure)
    notifeeClient.ts            Native notification scheduling (channel, permission, trigger notifications)
  navigation/                 Stack navigator, route param types, imperative nav ref
  screens/                    One file per screen (Home, Portfolio, FdDetail, AddEditFD, LockScreen, ...)
  state/
    AppContext.tsx            Portfolio app state (useReducer), persistence wiring, actions
    LockContext.tsx             App-lock state (PIN/biometric/grace period) — separate from AppContext
    selectors.ts               Derived/decorated view data (status colors, filtering, metrics, charts)
  theme/                      Light/dark color tokens, gradients, font family constants
```

## Building from source

### Prerequisites

Follow React Native's official [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide for your OS and target platform first. You'll need:

- Node.js ≥ 22.11 (see `engines` in `package.json`)
- **Android**: Android Studio, an Android SDK (this project targets whatever `compileSdk`/`minSdk` are set in `android/build.gradle`), and either an emulator or a USB-connected device with debugging enabled
- **iOS** (macOS only): Xcode + CocoaPods

### Setup

```sh
npm install
```

**iOS only** — install native pods (first clone, and again whenever native dependencies change):

```sh
bundle install
bundle exec pod install
```

Android needs no separate native-dependency install step — Gradle resolves everything on first build.

### Run on Android

```sh
npm run android
```

This starts Metro and the Android build/install in one command (via `concurrently`) — no separate `npm start` needed. Metro keeps running in the same terminal afterward for live reload; leave it open. First build will be slow (native code compile); subsequent builds are much faster.

If you'd rather run Metro separately (e.g. in its own terminal), use `npm start` and `npm run android:build` instead.

> **On Windows**, read [Windows: known Android build issue](#windows-known-android-build-issue) before your first build — a stock setup will fail here.

### Run on iOS

```sh
npm start
```

Leave this running in its own terminal, then in a second terminal:

```sh
npm run ios
```

### Windows: known Android build issue

This project pulls in several native modules (`react-native-gesture-handler`, `react-native-screens`, `react-native-svg`, `react-native-safe-area-context`) that go through New Architecture C++ codegen during the Android build. On Windows, the generated object-file paths for these libraries — especially `react-native-gesture-handler`, which has an unusually deep source tree — can exceed Windows' classic 260-character path limit, and the build fails with something like:

```
ninja: error: Stat(...RNGestureHandlerDetectorShadowNode.cpp.o): Filename longer than 260 characters
```

This is **not fixed by moving the project to a shorter path** — the fixed overhead from the generated build-directory structure plus the library's own nested folders adds up to more than 260 characters on its own. Two things need to both be true:

1. **Windows long-path support is enabled system-wide.** Run once, in an **Administrator** PowerShell:

   ```powershell
   New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
   git config --system core.longpaths true
   ```

   Close and reopen your terminal afterward.

2. **A CMake/ninja version new enough to respect that setting is used.** The Android SDK's default bundled CMake (3.22.1) ships ninja 1.10.2, which predates ninja's long-path support and ignores the registry setting entirely. This project pins a newer CMake in `android/app/build.gradle`:

   ```groovy
   externalNativeBuild {
       cmake {
           version "3.31.6"
       }
   }
   ```

   You need that version installed via the Android SDK manager:

   ```powershell
   & "$env:ANDROID_HOME\cmdline-tools\latest\bin\sdkmanager.bat" "cmake;3.31.6"
   ```

   (Adjust the `sdkmanager.bat` path if your SDK is installed elsewhere, e.g. `C:\Android\Sdk`.)

If you already attempted a build before doing this and it failed, clear the stale build cache once before retrying:

```powershell
Remove-Item -Recurse -Force android\app\.cxx, android\app\build, android\.gradle, android\build -ErrorAction SilentlyContinue
```

This is a one-time environment setup per machine — not something you need to redo per build. macOS/Linux are unaffected (no 260-character path limit).

#### The CMake pin above only covers the app module — third-party native modules need it too

The `android/app/build.gradle` pin fixes the app's own native build, but each of
`react-native-gesture-handler`, `react-native-screens`, and `@op-engineering/op-sqlite`
configures **its own** `externalNativeBuild` block deep in `node_modules` and has no
idea to ask for a newer CMake. Left alone, they fall back to the buggy 3.22.1 default —
which debug builds usually survive (their `.cxx/Debug/...` intermediate paths are just
short enough) but **release builds do not**: the `RelWithDebInfo` configuration's longer
intermediate path routinely crosses the 260-character limit, and you'll see the same
`ninja: error: manifest 'build.ninja' still dirty after 100 tries` failure specifically
on `./gradlew assembleRelease`/`bundleRelease`, even on a machine where debug builds
have always worked fine.

You cannot fix this from the root `android/build.gradle` — a `subprojects { }` block
that tries to set `cmake.version` on these modules throws
`AgpDslLockedException: It is too late to set version`, because AGP locks that property
once a module's own build script has run. `scripts/patch-native-cmake-versions.js`
patches each affected module's `build.gradle` directly instead, adding the same
`version "3.31.6"` line right after its `cmake { path "..." }`. It runs automatically as
this project's `postinstall` script, so a plain `npm install` keeps it applied — you
shouldn't need to think about this at all under normal use. If you add a new native
dependency that also uses CMake and hits this same release-build failure, add its
`android/build.gradle` path to the `TARGETS` array in that script.

### Metro connection issues on a physical device

If the app installs but shows a red **"Unable to load script"** screen, Metro either isn't running or can't reach the device:

1. Make sure Metro is running — either via `npm run android` (which starts it automatically) or a standalone `npm start`.
2. If you're on a **USB-connected physical device**, forward the Metro port:
   ```sh
   adb reverse tcp:8081 tcp:8081
   ```
3. If you're on **Wi-Fi**, open the in-app Dev Menu (shake the device, or `adb shell input keyevent 82`) → **Settings** → **Debug server host & port for device**, and set it to your computer's LAN IP and port `8081`.
4. Then reload the app (press <kbd>R</kbd> twice, or tap **Reload** on the error screen).

### Everyday scripts

| Command | Description |
|---|---|
| `npm start` | Start the Metro bundler on its own |
| `npm run android` | Start Metro **and** build/install/launch the Android debug build, in one command |
| `npm run android:build` | Build/install/launch Android only, assuming Metro is already running elsewhere |
| `npm run ios` | Build and run the iOS debug build (start Metro separately first) |
| `npm test` | Run the Jest test suite |
| `npm run lint` | Run ESLint |
| `npx tsc --noEmit` | Type-check the whole project |

To force-reload the running app: **Android** — press <kbd>R</kbd> twice, or open the Dev Menu with <kbd>Ctrl</kbd>/<kbd>Cmd</kbd> + <kbd>M</kbd>. **iOS** — press <kbd>R</kbd> in the Simulator.

### Release signing

Debug builds sign with the checked-in `debug.keystore` (its password really is `android` —
that's the standard, public Android debug key, not a secret). **Release builds must not
ship signed with it**: anyone can produce an APK that looks like a legitimate update.

Release signing is configured in `android/app/build.gradle` to read from
`android/keystore.properties`, which is gitignored — never commit it. Until that file
exists, `./gradlew assembleRelease`/`bundleRelease` still work (they fall back to the
debug keystore) but the output isn't submittable to any store.

To set up real release signing:

1. Generate an upload keystore (do this once, and back up the resulting `.keystore` file
   and its passwords somewhere durable — losing them is effectively permanent for a
   direct-APK or F-Droid release; Play users can recover via Play App Signing's key-reset
   process, see below):
   ```sh
   keytool -genkeypair -v -storetype PKCS12 \
     -keystore fdrdmanager-upload.keystore \
     -alias upload -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Copy `android/keystore.properties.example` to `android/keystore.properties` and fill
   in the real `storeFile` (an absolute path — keep the keystore itself **outside** the
   repo entirely, not just gitignored inside it) and the passwords/alias you set above.
3. Build: `cd android && ./gradlew bundleRelease` (AAB, for Play) or `assembleRelease`
   (APK, for direct distribution/F-Droid).

**For Google Play specifically**, enroll in
[Play App Signing](https://support.google.com/googleplay/android-developer/answer/9842756):
you upload signed with the *upload* key above, Google re-signs with an *app signing* key
it holds for you, and if you ever lose the upload key, Google's documented reset process
recovers it — the upload key alone is not a single point of permanent failure the way it
is for F-Droid (which verifies your own signature directly) or a self-distributed APK.

## Data & persistence

The app starts empty — add your own FDs and RDs from the Portfolio tab. Everything is stored on-device in a SQLite database (via `@op-engineering/op-sqlite`); nothing is bundled or pre-populated.

Only what you actually enter is persisted (bank, principal, rate, tenure, dates, etc. — see `StoredFd`/`StoredRd` in `src/data/db.ts`). Time-dependent values — maturity date/amount, current value, interest earned so far, days remaining, effective status, next payout/installment date — are **never stored**; `src/data/derive.ts` recomputes them from your stored data against the real current date every time the app reads them, so a deposit's progress is always correct, not frozen at the moment you saved it. The Home "needs attention" list, Payouts screen, and Notifications screen are all derived the same way, not separate data.

Deleting a deposit (from its detail screen, behind a confirmation dialog) permanently removes it from the database. "Delete all data" (More → Data) wipes every FD, RD, and setting — including the app-lock PIN and reminder preferences, since those live in the same `settings` table — behind a typed "DELETE" confirmation.

Theme preference is persisted too, so it survives an app restart.

If an app lock PIN is set, only its PBKDF2-SHA256 hash and a random salt are stored (`src/data/security.ts`) — never the PIN itself. The database file otherwise is **not** encrypted at rest; app-private storage plus `android:allowBackup="false"` keep it away from other apps and cloud auto-backup, but a rooted device or a raw filesystem/ADB backup extraction can still read it.

## Maturity reminders

Enable **More → Notification reminders → Device notifications** and allow notifications in phone settings. This setting covers every attention-card category and all payout dates: maturity at 30 days and the chosen lead time, auto-renewal at 14 days, maturity payouts on the due date, unresolved maturity decisions the following day, interest payouts 3 days before and on the due date, and RD installments on their due date and the following day if still unpaid. Scheduled alerts fire at 9 AM local time and can appear while the app is closed. Existing attention cards are delivered once when enabled; opening after 9 AM also catches up that day's payouts/installments.

`src/data/reminders.ts` derives the schedule from current FD/RD data. `src/state/AppContext.tsx` reconciles it via `@notifee/react-native` after portfolio/preferences changes and on foreground return, including refreshing permission after visiting phone settings. Future interest periods are planned through maturity. The nearest 50 notifications are queued (less if another feature owns pending triggers); reopening replenishes the queue. Large portfolios therefore need the app opened before that queue runs out. This follows [Notifee's timestamp-trigger limits](https://notifee.app/react-native/docs/triggers/).

A device-only delivery receipt in SQLite prevents already delivered attention alerts from repeating on each launch or after dismissal. Receipts are excluded from backup export/import so another device can deliver its own notifications. Dates and amounts are projections from your records; payments must still be updated manually. Disabling reminders or closing/deleting a deposit cancels its pending alerts. No server, Firebase, or network permission is needed.

That foreground resync is also this app's answer to "reschedule after a reboot": there is deliberately no native `BOOT_COMPLETED` receiver (that would need its own permission and native code for a feature reminders can already self-heal). **If the device reboots and you don't reopen the app before a reminder's scheduled time, that reminder won't fire.** Opening the app resyncs everything — true on every cold start and every return to the foreground.

## Known limitations

- **RD installment tracking** is manual: you record how many installments you've actually paid on the Add/Edit RD screen; the app compares that against how many are due by today's date to compute "missed" — there's no automated bank-side sync.
- **FD interest-payout tracking** is schedule-based, not receipt-tracked: "next payout" is always the next scheduled date rolled forward from the start date at the chosen frequency — there's no ledger of payouts actually received.
- **Maturity reminders don't survive a reboot you don't reopen the app after** — see [Maturity reminders](#maturity-reminders) above.
- **The on-device database is not encrypted at rest.** App lock protects the UI, not the underlying SQLite file.

## Troubleshooting

For issues not covered above, see React Native's own [Troubleshooting guide](https://reactnative.dev/docs/troubleshooting) and [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide.

## Contributing

Issues and pull requests are welcome. If you're proposing a larger change, open an issue first to discuss the approach — this keeps the "derive, don't store" and "no backend, ever" design principles intact.

## License

FD/RD Manager is licensed under the [MIT License](LICENSE).
