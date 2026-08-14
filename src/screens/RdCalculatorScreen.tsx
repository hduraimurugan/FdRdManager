import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { useAppActions, useAppState } from '../state/AppContext';
import { calcRD, formatDate, formatINR } from '../data/portfolioData';
import Card from '../components/Card';
import TopAppBar from '../components/TopAppBar';
import FormField from '../components/FormField';

export default function RdCalculatorScreen() {
  const theme = useTheme();
  const state = useAppState();
  const actions = useAppActions();
  const rc = state.rdCalc;

  const result = useMemo(() => {
    const r = calcRD({
      monthlyInstallment: Number(rc.monthlyInstallment) || 0,
      ratePct: Number(rc.ratePct) || 0,
      startDate: rc.startDate,
      years: Number(rc.years) || 0,
      months: Number(rc.months) || 0,
    });
    return {
      maturityDateLabel: formatDate(r.maturityDate, 'short'),
      totalDepositedFmt: formatINR(r.totalDeposited),
      interestEarnedFmt: formatINR(r.interestEarned),
      maturityAmountFmt: formatINR(r.maturityAmount),
    };
  }, [rc]);

  return (
    <View style={[styles.flex, { backgroundColor: theme.bg }]}>
      <TopAppBar title="RD Calculator" showBack onBack={actions.back} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Card style={styles.section}>
          <FormField label="Monthly installment (₹)" value={String(rc.monthlyInstallment)} onChangeText={actions.rcSet('monthlyInstallment')} keyboardType="numeric" />
          <FormField label="Interest rate (% p.a.)" value={String(rc.ratePct)} onChangeText={actions.rcSet('ratePct')} keyboardType="numeric" />
          <FormField label="Start date" value={rc.startDate} onChangeText={actions.rcSet('startDate')} placeholder="YYYY-MM-DD" />
          <View style={styles.row2}>
            <View style={styles.flex1}>
              <FormField label="Years" value={String(rc.years)} onChangeText={actions.rcSet('years')} keyboardType="numeric" />
            </View>
            <View style={styles.flex1}>
              <FormField label="Months" value={String(rc.months)} onChangeText={actions.rcSet('months')} keyboardType="numeric" />
            </View>
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted, marginBottom: 4 }]}>Results</Text>
          <View style={styles.kvRow}>
            <Text style={[styles.kvLabel, { color: theme.textMuted }]}>Maturity date</Text>
            <Text style={[styles.kvValueBold, { color: theme.text }]}>{result.maturityDateLabel}</Text>
          </View>
          <View style={styles.kvRow}>
            <Text style={[styles.kvLabel, { color: theme.textMuted }]}>Total deposited</Text>
            <Text style={[styles.kvValueBold, { color: theme.text }]}>{result.totalDepositedFmt}</Text>
          </View>
          <View style={styles.kvRow}>
            <Text style={[styles.kvLabel, { color: theme.textMuted }]}>Interest earned</Text>
            <Text style={[styles.kvValueBold, { color: theme.success }]}>{result.interestEarnedFmt}</Text>
          </View>
          <View style={[styles.kvRow, styles.totalRow, { borderTopColor: theme.border }]}>
            <Text style={[styles.totalLabel, { color: theme.text }]}>Maturity amount</Text>
            <Text style={[styles.totalValue, { color: theme.success }]}>{result.maturityAmountFmt}</Text>
          </View>
        </Card>
        <Text style={[styles.footnote, { color: theme.textFaint }]}>This scenario is independent of your saved RDs and won't affect your portfolio.</Text>
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
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  kvLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 13.5,
  },
  kvValueBold: {
    fontFamily: fontFamily.semibold,
    fontSize: 13.5,
  },
  totalRow: {
    paddingTop: 8,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: 15,
  },
  totalValue: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
  },
  footnote: {
    fontFamily: fontFamily.regular,
    fontSize: 11.5,
    lineHeight: 17,
  },
});
