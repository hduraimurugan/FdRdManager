import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { GRADIENT_ANGLE } from '../theme/colors';
import { IconWarning } from './icons/Icons';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

// Catches a render-time crash anywhere below it and shows a recovery screen instead of
// the blank white screen a release build otherwise shows on an unhandled render error.
// getDerivedStateFromError/componentDidCatch only exist on class components — there is
// no hook equivalent — so this stays a class despite the rest of the app being function
// components. Wraps RootNavigator in App.tsx, inside ThemeProvider/AppProvider, so its
// fallback (a function component) can still use useTheme() normally.
export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: { componentStack?: string | null }) {
    // No crash-reporting SDK by design (see the privacy audit — this app collects
    // nothing). __DEV__ logging is the only visibility into what crashed.
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('ErrorBoundary caught a render error:', error, info.componentStack);
    }
  }

  reset = () => this.setState({ hasError: false });

  render() {
    if (this.state.hasError) {
      return <ErrorBoundaryFallback onRetry={this.reset} />;
    }
    return this.props.children;
  }
}

function ErrorBoundaryFallback({ onRetry }: { onRetry: () => void }) {
  const theme = useTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: theme.bg }]}>
      <View style={[styles.iconWrap, { backgroundColor: 'rgba(226,73,90,0.1)' }]}>
        <IconWarning size={28} color={theme.danger} />
      </View>
      <Text style={[styles.title, { color: theme.text }]}>Something went wrong</Text>
      <Text style={[styles.subtitle, { color: theme.textMuted }]}>
        The app hit an unexpected error. Your saved FDs and RDs are safe — they live in the on-device database, not in
        this screen.
      </Text>
      <Pressable onPress={onRetry} style={styles.btnWrap} testID="error-boundary-retry">
        <LinearGradient colors={theme.gradientAccent.colors} start={GRADIENT_ANGLE.start} end={GRADIENT_ANGLE.end} style={styles.btn}>
          <Text style={styles.btnText}>Try again</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 10,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 17,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 20,
  },
  btnWrap: {
    marginTop: 10,
  },
  btn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  btnText: {
    color: '#fff',
    fontFamily: fontFamily.semibold,
    fontSize: 14.5,
  },
});
