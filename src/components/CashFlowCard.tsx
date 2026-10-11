import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppActions, useAppState } from '../state/AppContext';
import { projectedCashFlow } from '../state/selectors';
import { formatCompactINR, formatDate, formatINR } from '../data/portfolioData';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import Card from './Card';
import BarChart from './BarChart';
import { IconChevronRight } from './icons/Icons';

export default function CashFlowCard() {
  const theme = useTheme();
  const state = useAppState();
  const actions = useAppActions();
  const [months, setMonths] = useState<6 | 12>(6);
  const [mode, setMode] = useState<'interest' | 'maturity'>('interest');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const projection = useMemo(
    () => projectedCashFlow(state, months, mode),
    [state, months, mode],
  );
  const total = projection.reduce((sum, b) => sum + b.total, 0);
  const peak = projection.reduce(
    (best, b) => (b.total > best.total ? b : best),
    projection[0],
  );
  const selected = projection[Math.min(selectedIndex, months - 1)];
  const receipts = expanded ? selected.receipts : selected.receipts.slice(0, 3);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.flex}>
          <Text style={[styles.title, { color: theme.text }]}>
            Cash flow forecast
          </Text>
          <Text style={[styles.caption, { color: theme.textMuted }]}>
            From today · next {months} months
          </Text>
        </View>
        <View style={[styles.switch, { backgroundColor: theme.inputBg }]}>
          {([6, 12] as const).map(n => (
            <Pressable
              key={n}
              accessibilityRole="button"
              accessibilityLabel={`Next ${n} months`}
              accessibilityState={{ selected: months === n }}
              onPress={() => {
                setMonths(n);
                setSelectedIndex(0);
                setExpanded(false);
              }}
              style={[
                styles.period,
                months === n && { backgroundColor: theme.accent },
              ]}
            >
              <Text
                style={[
                  styles.periodText,
                  { color: theme.textMuted },
                  months === n && styles.selectedPeriodText,
                ]}
              >
                {n}M
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={[styles.tabs, { borderBottomColor: theme.divider }]}>
        {(['interest', 'maturity'] as const).map(value => (
          <Pressable
            key={value}
            accessibilityRole="button"
            accessibilityState={{ selected: mode === value }}
            onPress={() => {
              setMode(value);
              setSelectedIndex(0);
              setExpanded(false);
            }}
            style={[
              styles.tab,
              mode === value && { borderBottomColor: theme.accent },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                { color: mode === value ? theme.accent : theme.textMuted },
              ]}
            >
              {value === 'interest' ? 'Interest receipts' : 'Maturity returns'}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={[styles.eyebrow, { color: theme.textMuted }]}>
        TOTAL EXPECTED
      </Text>
      <Text style={[styles.total, { color: theme.text }]}>
        {formatINR(total)}
      </Text>
      <View style={styles.summary}>
        <Text style={[styles.caption, { color: theme.textMuted }]}>
          {formatINR(total / months)} / month avg.
        </Text>
        {peak.total > 0 && (
          <Text style={[styles.caption, { color: theme.accent }]}>
            Peak: {peak.label} · ₹{formatCompactINR(peak.total)}
          </Text>
        )}
      </View>
      <Text style={[styles.units, { color: theme.textMuted }]}>
        Amount (₹) · tap a month for details
      </Text>
      <BarChart
        key={`${months}-${mode}`}
        bars={projection}
        selectedIndex={Math.min(selectedIndex, months - 1)}
        onSelect={i => {
          setSelectedIndex(i);
          setExpanded(false);
        }}
      />
      <View style={[styles.details, { backgroundColor: theme.inputBg }]}>
        <View style={styles.header}>
          <Text style={[styles.detailTitle, { color: theme.text }]}>
            {selected.fullLabel}
          </Text>
          <Text style={[styles.detailTitle, { color: theme.accent }]}>
            {formatINR(selected.total)}
          </Text>
        </View>
        <Text style={[styles.caption, { color: theme.textMuted }]}>
          {selected.receipts.length} expected receipt
          {selected.receipts.length === 1 ? '' : 's'}
        </Text>
        {receipts.map(receipt => (
          <Pressable
            key={receipt.id}
            accessibilityRole="button"
            accessibilityLabel={`${receipt.number}, ${
              receipt.source
            }, ${formatINR(receipt.amount)}. Open deposit`}
            onPress={() =>
              receipt.kind === 'FD'
                ? actions.openFDDetail(receipt.recordId)
                : actions.openRDDetail(receipt.recordId)
            }
            style={[styles.receipt, { borderTopColor: theme.divider }]}
          >
            <View style={styles.flex}>
              <Text style={[styles.receiptTitle, { color: theme.text }]}>
                {receipt.number} · {formatDate(receipt.date, 'short')}
              </Text>
              <Text style={[styles.caption, { color: theme.textMuted }]}>
                {receipt.bank}
              </Text>
              <Text style={[styles.source, { color: theme.textMuted }]}>
                {receipt.source}
              </Text>
            </View>
            <Text style={[styles.receiptAmount, { color: theme.text }]}>
              {formatINR(receipt.amount)}
            </Text>
            <IconChevronRight size={14} color={theme.textMuted} />
          </Pressable>
        ))}
        {selected.receipts.length === 0 && (
          <Text style={[styles.empty, { color: theme.textMuted }]}>
            No {mode === 'interest' ? 'interest receipts' : 'maturity returns'}{' '}
            scheduled for this month.
          </Text>
        )}
        {selected.receipts.length > 3 && (
          <Pressable
            accessibilityRole="button"
            onPress={() => setExpanded(!expanded)}
            style={styles.more}
          >
            <Text style={[styles.tabText, { color: theme.accent }]}>
              {expanded
                ? 'Show fewer'
                : `View all ${selected.receipts.length} receipts`}
            </Text>
          </Pressable>
        )}
      </View>
      <Text style={[styles.note, { color: theme.textMuted }]}>
        {mode === 'interest'
          ? 'Includes scheduled payouts and full interest paid at maturity, including interest already accrued. RD estimates assume remaining installments are paid.'
          : 'Includes principal and interest returned at maturity. RD estimates assume remaining installments are paid.'}{' '}
        Estimates are before tax; renewals are excluded.
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 18, borderRadius: 22 },
  flex: { flex: 1, minWidth: 0 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  title: { fontFamily: fontFamily.bold, fontSize: 17, letterSpacing: -0.4 },
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },
  switch: { flexDirection: 'row', borderRadius: 12, padding: 3 },
  period: {
    minWidth: 38,
    minHeight: 44,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodText: { fontFamily: fontFamily.semibold, fontSize: 11 },
  selectedPeriodText: { color: '#fff' },
  tabs: { flexDirection: 'row', gap: 16, marginTop: 16, borderBottomWidth: 1 },
  tab: { paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent', flexShrink: 1 },
  tabText: { fontFamily: fontFamily.semibold, fontSize: 12 },
  eyebrow: {
    fontFamily: fontFamily.semibold,
    fontSize: 9,
    letterSpacing: 1.2,
    marginTop: 20,
  },
  total: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    letterSpacing: -0.8,
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  units: { fontFamily: fontFamily.regular, fontSize: 10 },
  details: { marginTop: 16, padding: 12, borderRadius: 14 },
  detailTitle: { fontFamily: fontFamily.semibold, fontSize: 12 },
  receipt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    marginTop: 10,
    paddingTop: 10,
    minHeight: 48,
  },
  receiptTitle: { fontFamily: fontFamily.medium, fontSize: 11 },
  receiptAmount: {
    fontFamily: fontFamily.semibold,
    fontSize: 11,
    flexShrink: 1,
  },
  source: { fontFamily: fontFamily.regular, fontSize: 9, marginTop: 3 },
  empty: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 12,
  },
  more: { paddingTop: 14, paddingBottom: 6 },
  note: {
    fontFamily: fontFamily.regular,
    fontSize: 10,
    lineHeight: 16,
    marginTop: 14,
  },
});
