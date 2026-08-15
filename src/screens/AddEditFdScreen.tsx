import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { useAppActions, useAppState } from '../state/AppContext';
import { fdEstimate } from '../state/selectors';
import { BANKS, FD_TYPES, COMPOUNDING_FREQUENCIES, PAYOUT_FREQUENCIES, CREDIT_METHODS } from '../data/portfolioData';
import { validateFdDraft, isValidDraft } from '../data/validation';
import { GRADIENT_ANGLE } from '../theme/colors';
import { RootStackParamList } from '../navigation/types';
import Card from '../components/Card';
import TopAppBar from '../components/TopAppBar';
import FormField from '../components/FormField';
import FormSelect from '../components/FormSelect';
import DateField from '../components/DateField';
import BankLogo from '../components/BankLogo';

type Props = NativeStackScreenProps<RootStackParamList, 'AddEditFD'>;

const EMPTY_DRAFT: Record<string, any> = {};

export default function AddEditFdScreen({ route }: Props) {
  const theme = useTheme();
  const state = useAppState();
  const actions = useAppActions();
  const { id } = route.params;
  const draft = state.editDraft || EMPTY_DRAFT;
  const estimate = useMemo(() => fdEstimate(draft), [draft]);
  const errors = useMemo(() => validateFdDraft(draft), [draft]);

  // Errors only render once a field has been touched, or once the user has tried to
  // save with the form invalid — a blank Add form shouldn't open already covered in red.
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [attempted, setAttempted] = useState(false);
  const errorFor = (field: string) => (attempted || touched[field] ? errors[field] : undefined);

  const set = (field: string) => (value: string) => {
    setTouched(t => (t[field] ? t : { ...t, [field]: true }));
    actions.setDraftField(field, value);
  };

  const handleSave = () => {
    if (!isValidDraft(errors)) {
      setAttempted(true);
      actions.showToast('Fix the highlighted fields before saving');
      return;
    }
    actions.saveDraftFD(id);
  };

  return (
    <View style={[styles.flex, { backgroundColor: theme.bg }]}>
      <TopAppBar title={id ? 'Edit FD' : 'Add FD'} showBack onBack={actions.back} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Card style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Basic details</Text>
          <FormField label="FD number" value={String(draft.fdNumber ?? '')} onChangeText={set('fdNumber')} error={errorFor('fdNumber')} />
          <FormSelect
            label="Bank"
            value={draft.bankName ?? ''}
            options={BANKS}
            onChange={set('bankName')}
            placeholder="Select bank"
            renderOptionIcon={bank => <BankLogo bankName={bank} size={28} />}
            error={errorFor('bankName')}
          />
          <FormField label="Branch" value={String(draft.branch ?? '')} onChangeText={set('branch')} />
          <FormField label="Bank account number" value={String(draft.bankAccountNumber ?? '')} onChangeText={set('bankAccountNumber')} keyboardType="number-pad" />
          <FormField label="Customer ID" value={String(draft.customerId ?? '')} onChangeText={set('customerId')} />
          <FormField label="FD holder name" value={String(draft.fdHolderName ?? '')} onChangeText={set('fdHolderName')} />
          <FormField label="Joint holder (optional)" value={String(draft.jointHolder ?? '')} onChangeText={set('jointHolder')} />
        </Card>

        <Card style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Deposit details</Text>
          <FormSelect label="FD type" value={draft.fdType ?? FD_TYPES[0]} options={FD_TYPES} onChange={set('fdType')} />
          <FormSelect label="Mode" value={draft.mode ?? 'Online'} options={['Online', 'Offline']} onChange={set('mode')} />
          <FormField label="Principal amount (₹)" value={String(draft.principalAmount ?? '')} onChangeText={set('principalAmount')} keyboardType="numeric" error={errorFor('principalAmount')} />
          <DateField label="Deposit date" value={String(draft.depositDate ?? '')} onChange={set('depositDate')} error={errorFor('depositDate')} />
          <DateField label="Start date" value={String(draft.startDate ?? '')} onChange={set('startDate')} />
        </Card>

        <Card style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Tenure &amp; interest</Text>
          <View style={styles.row3}>
            <View style={styles.flex1}>
              <FormField label="Years" value={String(draft.tenureYears ?? '')} onChangeText={set('tenureYears')} keyboardType="numeric" error={errorFor('tenureYears')} />
            </View>
            <View style={styles.flex1}>
              <FormField label="Months" value={String(draft.tenureMonths ?? '')} onChangeText={set('tenureMonths')} keyboardType="numeric" />
            </View>
            <View style={styles.flex1}>
              <FormField label="Days" value={String(draft.tenureDays ?? '')} onChangeText={set('tenureDays')} keyboardType="numeric" />
            </View>
          </View>
          <FormField label="Interest rate (% p.a.)" value={String(draft.interestRate ?? '')} onChangeText={set('interestRate')} keyboardType="numeric" error={errorFor('interestRate')} />
          <FormSelect label="Interest type" value={draft.interestType ?? 'Compound'} options={['Simple', 'Compound']} onChange={set('interestType')} />
          <FormSelect label="Compounding frequency" value={draft.compoundingFrequency ?? COMPOUNDING_FREQUENCIES[0]} options={COMPOUNDING_FREQUENCIES} onChange={set('compoundingFrequency')} />
        </Card>

        <Card style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Payout</Text>
          <FormSelect label="Interest payout frequency" value={draft.interestPayoutMode ?? PAYOUT_FREQUENCIES[0]} options={PAYOUT_FREQUENCIES} onChange={set('interestPayoutMode')} />
          <FormSelect label="Interest credit method" value={draft.interestCreditMethod ?? CREDIT_METHODS[0]} options={CREDIT_METHODS} onChange={set('interestCreditMethod')} />
        </Card>

        <Card style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Renewal</Text>
          <FormSelect label="Auto-renew" value={draft.autoRenewal ?? 'No'} options={['Yes', 'No']} onChange={set('autoRenewal')} />
          <FormSelect
            label="Renewal instruction"
            value={draft.renewalOption ?? 'Do Not Renew'}
            options={['Do Not Renew', 'Renew Principal Only', 'Renew Principal + Interest']}
            onChange={set('renewalOption')}
          />
        </Card>

        <LinearGradient colors={theme.gradientCalc.colors} start={GRADIENT_ANGLE.start} end={GRADIENT_ANGLE.end} style={styles.estimateCard}>
          <Text style={[styles.estimateLabel, { color: theme.accentLight }]}>Estimated (calculated automatically)</Text>
          <Text style={[styles.estimateText, { color: theme.text }]}>
            <Text style={styles.bold}>{estimate.maturityDateLabel}</Text> maturity · <Text style={styles.bold}>{estimate.maturityAmountFmt}</Text>
          </Text>
        </LinearGradient>

        <Pressable onPress={handleSave} style={({ pressed }) => (pressed ? styles.pressed : undefined)}>
          <LinearGradient colors={theme.gradientAccent.colors} start={GRADIENT_ANGLE.start} end={GRADIENT_ANGLE.end} style={styles.saveBtn}>
            <Text style={styles.saveText}>Save FD</Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  section: {
    gap: 12,
  },
  sectionLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  row3: {
    flexDirection: 'row',
    gap: 8,
  },
  flex1: {
    flex: 1,
    minWidth: 0,
  },
  estimateCard: {
    borderRadius: 16,
    padding: 16,
  },
  estimateLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    marginBottom: 6,
  },
  estimateText: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
  },
  bold: {
    fontFamily: fontFamily.bold,
  },
  saveBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
  saveText: {
    color: '#fff',
    fontFamily: fontFamily.bold,
    fontSize: 15,
  },
  pressed: {
    opacity: 0.85,
  },
});
