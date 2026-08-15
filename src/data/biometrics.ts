// Thin native wrapper around react-native-biometrics, kept separate from security.ts
// (pure PIN logic) the same way backupIO.ts is kept separate from backupSchema.ts — so
// the pure logic can be unit tested without mocking a native module.
//
// react-native-biometrics depends only on androidx.biometric (AndroidX/Jetpack) on
// Android and LocalAuthentication (Apple's own framework) on iOS — no Google Play
// Services or Firebase in its dependency tree, so it doesn't compromise F-Droid builds.

import ReactNativeBiometrics, { BiometryType } from 'react-native-biometrics';

const rnBiometrics = new ReactNativeBiometrics({ allowDeviceCredentials: false });

export interface BiometricAvailability {
  available: boolean;
  biometryType?: BiometryType;
}

export async function isBiometricAvailable(): Promise<BiometricAvailability> {
  try {
    const result = await rnBiometrics.isSensorAvailable();
    return { available: result.available, biometryType: result.biometryType };
  } catch {
    return { available: false };
  }
}

/** Shows the OS biometric prompt. Resolves true only if the user authenticated —
 * cancellation, a failed scan, or any native error all resolve false, never throw, so
 * callers can always fall back to PIN entry without a try/catch. */
export async function promptBiometric(promptMessage: string): Promise<boolean> {
  try {
    const result = await rnBiometrics.simplePrompt({ promptMessage, cancelButtonText: 'Use PIN instead' });
    return result.success === true;
  } catch {
    return false;
  }
}
