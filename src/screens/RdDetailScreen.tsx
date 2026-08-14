import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { useAppActions, useAppState } from '../state/AppContext';
import { decorateRD } from '../state/selectors';
import { formatINR, formatDate } from '../data/portfolioData';
import { GRADIENT_ANGLE } from '../theme/colors';
import { RootStackParamList } from '../navigation/types';
import Card from '../components/Card';
import TopAppBar from '../components/TopAppBar';
import Avatar from '../components/Avatar';
import StatusBadge from '../components/StatusBadge';
import ProgressBar from '../components/ProgressBar';
import { IconChevronDown } from '../components/icons/Icons';

type Props = NativeStackScreenProps<RootStackParamList, 'RdDetail'>;

export default function RdDetailScreen({ route }: Props) {
  const theme = useTheme();
  const state = useAppState();
  const actions = useAppActions();
  const raw = state.rdList.find(r => r.id === route.params.id);
  const rd = useMemo(() => (raw ? decorateRD(raw, theme) : null), [raw, theme]);

  if (!rd) {
    return (
      <View style={[styles.flex, { backgroundColor: theme.bg }]}>
        <TopAppBar title="RD" showBack onBack={actions.back} />
      </View>
    );
  }

  const canClose = rd.status === 'Active';

  return (
    <View style={[styles.flex, { backgroundColor: theme.bg }]}>
      <TopAppBar title={rd.rdNumber} showBack onBack={actions.back} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Avatar bg={rd.avatarBg} fg={rd.avatarFg} initials={rd.bankInitials} size={44} />
            <View>
              <Text style={[styles.bankName, { color: theme.text }]}>{rd.bankName}</Text>
              <Text style={[styles.meta, { color: theme.textFaint }]}>
                {rd.rdNumber} · {rd.branch}
              </Text>
            </View>
          </View>
          <StatusBadge bg={rd.statusBg} fg={rd.statusFg} label={rd.statusLabel} />
        </View>

        <Card style={styles.statGrid}>
          <View style={styles.statCol}>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Monthly installment</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{formatINR(rd.monthlyInstallment)}</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Interest rate</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{rd.rateLabel}</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Total deposited</Text>
            <Text style={[styles.statValueSm, { color: theme.text }]}>{formatINR(rd.totalDeposited)}</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Maturity value</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{formatINR(rd.maturityAmount)}</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Interest earned so far</Text>
            <Text style={[styles.statValue, { color: theme.success }]}>{formatINR(rd.interestEarnedSoFar)}</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Current value</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{formatINR(rd.currentValue)}</Text>
          </View>
        </Card>

        <View>
          <View style={styles.installRow}>
            <Text style={[styles.installLabel, { color: theme.textMuted }]}>Installments paid</Text>
            <Text style={[styles.installLabel, { color: theme.textMuted }]}>
              {rd.installmentsPaid} / {rd.installmentsTotal}
            </Text>
          </View>
          <ProgressBar progress={rd.progressPct} fill={rd.progressColor} height={7} />
          {rd.installmentsMissed > 0 && (
            <Text style={[styles.missedText, { color: theme.danger }]}>{rd.installmentsMissed} installment missed — pay to avoid penalty</Text>
          )}
        </View>

        <View style={styles.tenureRow}>
          <Card style={styles.tenureCard}>
            <Text style={[styles.tenureValue, { color: theme.text }]}>{formatDate(rd.startDate, 'short')}</Text>
            <Text style={[styles.tenureLabel, { color: theme.textMuted }]}>Start date</Text>
          </Card>
          <Card style={styles.tenureCard}>
            <Text style={[styles.tenureValue, { color: theme.text }]}>{formatDate(rd.maturityDate, 'short')}</Text>
            <Text style={[styles.tenureLabel, { color: theme.textMuted }]}>Maturity date</Text>
          </Card>
        </View>

        <Pressable onPress={actions.toggleRdDetails}>
          <Card>
            <View style={styles.collapseHeader}>
              <Text style={[styles.collapseTitle, { color: theme.text }]}>Account details</Text>
              <View style={{ transform: [{ rotate: state.rdDetailsOpen ? '180deg' : '0deg' }] }}>
                <IconChevronDown color={theme.textFaint} />
              </View>
            </View>
            {state.rdDetailsOpen && (
              <View style={styles.collapseBody}>
                <View style={styles.kvRow}>
                  <Text style={[styles.kvLabel, { color: theme.textMuted }]}>Compounding</Text>
                  <Text style={[styles.kvValue, { color: theme.text }]}>{rd.compoundingFrequency}</Text>
                </View>
                <View style={styles.kvRow}>
                  <Text style={[styles.kvLabel, { color: theme.textMuted }]}>Auto-debit</Text>
                  <Text style={[styles.kvValue, { color: theme.text }]}>{rd.autoDebit}</Text>
                </View>
                <View style={styles.kvRow}>
                  <Text style={[styles.kvLabel, { color: theme.textMuted }]}>Account number</Text>
                  <Text style={[styles.kvValue, { color: theme.text }]}>{rd.bankAccountNumber}</Text>
                </View>
              </View>
            )}
          </Card>
        </Pressable>

        <View style={styles.actionRow}>
          <Pressable style={styles.actionFlex} onPress={() => actions.openEditRD(rd.id)}>
            <LinearGradient colors={theme.gradientAccent.colors} start={GRADIENT_ANGLE.start} end={GRADIENT_ANGLE.end} style={styles.actionBtn}>
              <Text style={styles.actionTextLight}>Edit</Text>
            </LinearGradient>
          </Pressable>
          {canClose && (
            <Pressable
              style={styles.actionFlex}
              onPress={() => actions.askConfirm('close', 'RD', rd.id, 'Mark RD as closed?', 'This marks the deposit as closed.', 'Mark Closed')}
            >
              <View style={[styles.actionBtnOutline, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.actionText, { color: theme.text }]}>Mark as Closed</Text>
              </View>
            </Pressable>
          )}
          <Pressable
            style={styles.actionFlex}
            onPress={() => actions.askConfirm('delete', 'RD', rd.id, 'Delete this RD?', 'This will permanently remove the deposit and cannot be undone.', 'Delete')}
          >
            <View style={[styles.actionBtnOutline, { backgroundColor: theme.card, borderColor: 'rgba(248,113,113,0.25)' }]}>
              <Text style={[styles.actionText, { color: theme.danger }]}>Delete</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    gap: 12,
  },
  bankName: {
    fontFamily: fontFamily.bold,
    fontSize: 19,
  },
  meta: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    marginTop: 2,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statCol: {
    width: '45%',
  },
  statLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 11.5,
  },
  statValue: {
    fontFamily: fontFamily.bold,
    fontSize: 17,
    marginTop: 3,
  },
  statValueSm: {
    fontFamily: fontFamily.semibold,
    fontSize: 15,
    marginTop: 3,
  },
  installRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  installLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 12.5,
  },
  missedText: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    marginTop: 8,
  },
  tenureRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tenureCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
  },
  tenureValue: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
  },
  tenureLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    marginTop: 2,
  },
  collapseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  collapseTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: 14,
  },
  collapseBody: {
    marginTop: 14,
    gap: 10,
  },
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  kvLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
  },
  kvValue: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionFlex: {
    flexGrow: 1,
    minWidth: 120,
  },
  actionBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
  },
  actionBtnOutline: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  actionText: {
    fontFamily: fontFamily.semibold,
    fontSize: 13.5,
  },
  actionTextLight: {
    fontFamily: fontFamily.semibold,
    fontSize: 13.5,
    color: '#fff',
  },
});
