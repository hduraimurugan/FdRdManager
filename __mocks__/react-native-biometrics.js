// Jest manual mock for react-native-biometrics — no biometric hardware exists in the
// Jest environment. Defaults to "no sensor available", which is what the real module
// would report on a plain CI runner/simulator with nothing enrolled; tests that need
// biometrics "available" and "matched" override the mocked methods per-test.

class ReactNativeBiometrics {
  constructor() {
    this.isSensorAvailable = jest.fn(async () => ({ available: false }));
    this.createKeys = jest.fn(async () => ({ publicKey: 'mock-public-key' }));
    this.biometricKeysExist = jest.fn(async () => ({ keysExist: false }));
    this.deleteKeys = jest.fn(async () => ({ keysDeleted: true }));
    this.createSignature = jest.fn(async () => ({ success: true, signature: 'mock-signature' }));
    this.simplePrompt = jest.fn(async () => ({ success: false }));
    // biometrics.ts constructs exactly one instance at module load — tests reach into
    // that same instance's jest.fn()s (via __lastInstance) to control each case's outcome.
    module.exports.__lastInstance = this;
  }
}

module.exports = ReactNativeBiometrics;
module.exports.default = ReactNativeBiometrics;
module.exports.__lastInstance = null;
module.exports.TouchID = 'TouchID';
module.exports.FaceID = 'FaceID';
module.exports.Biometrics = 'Biometrics';
module.exports.BiometryTypes = { TouchID: 'TouchID', FaceID: 'FaceID', Biometrics: 'Biometrics' };
