import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { useAppActions, useAppState } from '../state/AppContext';
import { rdEstimate } from '../state/selectors';
import { BANKS, COMPOUNDING_FREQUENCIES } from '../data/portfolioData';
import { today, computeInstallmentsDue } from '../data/derive';
import { validateRdDraft, isValidDraft } from '../data/validation';
import { GRADIENT_ANGLE } from '../theme/colors';
import { RootStackParamList } from '../navigation/types';
import Card from '../components/Card';
import TopAppBar from '../components/TopAppBar';
import FormField from '../components/FormField';
import FormSelect from '../components/FormSelect';
import DateField from '../components/DateField';
import BankLogo from '../components/BankLogo';

type Props = NativeStackScreenProps<RootStackParamList, 'AddEditRD'>;

const EMPTY_DRAFT: Record<string, any> = {};

export default function AddEditRdScreen({ route }: Props) {
  const theme = useTheme();
  const state = useAppState();
  const actions = useAppActions();
  const { id } = route.params;
  const draft = state.editDraft || EMPTY_DRAFT;
  const estimate = useMemo(() => rdEstimate(draft), [draft]);
  const errors = useMemo(() => validateRdDraft(draft), [draft]);

  // Same touched/attempted pattern as AddEditFdScreen — see its comment for why.
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
    actions.saveDraftRD(id);
  };

  const totalMonths = Number(draft.tenureYears || 0) * 12 + Number(draft.tenureMonths || 0);
  const installmentsDue = draft.startDate ? computeInstallmentsDue(draft.startDate, totalMonths, today()) : 0;
  const installmentsPaid = Number(draft.installmentsPaid) || 0;
  const installmentsMissed = Math.max(0, installmentsDue - installmentsPaid);

  return (
    <View style={[styles.flex, { backgroundColor: theme.bg }]}>
      <TopAppBar title={id ? 'Edit RD' : 'Add RD'} showBack onBack={actions.back} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Card style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Basic details</Text>
          <FormField label="RD number" value={String(draft.rdNumber ?? '')} onChangeText={set('rdNumber')} error={errorFor('rdNumber')} />
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
          <FormField label="RD holder name" value={String(draft.rdHolderName ?? '')} onChangeText={set('rdHolderName')} />
          <FormField label="Joint holder (optional)" value={String(draft.jointHolder ?? '')} onChangeText={set('jointHolder')} />
          <FormSelect label="RD type" value={draft.rdType ?? 'Regular'} options={['Regular', 'Senior Citizen']} onChange={set('rdType')} />
          <FormSelect label="Mode" value={draft.mode ?? 'Online'} options={['Online', 'Offline']} onChange={set('mode')} />
        </Card>

        <Card style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Deposit &amp; tenure</Text>
          <FormField label="Monthly installment (₹)" value={String(draft.monthlyInstallment ?? '')} onChangeText={set('monthlyInstallment')} keyboardType="numeric" error={errorFor('monthlyInstallment')} />
          <DateField label="Start date" value={String(draft.startDate ?? '')} onChange={set('startDate')} />
          <View style={styles.row2}>
            <View style={styles.flex1}>
              <FormField label="Years" value={String(draft.tenureYears ?? '')} onChangeText={set('tenureYears')} keyboardType="numeric" error={errorFor('tenureYears')} />
            </View>
            <View style={styles.flex1}>
              <FormField label="Months" value={String(draft.tenureMonths ?? '')} onChangeText={set('tenureMonths')} keyboardType="numeric" />
            </View>
          </View>
          <FormField label="Interest rate (% p.a.)" value={String(draft.interestRate ?? '')} onChangeText={set('interestRate')} keyboardType="numeric" error={errorFor('interestRate')} />
          <FormSelect label="Compounding frequency" value={draft.compoundingFrequency ?? COMPOUNDING_FREQUENCIES[0]} options={COMPOUNDING_FREQUENCIES} onChange={set('compoundingFrequency')} />
        </Card>

        <Card style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Installment tracking</Text>
          <FormField
            label="Installments paid so far"
            value={String(draft.installmentsPaid ?? 0)}
            onChangeText={set('installmentsPaid')}
            keyboardType="numeric"
            error={errorFor('installmentsPaid')}
          />
          {draft.startDate ? (
            <Text style={[styles.hint, { color: installmentsMissed > 0 ? theme.danger : theme.textFaint }]}>
              {installmentsDue} installment{installmentsDue === 1 ? '' : 's'} due as of today
              {installmentsMissed > 0 ? ` · ${installmentsMissed} missed` : ''}
            </Text>
          ) : null}
        </Card>

        <LinearGradient colors={theme.gradientCalc.colors} start={GRADIENT_ANGLE.start} end={GRADIENT_ANGLE.end} style={styles.estimateCard}>
          <Text style={[styles.estimateLabel, { color: theme.accentLight }]}>Estimated (calculated automatically)</Text>
          <Text style={[styles.estimateText, { color: theme.text }]}>
            <Text style={styles.bold}>{estimate.maturityDateLabel}</Text> maturity · <Text style={styles.bold}>{estimate.maturityAmountFmt}</Text>
          </Text>
        </LinearGradient>

        <Pressable onPress={handleSave} style={({ pressed }) => (pressed ? styles.pressed : undefined)}>
          <LinearGradient colors={theme.gradientAccent.colors} start={GRADIENT_ANGLE.start} end={GRADIENT_ANGLE.end} style={styles.saveBtn}>
            <Text style={styles.saveText}>Save RD</Text>
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
  row2: {
    flexDirection: 'row',
    gap: 8,
  },
  flex1: {
    flex: 1,
    minWidth: 0,
  },
  hint: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    marginTop: -4,
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
