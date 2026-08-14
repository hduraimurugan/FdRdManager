/**
 * FD/RD Portfolio Manager
 * @format
 */

import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useAppState } from './src/state/AppContext';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import RootNavigator from './src/navigation/RootNavigator';
import ToastOverlay from './src/components/ToastOverlay';
import ConfirmDialog from './src/components/ConfirmDialog';

function Root() {
  const themeTokens = useTheme();
  return (
    <>
      <StatusBar barStyle={themeTokens.mode === 'dark' ? 'light-content' : 'dark-content'} />
      <RootNavigator />
      <ToastOverlay />
      <ConfirmDialog />
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
        <AppProvider>
          <ThemedApp />
        </AppProvider>
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
