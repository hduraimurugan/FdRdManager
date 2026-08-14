# FD/RD Portfolio Manager

A React Native app for tracking Fixed Deposit (FD) and Recurring Deposit (RD) investments: portfolio overview, per-deposit detail, payout/maturity tracking, standalone FD/RD calculators, and light/dark theming. Built with React Native 0.87 (New Architecture), TypeScript, and React Navigation.

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Running the app](#running-the-app)
  - [Run on Android](#run-on-android)
  - [Run on iOS](#run-on-ios)
- [Windows: known Android build issue](#windows-known-android-build-issue)
- [Metro connection issues on a physical device](#metro-connection-issues-on-a-physical-device)
- [Everyday scripts](#everyday-scripts)
- [Demo data & app states](#demo-data--app-states)
- [Known limitations](#known-limitations)
- [Troubleshooting](#troubleshooting)

## Features

- **Home** — invested/current-value/interest/maturity summary, bank & type distribution, 6-month interest projection, upcoming maturities.
- **Portfolio** — FD/RD tabs with search, filter (bank/type/status), and sort; add/edit/close/renew a deposit.
- **Payouts** — overdue, due-today, this-week, this-month and upcoming payouts/installments, grouped.
- **Calculators** — standalone FD (simple vs. compound) and RD calculators, independent of your saved data.
- **Notifications** & **Maturity timeline** — cross-linked to the relevant FD/RD.
- **More** — light/dark theme toggle, and a demo-state switch (normal / loading / error) for reviewing every screen's states.

All data is local mock data (see [Demo data & app states](#demo-data--app-states)) — there is no backend.

## Tech stack

- React Native 0.87, React 19, TypeScript
- [`@react-navigation/native-stack`](https://reactnavigation.org/) for navigation (a single stack; the bottom tab bar is a custom component driven by app state, not a separate navigator)
- `react-native-svg` for icons and the investment-by-type donut chart
- `react-native-linear-gradient` for all gradient fills
- `react-native-safe-area-context`, `react-native-screens`, `react-native-gesture-handler`
- Bundled **Inter** font (Regular/Medium/SemiBold/Bold/ExtraBold), linked natively for both platforms
- App state via a single `useReducer`-based context (`src/state/AppContext.tsx`) — no Redux/MobX/Zustand

## Project structure

```
App.tsx                     Root: providers, navigation, global overlays (toast, confirm dialog)
src/
  assets/fonts/              Bundled Inter .ttf files
  components/                Shared UI (Card, TopAppBar, BottomTabBar, FilterSheet, forms, icons/...)
  data/portfolioData.ts       Mock FDs/RDs/events/notifications + formatting & FD/RD calculators
  navigation/                 Stack navigator, route param types, imperative nav ref
  screens/                    One file per screen (Home, Portfolio, FdDetail, AddEditFD, ...)
  state/
    AppContext.tsx            App state (useReducer) + actions
    selectors.ts               Derived/decorated view data (status colors, filtering, metrics, charts)
  theme/                      Light/dark color tokens, gradients, font family constants
```

## Prerequisites

Follow React Native's official [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide for your OS and target platform first. You'll need:

- Node.js ≥ 22.11 (see `engines` in `package.json`)
- **Android**: Android Studio, an Android SDK (this project targets whatever `compileSdk`/`minSdk` are set in `android/build.gradle`), and either an emulator or a USB-connected device with debugging enabled
- **iOS** (macOS only): Xcode + CocoaPods

## Setup

```sh
npm install
```

**iOS only** — install native pods (first clone, and again whenever native dependencies change):

```sh
bundle install
bundle exec pod install
```

Android needs no separate native-dependency install step — Gradle resolves everything on first build.

## Running the app

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

## Windows: known Android build issue

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

## Metro connection issues on a physical device

If the app installs but shows a red **"Unable to load script"** screen, Metro either isn't running or can't reach the device:

1. Make sure Metro is running — either via `npm run android` (which starts it automatically) or a standalone `npm start`.
2. If you're on a **USB-connected physical device**, forward the Metro port:
   ```sh
   adb reverse tcp:8081 tcp:8081
   ```
3. If you're on **Wi-Fi**, open the in-app Dev Menu (shake the device, or `adb shell input keyevent 82`) → **Settings** → **Debug server host & port for device**, and set it to your computer's LAN IP and port `8081`.
4. Then reload the app (press <kbd>R</kbd> twice, or tap **Reload** on the error screen).

## Everyday scripts

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

## Demo data & app states

All FD/RD records, events, and notifications are static mock data in `src/data/portfolioData.ts`, anchored to a fixed "today" (`TODAY = new Date('2026-08-10')`) so the maturity/payout urgency logic is deterministic. Adding, editing, renewing, or closing a deposit updates in-memory state only — nothing persists across app restarts.

The **More** tab has a "Preview app states" control (Normal / Loading / Error) that switches the Home and Portfolio screens between their normal, loading-skeleton, and error states — useful for visually reviewing all three without needing a real backend.

## Known limitations

- **Date fields** (deposit/start dates, calculator inputs) are plain text inputs constrained to `YYYY-MM-DD`, not a native date picker.
- **No persistence** — app state resets on restart/reload.
- **No backend** — all data is local mock data.

## Troubleshooting

For issues not covered above, see React Native's own [Troubleshooting guide](https://reactnative.dev/docs/troubleshooting) and [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide.
