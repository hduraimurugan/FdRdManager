import React, { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { useAppActions } from '../state/AppContext';
import { GRACE_PERIOD_OPTIONS, useLockActions, useLockState } from '../state/LockContext';
import { GRADIENT_ANGLE } from '../theme/colors';
import Card from '../components/Card';
import TopAppBar from '../components/TopAppBar';
import BottomSheet from '../components/BottomSheet';

const GRACE_LABELS: Record<number, string> = {
  0: 'Immediately',
  30: 'After 30 seconds',
  60: 'After 1 minute',
  300: 'After 5 minutes',
};

export default function SecuritySettingsScreen() {
  const theme = useTheme();
  const appActions = useAppActions();
  const lockState = useLockState();
  const lockActions = useLockActions();
  const [disableSheetOpen, setDisableSheetOpen] = useState(false);
  const [disablePin, setDisablePin] = useState('');
  const [disableError, setDisableError] = useState<string | null>(null);

  const confirmDisable = async () => {
    const ok = await lockActions.disableLock(disablePin);
    if (ok) {
      setDisableSheetOpen(false);
      setDisablePin('');
      setDisableError(null);
      appActions.showToast('App lock turned off');
    } else {
      setDisableError('Incorrect PIN');
      setDisablePin('');
    }
  };

  if (!lockState.pinConfigured) {
    return (
      <View style={[styles.flex, { backgroundColor: theme.bg }]}>
        <TopAppBar title="Security" showBack onBack={appActions.back} />
        <View style={styles.container}>
          <Card style={styles.introCard}>
            <Text style={[styles.title, { color: theme.text }]}>App lock is off</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>
              Set a PIN to require unlocking before anyone can open FD/RD Manager or see your saved deposits.
            </Text>
            <Pressable onPress={() => appActions.goPinSetup('setup')} style={styles.ctaShadowWrap}>
              <LinearGradient colors={theme.gradientAccent.colors} start={GRADIENT_ANGLE.start} end={GRADIENT_ANGLE.end} style={styles.cta}>
                <Text style={styles.ctaText}>Set up PIN</Text>
              </LinearGradient>
            </Pressable>
          </Card>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.bg }]}>
      <TopAppBar title="Security" showBack onBack={appActions.back} />
      <View style={styles.container}>
        <Card style={styles.listCard}>
          <View style={[styles.row, { borderBottomColor: theme.divider, borderBottomWidth: 1 }]}>
            <Text style={[styles.rowLabel, { color: theme.text }]}>App lock</Text>
            <Switch
              value={lockState.lockEnabled}
              onValueChange={enabled => {
                if (enabled) return; // already on to reach this screen's main view; nothing to do
                setDisableSheetOpen(true);
              }}
            />
          </View>
          <Pressable onPress={() => appActions.goPinSetup('change')} style={[styles.row, { borderBottomColor: theme.divider, borderBottomWidth: 1 }]}>
            <Text style={[styles.rowLabel, { color: theme.text }]}>Change PIN</Text>
          </Pressable>
          {lockState.biometricAvailable && (
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: theme.text }]}>Biometric unlock</Text>
              <Switch value={lockState.biometricEnabled} onValueChange={lockActions.setBiometricEnabled} />
            </View>
          )}
        </Card>

        <View>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Lock after leaving the app</Text>
          <Card style={styles.listCard}>
            {GRACE_PERIOD_OPTIONS.map((seconds, i) => (
              <Pressable
                key={seconds}
                onPress={() => lockActions.setGraceSeconds(seconds)}
                style={[styles.row, i < GRACE_PERIOD_OPTIONS.length - 1 ? { borderBottomColor: theme.divider, borderBottomWidth: 1 } : null]}
              >
                <Text style={[styles.rowLabel, { color: theme.text }]}>{GRACE_LABELS[seconds]}</Text>
                {lockState.graceSeconds === seconds && <View style={[styles.dot, { backgroundColor: theme.accent }]} />}
              </Pressable>
            ))}
          </Card>
        </View>
      </View>

      <BottomSheet visible={disableSheetOpen} onClose={() => setDisableSheetOpen(false)}>
        <Text style={[styles.sheetTitle, { color: theme.text }]}>Turn off app lock?</Text>
        <Text style={[styles.sheetSubtitle, { color: theme.textMuted }]}>Enter your PIN to confirm.</Text>
        <TextInput
          value={disablePin}
          onChangeText={text => {
            setDisablePin(text.replace(/\D/g, '').slice(0, 8));
            setDisableError(null);
          }}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={8}
          autoFocus
          style={[styles.pinInput, { backgroundColor: theme.inputBg, borderColor: disableError ? theme.danger : theme.border, color: theme.text }]}
          placeholder="PIN"
          placeholderTextColor={theme.textFaint}
        />
        {disableError ? <Text style={[styles.error, { color: theme.danger }]}>{disableError}</Text> : null}
        <Pressable onPress={confirmDisable} style={styles.sheetBtnWrap}>
          <LinearGradient colors={theme.gradientAccent.colors} start={GRADIENT_ANGLE.start} end={GRADIENT_ANGLE.end} style={styles.cta}>
            <Text style={styles.ctaText}>Turn off app lock</Text>
          </LinearGradient>
        </Pressable>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    padding: 16,
    gap: 16,
  },
  introCard: {
    gap: 10,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 19,
  },
  listCard: {
    padding: 0,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 14.5,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  sectionLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  ctaShadowWrap: {
    marginTop: 6,
    borderRadius: 14,
  },
  cta: {
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: 14,
  },
  ctaText: {
    fontFamily: fontFamily.semibold,
    fontSize: 14.5,
    color: '#fff',
  },
  sheetTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    marginBottom: 16,
  },
  pinInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    textAlign: 'center',
    fontSize: 20,
    letterSpacing: 8,
    fontFamily: fontFamily.semibold,
    marginBottom: 8,
  },
  error: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    marginBottom: 8,
  },
  sheetBtnWrap: {
    marginTop: 8,
  },
});
