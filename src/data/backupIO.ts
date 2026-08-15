// Native file/share/pick orchestration for backup export & import. Kept separate
// from backupSchema.ts (pure logic) so the validator can be unit tested without
// mocking native modules.
//
// Android only for now — iOS has no special handling here and hasn't been
// exercised; react-native-share and @react-native-documents/picker both ship
// iOS support, but wiring/testing it needs a Mac (pod install, Xcode).

import { CachesDirectoryPath, writeFile, unlink } from '@dr.pogodin/react-native-fs';
import Share from 'react-native-share';
import { pick, types, errorCodes, isErrorWithCode } from '@react-native-documents/picker';

export async function writeBackupFile(json: string, filename: string): Promise<string> {
  const path = `${CachesDirectoryPath}/${filename}`;
  await writeFile(path, json, 'utf8');
  return path;
}

export async function shareBackupFile(path: string, filename: string): Promise<void> {
  try {
    await Share.open({
      url: 'file://' + path,
      type: 'application/json',
      filename,
      failOnCancel: false,
    });
  } catch {
    // User cancelled, or the share sheet itself failed — the backup file is
    // already safely written to disk either way, so there's nothing to report.
  }
}

/** Removes the exported backup from the cache directory once it's been handed to the
 * share sheet. The file briefly held every field in the user's portfolio (account
 * numbers, holder names) in plaintext or encrypted form — no reason to leave it sitting
 * in cache indefinitely once the share flow is done with it. Safe to call even if the
 * share sheet already cleaned it up itself; a missing file is not an error here. */
export async function deleteBackupFile(path: string): Promise<void> {
  try {
    await unlink(path);
  } catch {
    // Already gone, or the OS is still holding a handle open via the share sheet —
    // either way there's nothing actionable for the caller to do.
  }
}

/** Returns the picked file's text content, or null if the user cancelled. */
export async function pickBackupFileText(): Promise<string | null> {
  let picked;
  try {
    [picked] = await pick({ type: [types.json, types.allFiles] });
  } catch (err) {
    if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) return null;
    throw err;
  }
  // RN's fetch supports content:// (Android) and file:// (iOS) URIs directly —
  // no need to copy the picked file into app storage first just to read it.
  const response = await fetch(picked.uri);
  return response.text();
}
