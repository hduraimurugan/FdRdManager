import { IconCalculator } from '../components/icons/Icons';
import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAppActions, useAppState } from '../state/AppContext';
import { calcFD, formatDate, formatINR, COMPOUNDING_FREQUENCIES } from '../data/portfolioData';
import Card from '../components/Card';
import TopAppBar from '../components/TopAppBar';
import FormField from '../components/FormField';
import FormSelect from '../components/FormSelect';
import DateField from '../components/DateField';
import { CalculatorDisclosure, CalculatorEmpty, CalculatorHeading, CalculatorMetric, CalculatorSummary, DurationPresets, SectionHeading, calculatorStyles as styles, numberError } from '../components/CalculatorUI';

export default function FdCalculatorScreen() {
  const theme = useTheme();
  const { fdCalc: fc } = useAppState();
  const actions = useAppActions();
  const [advanced, setAdvanced] = useState(false);
  const [comparison, setComparison] = useState(false);
  const [insights, setInsights] = useState(false);
  const errors = {
    principal: numberError(fc.principal, 'a deposit amount', 1),
    rate: numberError(fc.ratePct, 'an annual rate', 0, 100),
    years: numberError(fc.years, 'years', 0, 100, true),
    months: numberError(fc.months, 'months', 0, 1200, true),
    days: numberError(fc.days, 'days', 0, 36500, true),
    tax: numberError(fc.tdsPercent, 'a deduction rate', 0, 100),
  };
  const duration = Number(fc.years) * 12 + Number(fc.months);
  const durationError = duration === 0 && Number(fc.days) === 0 ? 'Choose a duration greater than zero.'
    : duration + Number(fc.days) / 30.44 > 1200 ? 'Use a duration of up to 100 years.' : undefined;
  const valid = !Object.values(errors).some(Boolean) && !durationError;
  const result = useMemo(() => valid ? calcFD({
    principal: Number(fc.principal), ratePct: Number(fc.ratePct), startDate: fc.startDate,
    years: Number(fc.years), months: Number(fc.months), days: Number(fc.days),
    compounding: fc.compounding, tdsPercent: Number(fc.tdsPercent),
  }) : null, [fc, valid]);
  const setDuration = (months: number) => {
    actions.fcSet('years')(String(Math.floor(months / 12)));
    actions.fcSet('months')(String(months % 12));
    actions.fcSet('days')('0');
  };
  const compoundingHelp: Record<string, string> = {
    Monthly: 'Interest is added to your deposit every month.',
    Quarterly: 'Interest is added to your deposit every 3 months.',
    'Half-Yearly': 'Interest is added to your deposit every 6 months.',
    Yearly: 'Interest is added to your deposit once a year.',
  };

  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: theme.bg }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TopAppBar titleIcon={<IconCalculator size={18} color={theme.accent} />} title="FD Calculator" showBack onBack={actions.back} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <CalculatorHeading title="See your lump sum grow" subtitle="Estimate what a fixed deposit could return. Your estimate updates as you edit." />
        {result ? <CalculatorSummary deposited={Number(fc.principal)} interest={result.compoundInterest} maturityDate={formatDate(result.maturityDate, 'medium')} caption="Estimated maturity value" detail={`${fc.compounding} compounding · ${result.totalDays.toLocaleString('en-IN')} days invested`} /> : null}
        <Card style={styles.section}>
          <SectionHeading title="Deposit details" subtitle="Start with the amount you plan to invest." />
          <FormField label="Deposit amount (₹)" accessibilityLabel="Deposit amount in rupees" value={String(fc.principal)} onChangeText={actions.fcSet('principal')} keyboardType="decimal-pad" error={errors.principal} style={styles.amountInput} />
          {!errors.principal ? <Text style={[styles.body, { color: theme.textMuted }]}>One-time investment of {formatINR(Number(fc.principal))}</Text> : null}
          <FormField label="Annual interest rate (%)" accessibilityLabel="Annual interest rate in percent" value={String(fc.ratePct)} onChangeText={actions.fcSet('ratePct')} keyboardType="decimal-pad" error={errors.rate} style={styles.input} />
          <Text style={[styles.body, { color: theme.textMuted }]}>Use the yearly rate offered by your bank.</Text>
        </Card>
        <Card style={styles.section}>
          <SectionHeading title="How long will you invest?" subtitle="Choose a common duration or enter your own below." />
          <DurationPresets months={Number(fc.days) === 0 ? duration : -1} onSelect={setDuration} />
          <View style={styles.row}>
            <View style={styles.flex}><FormField label="Years" accessibilityLabel="Duration in years" value={String(fc.years)} onChangeText={actions.fcSet('years')} keyboardType="number-pad" error={errors.years} style={styles.input} /></View>
            <View style={styles.flex}><FormField label="Months" accessibilityLabel="Additional months" value={String(fc.months)} onChangeText={actions.fcSet('months')} keyboardType="number-pad" error={errors.months} style={styles.input} /></View>
            <View style={styles.flex}><FormField label="Days" accessibilityLabel="Additional days" value={String(fc.days)} onChangeText={actions.fcSet('days')} keyboardType="number-pad" error={errors.days} style={styles.input} /></View>
          </View>
          {durationError ? <Text accessibilityRole="alert" style={[styles.body, { color: theme.danger }]}>{durationError}</Text> : null}
          <DateField label="Deposit start date" value={fc.startDate} onChange={actions.fcSet('startDate')} />
          <FormSelect label="How often is interest added?" value={fc.compounding} options={COMPOUNDING_FREQUENCIES} onChange={actions.fcSet('compounding')} />
          <Text style={[styles.body, { color: theme.textMuted }]}>{compoundingHelp[fc.compounding]} This earns interest on earlier interest too.</Text>
        </Card>
        <CalculatorDisclosure title="Tax estimate" subtitle={errors.tax ? 'Check your deduction rate' : `Deduction rate: ${fc.tdsPercent}% · edit assumption`} open={advanced || !!errors.tax} onPress={() => setAdvanced(!advanced)}>
          <FormField label="Estimated deduction on interest (%)" accessibilityLabel="Estimated deduction on interest in percent" value={String(fc.tdsPercent)} onChangeText={actions.fcSet('tdsPercent')} keyboardType="decimal-pad" error={errors.tax} style={styles.input} />
          <Text style={[styles.body, { color: theme.textMuted }]}>Applied to interest only. This is a planning assumption; TDS and your final tax can differ.</Text>
        </CalculatorDisclosure>
        {result ? <>
          <Card style={styles.section}>
            <SectionHeading title="After your estimated deduction" />
            <CalculatorMetric label="Deduction on interest" value={formatINR(result.compoundInterest - result.afterTaxInterest)} />
            <CalculatorMetric label="Interest after deduction" value={formatINR(result.afterTaxInterest)} highlight />
            <CalculatorMetric label="Total after deduction" value={formatINR(Number(fc.principal) + result.afterTaxInterest)} />
          </Card>
          <CalculatorDisclosure title="Simple vs compound interest" subtitle="See the difference reinvesting interest makes" open={comparison} onPress={() => setComparison(!comparison)}>
            <SectionHeading title="Simple interest" subtitle="Interest is earned only on your original deposit." />
            <CalculatorMetric label="Interest earned" value={formatINR(result.simpleInterest)} />
            <CalculatorMetric label="Maturity value" value={formatINR(result.simpleMaturity)} />
            <SectionHeading title="Compound interest" subtitle="Interest is reinvested and earns more interest." />
            <CalculatorMetric label="Interest earned" value={formatINR(result.compoundInterest)} highlight />
            <CalculatorMetric label="Maturity value" value={formatINR(result.compoundMaturity)} />
            <CalculatorMetric label="Extra interest from compounding" value={formatINR(result.compoundInterest - result.simpleInterest)} highlight />
          </CalculatorDisclosure>
          <CalculatorDisclosure title="More about your returns" subtitle="Annual yield and average interest earned" open={insights} onPress={() => setInsights(!insights)}>
            <CalculatorMetric label="Effective annual yield" value={`${result.effectiveYield.toFixed(2)}%`} />
            <CalculatorMetric label="Return over the full duration" value={`${result.roi.toFixed(2)}%`} />
            <CalculatorMetric label="Average interest per month" value={formatINR(result.interestPerMonth)} />
            <CalculatorMetric label="Average interest per quarter" value={formatINR(result.interestPerQuarter)} />
            <CalculatorMetric label="Average interest per year" value={formatINR(result.interestPerYear)} />
            <Text style={[styles.body, { color: theme.textMuted }]}>Annual yield includes compounding. Interest averages spread your total earnings across the duration; they are not scheduled payouts.</Text>
          </CalculatorDisclosure>
        </> : <CalculatorEmpty />}
        <Text style={[styles.body, { color: theme.textMuted }]}>For planning only. Actual bank returns may vary. Trying this calculator does not change your saved deposits.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
