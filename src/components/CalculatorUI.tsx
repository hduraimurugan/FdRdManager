import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { formatINR } from '../data/portfolioData';
import Card from './Card';
import { IconChevronDown, IconChevronRight } from './icons/Icons';

export function numberError(value: string | number, label: string, min = 0, max = Number.MAX_SAFE_INTEGER, whole = false) {
  const n = Number(value);
  if (String(value).trim() === '' || !Number.isFinite(n)) return `Enter ${label}.`;
  if (n < min || n > max) return max === Number.MAX_SAFE_INTEGER ? `Enter ${label} of at least ${min}.` : `Enter ${label} between ${min} and ${max}.`;
  if (whole && !Number.isInteger(n)) return 'Use a whole number.';
  return undefined;
}

export function CalculatorHeading({ title, subtitle }: { title: string; subtitle: string }) {
  const theme = useTheme();
  return <View style={calculatorStyles.heading}>
    <Text style={[calculatorStyles.title, { color: theme.text }]}>{title}</Text>
    <Text style={[calculatorStyles.body, { color: theme.textMuted }]}>{subtitle}</Text>
  </View>;
}

export function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  const theme = useTheme();
  return <View style={calculatorStyles.heading}>
    <Text style={[calculatorStyles.sectionTitle, { color: theme.text }]}>{title}</Text>
    {subtitle ? <Text style={[calculatorStyles.body, { color: theme.textMuted }]}>{subtitle}</Text> : null}
  </View>;
}

export function DurationPresets({ months, onSelect }: { months: number; onSelect: (months: number) => void }) {
  const theme = useTheme();
  return <View style={calculatorStyles.presets}>
    {[6, 12, 24, 36, 60].map(value => {
      const selected = months === value;
      const label = value < 12 ? `${value} months` : `${value / 12} ${value === 12 ? 'year' : 'years'}`;
      return <Pressable key={value} accessibilityRole="button" accessibilityLabel={`Set duration to ${label}`} accessibilityState={{ selected }} onPress={() => onSelect(value)}
        style={({ pressed }) => [calculatorStyles.chip, { backgroundColor: selected ? theme.tint(theme.accent, 0.16) : theme.inputBg, borderColor: selected ? theme.accent : theme.borderStrong, opacity: pressed ? 0.7 : 1 }]}>
        <Text style={[calculatorStyles.chipText, { color: selected ? theme.accent : theme.textMuted }]}>{label}</Text>
      </Pressable>;
    })}
  </View>;
}

export function CalculatorDisclosure({ title, subtitle, open, onPress, children }: { title: string; subtitle: string; open: boolean; onPress: () => void; children: React.ReactNode }) {
  const theme = useTheme();
  return <Card style={calculatorStyles.section}>
    <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ expanded: open }} onPress={onPress} style={calculatorStyles.disclosure}>
      <View style={calculatorStyles.flex}>
        <Text style={[calculatorStyles.sectionTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[calculatorStyles.body, { color: theme.textMuted }]}>{subtitle}</Text>
      </View>
      {open ? <IconChevronDown size={20} color={theme.accent} /> : <IconChevronRight size={20} color={theme.accent} />}
    </Pressable>
    {open ? children : null}
  </Card>;
}

export function CalculatorMetric({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  const theme = useTheme();
  return <View style={[calculatorStyles.metric, { borderBottomColor: theme.divider }]}>
    <Text style={[calculatorStyles.metricLabel, { color: theme.textMuted }]}>{label}</Text>
    <Text style={[calculatorStyles.metricValue, { color: highlight ? theme.success : theme.text }]}>{value}</Text>
  </View>;
}

export function CalculatorSummary({ deposited, interest, maturityDate, caption, detail }: { deposited: number; interest: number; maturityDate: string; caption: string; detail: string }) {
  const theme = useTheme();
  const total = deposited + interest;
  const share = total > 0 ? Math.max(0, Math.min(1, deposited / total)) : 1;
  return <Card style={[calculatorStyles.summary, { borderColor: theme.tint(theme.accent, 0.4) }]}>
    <View style={calculatorStyles.summaryHeader}>
      <Text style={[calculatorStyles.sectionTitle, { color: theme.text }]}>{caption}</Text>
      <Text style={[calculatorStyles.badge, { backgroundColor: theme.tint(theme.accent, 0.12), color: theme.accent }]}>Estimate</Text>
    </View>
    <Text style={[calculatorStyles.amount, { color: theme.text }]}>{formatINR(total)}</Text>
    <Text style={[calculatorStyles.body, { color: theme.textMuted }]}>At maturity on {maturityDate} · before tax</Text>
    <View accessible accessibilityLabel={`Your deposits ${formatINR(deposited)}, interest earned ${formatINR(interest)}`} style={[calculatorStyles.bar, { backgroundColor: theme.success }]}>
      <View style={[calculatorStyles.barDeposit, { width: `${share * 100}%`, backgroundColor: theme.accent }]} />
    </View>
    <View style={calculatorStyles.breakdown}>
      <View style={calculatorStyles.flex}>
        <Text style={[calculatorStyles.legend, { color: theme.textMuted }]}><Text style={{ color: theme.accent }}>● </Text>Your deposits</Text>
        <Text style={[calculatorStyles.breakdownValue, { color: theme.text }]}>{formatINR(deposited)}</Text>
      </View>
      <View style={calculatorStyles.flex}>
        <Text style={[calculatorStyles.legend, { color: theme.textMuted }]}><Text style={{ color: theme.success }}>● </Text>Interest earned</Text>
        <Text style={[calculatorStyles.breakdownValue, { color: theme.success }]}>{formatINR(interest)}</Text>
      </View>
    </View>
    <Text style={[calculatorStyles.body, { color: theme.textMuted }]}>{detail}</Text>
  </Card>;
}

export function CalculatorEmpty() {
  const theme = useTheme();
  return <Card style={calculatorStyles.section}>
    <SectionHeading title="Your estimate will appear here" subtitle="Complete the highlighted fields with a deposit amount and duration to see your returns." />
    <Text accessibilityRole="alert" style={[calculatorStyles.body, { color: theme.danger }]}>Check your deposit details above.</Text>
  </Card>;
}

export const calculatorStyles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  container: { padding: 16, paddingBottom: 48, gap: 16 },
  heading: { gap: 5 },
  title: { fontFamily: fontFamily.bold, fontSize: 23, lineHeight: 30 },
  sectionTitle: { fontFamily: fontFamily.semibold, fontSize: 16, lineHeight: 23 },
  body: { fontFamily: fontFamily.regular, fontSize: 12.5, lineHeight: 19 },
  section: { gap: 16 },
  row: { flexDirection: 'row', gap: 10 },
  input: { minHeight: 48, fontFamily: fontFamily.medium, fontSize: 16 },
  amountInput: { minHeight: 56, fontFamily: fontFamily.semibold, fontSize: 23 },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 44, paddingHorizontal: 12, paddingVertical: 11, borderWidth: 1, borderRadius: 10, justifyContent: 'center' },
  chipText: { fontFamily: fontFamily.semibold, fontSize: 12 },
  disclosure: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 12 },
  summary: { gap: 12, padding: 20, borderRadius: 20 },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  badge: { fontFamily: fontFamily.medium, fontSize: 11, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 7, overflow: 'hidden' },
  amount: { fontFamily: fontFamily.bold, fontSize: 32, letterSpacing: -0.8, fontVariant: ['tabular-nums'] },
  bar: { height: 9, borderRadius: 5, overflow: 'hidden', marginTop: 6 },
  barDeposit: { height: '100%' },
  breakdown: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  legend: { fontFamily: fontFamily.regular, fontSize: 12, lineHeight: 20 },
  breakdownValue: { fontFamily: fontFamily.semibold, fontSize: 16, marginTop: 4, fontVariant: ['tabular-nums'] },
  metric: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, paddingVertical: 10, borderBottomWidth: 1 },
  metricLabel: { fontFamily: fontFamily.regular, fontSize: 13, lineHeight: 20, flexShrink: 1 },
  metricValue: { fontFamily: fontFamily.semibold, fontSize: 13, lineHeight: 20, fontVariant: ['tabular-nums'] },
});
