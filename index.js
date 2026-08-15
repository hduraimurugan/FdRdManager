/**
 * @format
 */

// Must be the very first import: polyfills crypto.getRandomValues, which @noble/hashes
// and @noble/ciphers (PIN hashing, encrypted backups) require and Hermes doesn't provide
// natively. Every other module that touches src/data/security.ts or backupCrypto.ts
// needs this already installed before it runs.
import 'react-native-get-random-values';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
