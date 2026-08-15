import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { GRADIENT_ANGLE } from '../theme/colors';
import { useLockActions, useLockState } from '../state/LockContext';
import { IconBank } from '../components/icons/Icons';

// The full-screen gate rendered by App.tsx in place of the whole app while
// useLockState().status === 'locked'. Not part of the navigation stack — there is
// deliberately no back button or route out of it other than a correct unlock.
export default function LockScreen() {
  const theme = useTheme();
  const state = useLockState();
  const actions = useLockActions();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(actions.lockoutSecondsRemaining());

  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => setLockoutSeconds(actions.lockoutSecondsRemaining()), 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds, actions]);

  // Offer biometric automatically on mount, once, if it's set up — the user can still
  // fall back to the PIN field underneath without doing anything.
  useEffect(() => {
    if (state.biometricEnabled && state.biometricAvailable) {
      actions.unlockWithBiometric();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (candidate: string) => {
    if (lockoutSeconds > 0 || checking) return;
    setChecking(true);
    setError(null);
    const ok = await actions.unlockWithPin(candidate);
    setChecking(false);
    if (!ok) {
      setPin('');
      const remaining = actions.lockoutSecondsRemaining();
      setLockoutSeconds(remaining);
      setError(remaining > 0 ? `Too many attempts — try again in ${remaining}s` : 'Incorrect PIN');
    }
  };

  return (
    <View style={[styles.wrap, { backgroundColor: theme.bg }]}>
      <View style={[styles.iconWrap, { backgroundColor: 'rgba(111,102,232,0.13)' }]}>
        <IconBank size={26} color={theme.accent} />
      </View>
      <Text style={[styles.title, { color: theme.text }]}>Enter your PIN</Text>
      <Text style={[styles.subtitle, { color: theme.textMuted }]}>FD/RD Manager is locked</Text>

      <TextInput
        value={pin}
        onChangeText={text => {
          const digits = text.replace(/\D/g, '').slice(0, 8);
          setPin(digits);
          setError(null);
          if (digits.length >= 4) submit(digits);
        }}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={8}
        autoFocus
        editable={lockoutSeconds <= 0 && !checking}
        style={[styles.pinInput, { backgroundColor: theme.inputBg, borderColor: error ? theme.danger : theme.border, color: theme.text }]}
        placeholder="PIN"
        placeholderTextColor={theme.textFaint}
      />

      {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}

      {state.biometricEnabled && state.biometricAvailable && (
        <Pressable onPress={() => actions.unlockWithBiometric()} style={styles.biometricBtnWrap}>
          <LinearGradient colors={theme.gradientAccent.colors} start={GRADIENT_ANGLE.start} end={GRADIENT_ANGLE.end} style={styles.biometricBtn}>
            <Text style={styles.biometricBtnText}>Use biometric unlock</Text>
          </LinearGradient>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 8,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    marginBottom: 18,
  },
  pinInput: {
    width: '100%',
    maxWidth: 220,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    textAlign: 'center',
    fontSize: 22,
    letterSpacing: 8,
    fontFamily: fontFamily.semibold,
  },
  error: {
    marginTop: 12,
    fontFamily: fontFamily.medium,
    fontSize: 13,
    textAlign: 'center',
  },
  biometricBtnWrap: {
    marginTop: 24,
  },
  biometricBtn: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
  },
  biometricBtnText: {
    color: '#fff',
    fontFamily: fontFamily.semibold,
    fontSize: 14,
  },
});
