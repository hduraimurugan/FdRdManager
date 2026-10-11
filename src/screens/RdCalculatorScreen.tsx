import React, { useMemo } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAppActions, useAppState } from '../state/AppContext';
import { calcRD, formatDate, formatINR } from '../data/portfolioData';
import Card from '../components/Card';
import TopAppBar from '../components/TopAppBar';
import FormField from '../components/FormField';
import DateField from '../components/DateField';
import { CalculatorEmpty, CalculatorHeading, CalculatorMetric, CalculatorSummary, DurationPresets, SectionHeading, calculatorStyles as styles, numberError } from '../components/CalculatorUI';

export default function RdCalculatorScreen() {
  const theme = useTheme();
  const { rdCalc: rc } = useAppState();
  const actions = useAppActions();
  const errors = {
    amount: numberError(rc.monthlyInstallment, 'a monthly deposit', 1),
    rate: numberError(rc.ratePct, 'an annual rate', 0, 100),
    years: numberError(rc.years, 'years', 0, 100, true),
    months: numberError(rc.months, 'months', 0, 1200, true),
  };
  const duration = Number(rc.years) * 12 + Number(rc.months);
  const durationError = duration === 0 ? 'Choose a duration of at least 1 month.' : duration > 1200 ? 'Use a duration of up to 100 years.' : undefined;
  const valid = !Object.values(errors).some(Boolean) && !durationError;
  const result = useMemo(() => valid ? calcRD({
    monthlyInstallment: Number(rc.monthlyInstallment), ratePct: Number(rc.ratePct),
    startDate: rc.startDate, years: Number(rc.years), months: Number(rc.months),
  }) : null, [rc, valid]);
  const setDuration = (months: number) => {
    actions.rcSet('years')(String(Math.floor(months / 12)));
    actions.rcSet('months')(String(months % 12));
  };

  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: theme.bg }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TopAppBar title="RD Calculator" showBack onBack={actions.back} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <CalculatorHeading title="Build savings, month by month" subtitle="Estimate how regular monthly deposits can grow. Your estimate updates as you edit." />
        {result ? <CalculatorSummary deposited={result.totalDeposited} interest={result.interestEarned} maturityDate={formatDate(result.maturityDate, 'medium')} caption="Estimated maturity value" detail={`${result.totalMonths} monthly deposits of ${formatINR(Number(rc.monthlyInstallment))}`} /> : null}
        <Card style={styles.section}>
          <SectionHeading title="Monthly savings" subtitle="How much can you set aside each month?" />
          <FormField label="Monthly deposit (₹)" accessibilityLabel="Monthly deposit in rupees" value={String(rc.monthlyInstallment)} onChangeText={actions.rcSet('monthlyInstallment')} keyboardType="decimal-pad" error={errors.amount} style={styles.amountInput} />
          {!errors.amount ? <Text style={[styles.body, { color: theme.textMuted }]}>Save {formatINR(Number(rc.monthlyInstallment))} every month.</Text> : null}
          <FormField label="Annual interest rate (%)" accessibilityLabel="Annual interest rate in percent" value={String(rc.ratePct)} onChangeText={actions.rcSet('ratePct')} keyboardType="decimal-pad" error={errors.rate} style={styles.input} />
          <Text style={[styles.body, { color: theme.textMuted }]}>Use the yearly rate offered by your bank.</Text>
        </Card>
        <Card style={styles.section}>
          <SectionHeading title="How long will you save?" subtitle="Choose a common duration or enter your own below." />
          <DurationPresets months={duration} onSelect={setDuration} />
          <View style={styles.row}>
            <View style={styles.flex}><FormField label="Years" accessibilityLabel="Duration in years" value={String(rc.years)} onChangeText={actions.rcSet('years')} keyboardType="number-pad" error={errors.years} style={styles.input} /></View>
            <View style={styles.flex}><FormField label="Months" accessibilityLabel="Additional months" value={String(rc.months)} onChangeText={actions.rcSet('months')} keyboardType="number-pad" error={errors.months} style={styles.input} /></View>
          </View>
          {durationError ? <Text accessibilityRole="alert" style={[styles.body, { color: theme.danger }]}>{durationError}</Text> : null}
          <DateField label="First deposit date" value={rc.startDate} onChange={actions.rcSet('startDate')} />
        </Card>
        {result ? <>
          <Card style={styles.section}>
            <SectionHeading title="Your savings plan" subtitle="A clear breakdown of what you put in and earn." />
            <CalculatorMetric label="Monthly deposit" value={formatINR(Number(rc.monthlyInstallment))} />
            <CalculatorMetric label="Number of deposits" value={String(result.totalMonths)} />
            <CalculatorMetric label="Total you deposit" value={formatINR(result.totalDeposited)} />
            <CalculatorMetric label="Interest earned" value={formatINR(result.interestEarned)} highlight />
            <CalculatorMetric label="Growth on total deposits" value={`${(result.interestEarned / result.totalDeposited * 100).toFixed(2)}%`} />
          </Card>
        </> : <CalculatorEmpty />}
        <Card style={styles.section}>
          <SectionHeading title="How this estimate works" subtitle="Assumes a deposit at the start of each month and quarterly compounding. Earlier deposits earn interest for longer than later ones." />
          <Text style={[styles.body, { color: theme.textMuted }]}>The estimate is before tax. Actual bank returns may vary with deposit dates and bank rules.</Text>
        </Card>
        <Text style={[styles.body, { color: theme.textMuted }]}>Trying this calculator does not change your saved deposits.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
