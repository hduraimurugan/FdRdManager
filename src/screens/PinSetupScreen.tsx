import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { useLockActions } from '../state/LockContext';
import { useAppActions } from '../state/AppContext';
import { RootStackParamList } from '../navigation/types';
import TopAppBar from '../components/TopAppBar';
import Card from '../components/Card';

type Props = NativeStackScreenProps<RootStackParamList, 'PinSetup'>;

type Step = 'current' | 'new' | 'confirm';

export default function PinSetupScreen({ route }: Props) {
  const theme = useTheme();
  const lockActions = useLockActions();
  const appActions = useAppActions();
  const { mode } = route.params;

  const steps = useMemo<Step[]>(() => (mode === 'change' ? ['current', 'new', 'confirm'] : ['new', 'confirm']), [mode]);
  const [stepIndex, setStepIndex] = useState(0);
  const step = steps[stepIndex];

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<React.ElementRef<typeof TextInput>>(null);

  // The TextInput never unmounts between steps (same JSX position each render), so
  // `autoFocus` only fires once on the very first step — refocus manually on every
  // step change so the user isn't left tapping the field again each time.
  useEffect(() => {
    inputRef.current?.focus();
  }, [step]);

  const stepLabel: Record<Step, string> = {
    current: 'Enter your current PIN',
    new: mode === 'change' ? 'Enter a new PIN' : 'Choose a PIN',
    confirm: 'Confirm your new PIN',
  };

  const handleChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 8);
    setValue(digits);
    setError(null);
    if (digits.length < 4) return;

    if (step === 'current') {
      setCurrentPin(digits);
      setValue('');
      setStepIndex(i => i + 1);
      return;
    }
    if (step === 'new') {
      setNewPin(digits);
      setValue('');
      setStepIndex(i => i + 1);
      return;
    }
    if (step === 'confirm') {
      if (digits !== newPin) {
        setError("PINs don't match — start over");
        setValue('');
        setNewPin('');
        setStepIndex(steps.indexOf('new'));
        return;
      }
      finish(digits);
    }
  };

  const finish = async (confirmedPin: string) => {
    setBusy(true);
    try {
      if (mode === 'setup') {
        const result = await lockActions.setupPin(confirmedPin);
        if (result.ok) {
          appActions.showToast('App lock enabled');
          appActions.back();
        } else {
          setError(result.error);
          setValue('');
          setStepIndex(steps.indexOf('new'));
        }
      } else {
        const result = await lockActions.changePin(currentPin, confirmedPin);
        if (result.ok) {
          appActions.showToast('PIN changed');
          appActions.back();
        } else {
          setError(result.error);
          setValue('');
          setCurrentPin('');
          setNewPin('');
          setStepIndex(0);
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.flex, { backgroundColor: theme.bg }]}>
      <TopAppBar title={mode === 'change' ? 'Change PIN' : 'Set up PIN'} showBack onBack={appActions.back} />
      <View style={styles.container}>
        <Card style={styles.card}>
          <Text style={[styles.label, { color: theme.text }]}>{stepLabel[step]}</Text>
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={handleChange}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={8}
            autoFocus
            editable={!busy}
            style={[styles.pinInput, { backgroundColor: theme.inputBg, borderColor: error ? theme.danger : theme.border, color: theme.text }]}
            placeholder="PIN"
            placeholderTextColor={theme.textFaint}
          />
          {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
          <Text style={[styles.hint, { color: theme.textFaint }]}>4-8 digits</Text>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    padding: 16,
  },
  card: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 28,
  },
  label: {
    fontFamily: fontFamily.semibold,
    fontSize: 15,
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
    marginTop: 6,
  },
  error: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    textAlign: 'center',
  },
  hint: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
  },
});
