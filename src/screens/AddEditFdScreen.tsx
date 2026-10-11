// @refresh reset
// Remount local form state after development edits; draft values live in AppContext.
import React, { useMemo, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { useAppActions, useAppState } from '../state/AppContext';
import { fdEstimate } from '../state/selectors';
import { BANKS, FD_TYPES, COMPOUNDING_FREQUENCIES, PAYOUT_FREQUENCIES, CREDIT_METHODS, formatINR } from '../data/portfolioData';
import { validateFdDraft, isValidDraft } from '../data/validation';
import { GRADIENT_ANGLE } from '../theme/colors';
import { RootStackParamList } from '../navigation/types';
import Card from '../components/Card';
import TopAppBar from '../components/TopAppBar';
import FormField from '../components/FormField';
import FormSelect from '../components/FormSelect';
import DateField from '../components/DateField';
import BankLogo from '../components/BankLogo';
import { IconChevronDown } from '../components/icons/Icons';

type Props = NativeStackScreenProps<RootStackParamList, 'AddEditFD'>;

const EMPTY_DRAFT: Record<string, any> = {};
const STEPS = ['Deposit', 'Details', 'Review'];
const DEPOSIT_FIELDS = ['fdNumber', 'bankName', 'principalAmount', 'interestRate', 'tenureYears'];

function ExpandableSection({
  title,
  summary,
  open,
  onToggle,
  children,
}: {
  title: string;
  summary: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <Card style={styles.section}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={onToggle} style={styles.disclosure}>
        <View style={styles.flex1}>
          <Text style={[styles.sectionLabel, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.helper, { color: theme.textMuted }]}>{summary}</Text>
        </View>
        <View style={open ? styles.chevronOpen : undefined}>
          <IconChevronDown size={18} color={theme.accent} />
        </View>
      </Pressable>
      {open ? children : null}
    </Card>
  );
}

export default function AddEditFdScreen({ route }: Props) {
  const theme = useTheme();
  const state = useAppState();
  const actions = useAppActions();
  const insets = useSafeAreaInsets();
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [step, setStep] = useState(0);
  const [bankOpen, setBankOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [renewalOpen, setRenewalOpen] = useState(false);
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

  const goToStep = (next: number) => {
    Keyboard.dismiss();
    setStep(next);
    scroll.current?.scrollTo({ y: 0, animated: false });
  };

  const handleContinue = () => {
    const fields = step === 0 ? DEPOSIT_FIELDS : ['depositDate'];
    if (fields.some(field => errors[field])) {
      setTouched(current => ({ ...current, ...Object.fromEntries(fields.map(field => [field, true])) }));
      if (step === 1) setDepositOpen(true);
      scroll.current?.scrollTo({ y: 0, animated: true });
      actions.showToast('Fix the highlighted fields to continue');
      return;
    }
    goToStep(step + 1);
  };

  const handleSave = () => {
    if (!isValidDraft(errors)) {
      setAttempted(true);
      if (DEPOSIT_FIELDS.some(field => errors[field])) {
        goToStep(0);
      } else {
        setDepositOpen(true);
        goToStep(1);
      }
      actions.showToast('Fix the highlighted fields before saving');
      return;
    }
    actions.saveDraftFD(id);
  };

  return (
    <View style={[styles.flex, { backgroundColor: theme.bg }]}>
      <TopAppBar title={id ? 'Edit FD' : 'Add FD'} showBack onBack={actions.back} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.stepper, { borderBottomColor: theme.divider }]} accessibilityRole="tablist">
          {STEPS.map((label, index) => (
            <Pressable
              key={label}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected: step === index }}
              onPress={() => goToStep(index)}
              style={[styles.step, step === index && { backgroundColor: theme.tint(theme.accent, 0.13) }]}
            >
              <View style={[styles.stepNumber, { backgroundColor: step === index ? theme.accent : theme.inputBg }]}>
                <Text style={[styles.stepNumberText, { color: theme.textMuted }, step === index && styles.activeStepNumberText]}>{index + 1}</Text>
              </View>
              <Text style={[styles.stepText, { color: step === index ? theme.text : theme.textMuted }]}>{label}</Text>
            </Pressable>
          ))}
        </View>
        <ScrollView
          ref={scroll}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View>
            <Text style={[styles.pageTitle, { color: theme.text }]}>{['Build your deposit', 'Make it yours', 'Review your FD'][step]}</Text>
            <Text style={[styles.helper, { color: theme.textMuted }]}>
              {
                [
                  'Start with the amount, rate and duration.',
                  'Add holders and any extra details from your bank.',
                  'Check your estimate and how your interest is paid.',
                ][step]
              }
            </Text>
          </View>
          {step === 0 && (
            <>
              <Card style={styles.section}>
                <Text style={[styles.sectionLabel, { color: theme.text }]}>Your deposit</Text>
                <FormSelect
                  label="Bank"
                  value={draft.bankName ?? ''}
                  options={BANKS}
                  onChange={set('bankName')}
                  placeholder="Select bank"
                  renderOptionIcon={bank => <BankLogo bankName={bank} size={28} />}
                  error={errorFor('bankName')}
                />
                <FormField label="FD number" value={String(draft.fdNumber ?? '')} onChangeText={set('fdNumber')} error={errorFor('fdNumber')} />
                <FormField
                  label="Principal amount (₹)"
                  value={String(draft.principalAmount ?? '')}
                  onChangeText={set('principalAmount')}
                  keyboardType="numeric"
                  error={errorFor('principalAmount')}
                />
                <DateField label="Start date" value={String(draft.startDate ?? '')} onChange={set('startDate')} />
              </Card>

              <Card style={styles.section}>
                <Text style={[styles.sectionLabel, { color: theme.text }]}>Duration &amp; rate</Text>
                <View style={styles.row3}>
                  <View style={styles.flex1}>
                    <FormField
                      label="Years"
                      value={String(draft.tenureYears ?? '')}
                      onChangeText={set('tenureYears')}
                      keyboardType="numeric"
                      error={errorFor('tenureYears')}
                    />
                  </View>
                  <View style={styles.flex1}>
                    <FormField label="Months" value={String(draft.tenureMonths ?? '')} onChangeText={set('tenureMonths')} keyboardType="numeric" />
                  </View>
                  <View style={styles.flex1}>
                    <FormField label="Days" value={String(draft.tenureDays ?? '')} onChangeText={set('tenureDays')} keyboardType="numeric" />
                  </View>
                </View>
                <FormField
                  label="Interest rate (% p.a.)"
                  value={String(draft.interestRate ?? '')}
                  onChangeText={set('interestRate')}
                  keyboardType="numeric"
                  error={errorFor('interestRate')}
                />
              </Card>
            </>
          )}

          {step === 1 && (
            <>
              <Card style={styles.section}>
                <Text style={[styles.sectionLabel, { color: theme.text }]}>Holders</Text>
                <FormField label="FD holder name" value={String(draft.fdHolderName ?? '')} onChangeText={set('fdHolderName')} />
                <FormField label="Joint holder (optional)" value={String(draft.jointHolder ?? '')} onChangeText={set('jointHolder')} />
              </Card>
              <ExpandableSection
                title="Bank details"
                summary="Optional · Branch, account number and customer ID"
                open={bankOpen}
                onToggle={() => setBankOpen(!bankOpen)}
              >
                <FormField label="Branch" value={String(draft.branch ?? '')} onChangeText={set('branch')} />
                <FormField
                  label="Bank account number"
                  value={String(draft.bankAccountNumber ?? '')}
                  onChangeText={set('bankAccountNumber')}
                  keyboardType="number-pad"
                />
                <FormField label="Customer ID" value={String(draft.customerId ?? '')} onChangeText={set('customerId')} />
              </ExpandableSection>
              <ExpandableSection
                title="Deposit options"
                summary={`${draft.fdType ?? FD_TYPES[0]} · ${draft.mode ?? 'Online'} · ${draft.interestType ?? 'Compound'} interest`}
                open={depositOpen}
                onToggle={() => setDepositOpen(!depositOpen)}
              >
                <FormSelect label="FD type" value={draft.fdType ?? FD_TYPES[0]} options={FD_TYPES} onChange={set('fdType')} />
                <FormSelect label="Mode" value={draft.mode ?? 'Online'} options={['Online', 'Offline']} onChange={set('mode')} />
                <DateField label="Deposit date" value={String(draft.depositDate ?? '')} onChange={set('depositDate')} error={errorFor('depositDate')} />
                <FormSelect label="Interest type" value={draft.interestType ?? 'Compound'} options={['Simple', 'Compound']} onChange={set('interestType')} />
                <FormSelect
                  label="Compounding frequency"
                  value={draft.compoundingFrequency ?? COMPOUNDING_FREQUENCIES[0]}
                  options={COMPOUNDING_FREQUENCIES}
                  onChange={set('compoundingFrequency')}
                />
              </ExpandableSection>
            </>
          )}

          {step === 2 && (
            <>
              <LinearGradient colors={theme.gradientCalc.colors} start={GRADIENT_ANGLE.start} end={GRADIENT_ANGLE.end} style={styles.estimateCard}>
                <Text style={[styles.estimateLabel, { color: theme.textMuted }]}>Estimated maturity amount</Text>
                <Text style={[styles.estimateAmount, { color: theme.text }]}>
                  {isValidDraft(errors) ? estimate.maturityAmountFmt : 'Complete deposit details'}
                </Text>
                <Text style={[styles.helper, { color: theme.textMuted }]}>
                  {isValidDraft(errors) ? `Matures on ${estimate.maturityDateLabel}` : 'An estimate will appear once your deposit is valid.'}
                </Text>
              </LinearGradient>
              <Card style={styles.section}>
                <View style={styles.disclosure}>
                  <View style={styles.flex1}>
                    <Text style={[styles.sectionLabel, { color: theme.text }]}>{draft.bankName || 'Select a bank'}</Text>
                    <Text style={[styles.helper, { color: theme.textMuted }]}>
                      {draft.fdNumber || 'FD number'} · {draft.fdHolderName || 'Holder not specified'}
                    </Text>
                  </View>
                  <Pressable accessibilityRole="button" accessibilityLabel="Edit deposit details" onPress={() => goToStep(0)} style={styles.editButton}>
                    <Text style={[styles.stepText, { color: theme.accent }]}>Edit</Text>
                  </Pressable>
                </View>
                <View style={[styles.summaryRow, { borderTopColor: theme.divider }]}>
                  <View style={styles.flex1}>
                    <Text style={[styles.helper, { color: theme.textMuted }]}>Principal</Text>
                    <Text style={[styles.summaryValue, { color: theme.text }]}>{formatINR(Number(draft.principalAmount) || 0)}</Text>
                  </View>
                  <View style={styles.flex1}>
                    <Text style={[styles.helper, { color: theme.textMuted }]}>Interest rate</Text>
                    <Text style={[styles.summaryValue, { color: theme.text }]}>{draft.interestRate || 0}% p.a.</Text>
                  </View>
                </View>
                <Text style={[styles.helper, { color: theme.textMuted }]}>
                  {Number(draft.tenureYears) || 0} years · {Number(draft.tenureMonths) || 0} months · {Number(draft.tenureDays) || 0} days
                </Text>
              </Card>
              <ExpandableSection
                title="Interest payout"
                summary={`${draft.interestPayoutMode ?? PAYOUT_FREQUENCIES[0]} · ${draft.interestCreditMethod ?? CREDIT_METHODS[0]}`}
                open={payoutOpen}
                onToggle={() => setPayoutOpen(!payoutOpen)}
              >
                <FormSelect
                  label="Interest payout frequency"
                  value={draft.interestPayoutMode ?? PAYOUT_FREQUENCIES[0]}
                  options={PAYOUT_FREQUENCIES}
                  onChange={set('interestPayoutMode')}
                />
                <FormSelect
                  label="Interest credit method"
                  value={draft.interestCreditMethod ?? CREDIT_METHODS[0]}
                  options={CREDIT_METHODS}
                  onChange={set('interestCreditMethod')}
                />
              </ExpandableSection>

              <ExpandableSection
                title="Renewal"
                summary={`Auto-renew: ${draft.autoRenewal ?? 'No'} · ${draft.renewalOption ?? 'Do Not Renew'}`}
                open={renewalOpen}
                onToggle={() => setRenewalOpen(!renewalOpen)}
              >
                <FormSelect label="Auto-renew" value={draft.autoRenewal ?? 'No'} options={['Yes', 'No']} onChange={set('autoRenewal')} />
                <FormSelect
                  label="Renewal instruction"
                  value={draft.renewalOption ?? 'Do Not Renew'}
                  options={['Do Not Renew', 'Renew Principal Only', 'Renew Principal + Interest']}
                  onChange={set('renewalOption')}
                />
              </ExpandableSection>
            </>
          )}
        </ScrollView>
        <View style={[styles.footer, { backgroundColor: theme.bg, borderTopColor: theme.border, paddingBottom: Math.max(insets.bottom, 12) }]}>
          {step > 0 && (
            <Pressable accessibilityRole="button" onPress={() => goToStep(step - 1)} style={[styles.previousButton, { borderColor: theme.borderStrong }]}>
              <Text style={[styles.stepText, { color: theme.text }]}>Previous</Text>
            </Pressable>
          )}
          <Pressable
            accessibilityRole="button"
            onPress={step === 2 ? handleSave : handleContinue}
            style={({ pressed }) => [styles.flex1, pressed ? styles.pressed : undefined]}
          >
            <LinearGradient colors={theme.gradientAccent.colors} start={GRADIENT_ANGLE.start} end={GRADIENT_ANGLE.end} style={styles.saveBtn}>
              <Text style={styles.saveText}>{step === 2 ? 'Save FD' : step === 0 ? 'Continue to details' : 'Review FD'}</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    padding: 16,
    paddingBottom: 24,
    gap: 14,
  },
  section: {
    gap: 12,
  },
  sectionLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: 14,
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
  estimateAmount: { fontFamily: fontFamily.bold, fontSize: 28, letterSpacing: -0.8 },
  helper: { fontFamily: fontFamily.regular, fontSize: 12, lineHeight: 18, marginTop: 4 },
  pageTitle: { fontFamily: fontFamily.bold, fontSize: 22, letterSpacing: -0.4 },
  disclosure: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
  chevronOpen: { transform: [{ rotate: '180deg' }] },
  stepper: { flexDirection: 'row', padding: 12, gap: 4, borderBottomWidth: StyleSheet.hairlineWidth },
  step: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12 },
  stepNumber: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { fontFamily: fontFamily.bold, fontSize: 12 },
  activeStepNumberText: { color: '#fff' },
  stepText: { fontFamily: fontFamily.semibold, fontSize: 12, flexShrink: 1 },
  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1 },
  previousButton: { minHeight: 48, borderWidth: 1, borderRadius: 14, paddingHorizontal: 18, justifyContent: 'center', alignItems: 'center' },
  editButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 },
  summaryRow: { flexDirection: 'row', gap: 12, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth },
  summaryValue: { fontFamily: fontFamily.semibold, fontSize: 16, marginTop: 4 },
  saveBtn: {
    minHeight: 48,
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
