import { isBiometricAvailable, promptBiometric } from './biometrics';

// biometrics.ts constructs its one ReactNativeBiometrics instance at module load; the
// manual mock (__mocks__/react-native-biometrics.js) stashes that instance so tests can
// reach into its jest.fn()s to control each case's outcome.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mockInstance: any = require('react-native-biometrics').__lastInstance;

describe('isBiometricAvailable', () => {
  it('reports unavailable when no sensor is enrolled (the mock default)', async () => {
    const result = await isBiometricAvailable();
    expect(result.available).toBe(false);
  });

  it('reports available with the sensor type when the native module says so', async () => {
    mockInstance.isSensorAvailable.mockResolvedValueOnce({ available: true, biometryType: 'Biometrics' });
    const result = await isBiometricAvailable();
    expect(result).toEqual({ available: true, biometryType: 'Biometrics' });
  });

  it('resolves unavailable rather than throwing if the native call rejects', async () => {
    mockInstance.isSensorAvailable.mockRejectedValueOnce(new Error('native error'));
    await expect(isBiometricAvailable()).resolves.toEqual({ available: false });
  });
});

describe('promptBiometric', () => {
  it('resolves true when the user authenticates successfully', async () => {
    mockInstance.simplePrompt.mockResolvedValueOnce({ success: true });
    await expect(promptBiometric('Unlock')).resolves.toBe(true);
  });

  it('resolves false (not throws) when the user cancels', async () => {
    mockInstance.simplePrompt.mockResolvedValueOnce({ success: false });
    await expect(promptBiometric('Unlock')).resolves.toBe(false);
  });

  it('resolves false (not throws) on a native error, so callers can always fall back to PIN', async () => {
    mockInstance.simplePrompt.mockRejectedValueOnce(new Error('native error'));
    await expect(promptBiometric('Unlock')).resolves.toBe(false);
  });
});
