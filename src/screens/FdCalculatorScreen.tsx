import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { useAppActions, useAppState } from '../state/AppContext';
import { calcFD, formatDate, formatINR, COMPOUNDING_FREQUENCIES } from '../data/portfolioData';
import Card from '../components/Card';
import TopAppBar from '../components/TopAppBar';
import FormField from '../components/FormField';
import FormSelect from '../components/FormSelect';

export default function FdCalculatorScreen() {
  const theme = useTheme();
  const state = useAppState();
  const actions = useAppActions();
  const fc = state.fdCalc;

  const result = useMemo(() => {
    const r = calcFD({
      principal: Number(fc.principal) || 0,
      ratePct: Number(fc.ratePct) || 0,
      startDate: fc.startDate,
      years: Number(fc.years) || 0,
      months: Number(fc.months) || 0,
      days: Number(fc.days) || 0,
      compounding: fc.compounding,
      tdsPercent: Number(fc.tdsPercent) || 0,
    });
    return {
      maturityDateLabel: formatDate(r.maturityDate, 'short'),
      totalDays: r.totalDays,
      simpleInterestFmt: formatINR(r.simpleInterest),
      compoundInterestFmt: formatINR(r.compoundInterest),
      simpleMaturityFmt: formatINR(r.simpleMaturity),
      compoundMaturityFmt: formatINR(r.compoundMaturity),
      effectiveYieldLabel: r.effectiveYield.toFixed(2) + '%',
      perMonthFmt: formatINR(r.interestPerMonth),
      perQuarterFmt: formatINR(r.interestPerQuarter),
      perYearFmt: formatINR(r.interestPerYear),
      afterTaxFmt: formatINR(r.afterTaxInterest),
      roiLabel: r.roi.toFixed(2) + '%',
    };
  }, [fc]);

  return (
    <View style={[styles.flex, { backgroundColor: theme.bg }]}>
      <TopAppBar title="FD Calculator" showBack onBack={actions.back} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Card style={styles.section}>
          <FormField label="Principal amount (₹)" value={String(fc.principal)} onChangeText={actions.fcSet('principal')} keyboardType="numeric" />
          <FormField label="Interest rate (% p.a.)" value={String(fc.ratePct)} onChangeText={actions.fcSet('ratePct')} keyboardType="numeric" />
          <FormField label="Start date" value={fc.startDate} onChangeText={actions.fcSet('startDate')} placeholder="YYYY-MM-DD" />
          <View style={styles.row3}>
            <View style={styles.flex1}>
              <FormField label="Years" value={String(fc.years)} onChangeText={actions.fcSet('years')} keyboardType="numeric" />
            </View>
            <View style={styles.flex1}>
              <FormField label="Months" value={String(fc.months)} onChangeText={actions.fcSet('months')} keyboardType="numeric" />
            </View>
            <View style={styles.flex1}>
              <FormField label="Days" value={String(fc.days)} onChangeText={actions.fcSet('days')} keyboardType="numeric" />
            </View>
          </View>
          <FormSelect label="Compounding frequency" value={fc.compounding} options={COMPOUNDING_FREQUENCIES} onChange={actions.fcSet('compounding')} />
          <FormField label="TDS / tax rate (%)" value={String(fc.tdsPercent)} onChangeText={actions.fcSet('tdsPercent')} keyboardType="numeric" />
        </Card>

        <Card>
          <Text style={[styles.sectionLabel, { color: theme.textMuted, marginBottom: 12 }]}>Results — simple vs compound</Text>
          <View style={styles.resultHeaderRow}>
            <Text style={[styles.colHeader, styles.metricCol, { color: theme.textFaint }]}>Metric</Text>
            <Text style={[styles.colHeader, styles.valCol, { color: theme.textFaint }]}>Simple</Text>
            <Text style={[styles.colHeader, styles.valCol, { color: theme.textFaint }]}>Compound</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={[styles.rowLabel, styles.metricCol, { color: theme.textMuted }]}>Maturity date</Text>
            <Text style={[styles.rowValue, { color: theme.text, flex: 2 }]}>{result.maturityDateLabel}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={[styles.rowLabel, styles.metricCol, { color: theme.textMuted }]}>Total days</Text>
            <Text style={[styles.rowValue, styles.valCol, { color: theme.text }]}>{result.totalDays}</Text>
            <Text style={[styles.rowValue, styles.valCol, { color: theme.text }]}>{result.totalDays}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={[styles.rowLabel, styles.metricCol, { color: theme.textMuted }]}>Interest earned</Text>
            <Text style={[styles.rowValueBold, styles.valCol, { color: theme.text }]}>{result.simpleInterestFmt}</Text>
            <Text style={[styles.rowValueBold, styles.valCol, { color: theme.success }]}>{result.compoundInterestFmt}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={[styles.rowLabel, styles.metricCol, { color: theme.textMuted }]}>Maturity amount</Text>
            <Text style={[styles.rowValueBold, styles.valCol, { color: theme.text }]}>{result.simpleMaturityFmt}</Text>
            <Text style={[styles.rowValueBold, styles.valCol, { color: theme.success }]}>{result.compoundMaturityFmt}</Text>
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted, marginBottom: 4 }]}>Additional insights (compound)</Text>
          <View style={styles.kvRow}>
            <Text style={[styles.kvLabel, { color: theme.textMuted }]}>Effective yield (p.a.)</Text>
            <Text style={[styles.kvValue, { color: theme.text }]}>{result.effectiveYieldLabel}</Text>
          </View>
          <View style={styles.kvRow}>
            <Text style={[styles.kvLabel, { color: theme.textMuted }]}>Interest per month</Text>
            <Text style={[styles.kvValue, { color: theme.text }]}>{result.perMonthFmt}</Text>
          </View>
          <View style={styles.kvRow}>
            <Text style={[styles.kvLabel, { color: theme.textMuted }]}>Interest per quarter</Text>
            <Text style={[styles.kvValue, { color: theme.text }]}>{result.perQuarterFmt}</Text>
          </View>
          <View style={styles.kvRow}>
            <Text style={[styles.kvLabel, { color: theme.textMuted }]}>Interest per year</Text>
            <Text style={[styles.kvValue, { color: theme.text }]}>{result.perYearFmt}</Text>
          </View>
          <View style={styles.kvRow}>
            <Text style={[styles.kvLabel, { color: theme.textMuted }]}>After-tax interest</Text>
            <Text style={[styles.kvValue, { color: theme.text }]}>{result.afterTaxFmt}</Text>
          </View>
          <View style={styles.kvRow}>
            <Text style={[styles.kvLabel, { color: theme.textMuted }]}>ROI on principal</Text>
            <Text style={[styles.kvValue, { color: theme.text }]}>{result.roiLabel}</Text>
          </View>
        </Card>
        <Text style={[styles.footnote, { color: theme.textFaint }]}>This scenario is independent of your saved FDs and won't affect your portfolio.</Text>
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
  resultHeaderRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  colHeader: {
    fontFamily: fontFamily.semibold,
    fontSize: 12.5,
  },
  metricCol: {
    flex: 1.4,
  },
  valCol: {
    flex: 1,
  },
  resultRow: {
    flexDirection: 'row',
    paddingVertical: 6,
  },
  rowLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 12.5,
  },
  rowValue: {
    fontFamily: fontFamily.regular,
    fontSize: 12.5,
  },
  rowValueBold: {
    fontFamily: fontFamily.semibold,
    fontSize: 12.5,
  },
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  kvLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
  },
  kvValue: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
  },
  footnote: {
    fontFamily: fontFamily.regular,
    fontSize: 11.5,
    lineHeight: 17,
  },
});
