/**
 * FD/RD Portfolio Manager
 * @format
 */

import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useAppState } from './src/state/AppContext';
import { LockProvider, useLockState } from './src/state/LockContext';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import RootNavigator from './src/navigation/RootNavigator';
import ToastOverlay from './src/components/ToastOverlay';
import ConfirmDialog from './src/components/ConfirmDialog';
import ErrorBoundary from './src/components/ErrorBoundary';
import LockScreen from './src/screens/LockScreen';

function Root() {
  const themeTokens = useTheme();
  const { status } = useLockState();
  return (
    <>
      <StatusBar barStyle={themeTokens.mode === 'dark' ? 'light-content' : 'dark-content'} />
      {status === 'checking' ? (
        // Never render the real app while it's still unknown whether a lock is
        // required — briefly showing portfolio content before locking would defeat
        // the whole point of the lock.
        <View style={[styles.flex, { backgroundColor: themeTokens.bg }]} />
      ) : status === 'locked' ? (
        <LockScreen />
      ) : (
        <>
          <ErrorBoundary>
            <RootNavigator />
          </ErrorBoundary>
          <ToastOverlay />
          <ConfirmDialog />
        </>
      )}
    </>
  );
}

function ThemedApp() {
  const { theme } = useAppState();
  return (
    <ThemeProvider mode={theme}>
      <Root />
    </ThemeProvider>
  );
}

function App() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <LockProvider>
          <AppProvider>
            <ThemedApp />
          </AppProvider>
        </LockProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});

export default App;
