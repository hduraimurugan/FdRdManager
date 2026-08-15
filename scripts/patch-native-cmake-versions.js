#!/usr/bin/env node
// Runs as a postinstall step (see package.json) to fix a Windows-only native-build
// failure that a root-project Gradle override turned out not to be able to fix.
//
// android/app/build.gradle pins CMake to 3.31.6 for the app's own native build,
// because the AGP-bundled default (3.22.1) ships ninja 1.10.2, which predates ninja's
// long-path support and fails with "manifest 'build.ninja' still dirty after 100
// tries" on this project's Windows path lengths, regardless of the Windows
// LongPathsEnabled registry setting — see the README's "Windows: known Android build
// issue" section for the full explanation. That pin only covers the :app module,
// though. Third-party native modules pulled in from node_modules (react-native-
// gesture-handler, react-native-screens, @op-engineering/op-sqlite as of this writing)
// configure their own externalNativeBuild block and don't know to ask for a newer
// CMake, so they hit the same failure — confirmed for op-sqlite specifically in a
// release build, whose longer .cxx/RelWithDebInfo/... intermediate path (vs debug's
// shorter .cxx/Debug/...) is what actually crosses the path-length threshold.
//
// The natural fix — overriding cmake.version from the root android/build.gradle via a
// `subprojects { ... }` block — doesn't work: AGP locks that DSL property once a
// module's own build.gradle has set it (or left it unset), and throws
// AgpDslLockedException: "It is too late to set version" for any later attempt,
// including from Gradle's own afterEvaluate hook. Patching each affected module's
// build.gradle directly, reapplied by this script after every `npm install` (since
// node_modules isn't version-controlled), is the standard, supported way around that.
//
// Safe to run repeatedly: skipped entirely on non-Windows (the ninja bug is Windows-
// path-length-specific) and skipped per-file if that file is already patched.

const fs = require('fs');
const path = require('path');

if (process.platform !== 'win32') {
  process.exit(0);
}

const CMAKE_VERSION = '3.31.6';
const TARGETS = [
  'node_modules/react-native-gesture-handler/android/build.gradle',
  'node_modules/react-native-screens/android/build.gradle',
  'node_modules/@op-engineering/op-sqlite/android/build.gradle',
];

const repoRoot = path.resolve(__dirname, '..');
let patchedCount = 0;

for (const relativePath of TARGETS) {
  const filePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(filePath)) continue; // dependency removed/renamed since this list was written

  const original = fs.readFileSync(filePath, 'utf8');
  if (original.includes(`version "${CMAKE_VERSION}"`) || original.includes(`version '${CMAKE_VERSION}'`)) {
    continue; // already patched
  }

  // Matches the `path "..."` line inside a `cmake { }` block and appends a `version`
  // line right after it, preserving that line's own indentation.
  const pattern = /^([ \t]*)path\s+["'][^"']*CMakeLists\.txt["']\s*$/m;
  if (!pattern.test(original)) {
    console.warn(`[patch-native-cmake-versions] Could not find an externalNativeBuild cmake "path" line in ${relativePath} — skipping. If this module's Gradle file changed shape, this script may need updating.`);
    continue;
  }

  const patched = original.replace(pattern, (match, indent) => `${match}\n${indent}version "${CMAKE_VERSION}"`);
  fs.writeFileSync(filePath, patched, 'utf8');
  patchedCount += 1;
  console.log(`[patch-native-cmake-versions] Pinned CMake ${CMAKE_VERSION} in ${relativePath}`);
}

if (patchedCount > 0) {
  console.log(`[patch-native-cmake-versions] Done — ${patchedCount} file(s) patched.`);
}
