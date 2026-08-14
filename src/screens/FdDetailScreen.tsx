import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { useAppActions, useAppState } from '../state/AppContext';
import { decorateFD } from '../state/selectors';
import { formatINR, formatDate } from '../data/portfolioData';
import { GRADIENT_ANGLE } from '../theme/colors';
import { RootStackParamList } from '../navigation/types';
import Card from '../components/Card';
import TopAppBar from '../components/TopAppBar';
import Avatar from '../components/Avatar';
import StatusBadge from '../components/StatusBadge';
import ProgressBar from '../components/ProgressBar';
import { IconChevronDown } from '../components/icons/Icons';

type Props = NativeStackScreenProps<RootStackParamList, 'FdDetail'>;

export default function FdDetailScreen({ route }: Props) {
  const theme = useTheme();
  const state = useAppState();
  const actions = useAppActions();
  const raw = state.fdList.find(f => f.id === route.params.id);
  const fd = useMemo(() => (raw ? decorateFD(raw, theme) : null), [raw, theme]);

  if (!fd) {
    return (
      <View style={[styles.flex, { backgroundColor: theme.bg }]}>
        <TopAppBar title="FD" showBack onBack={actions.back} />
      </View>
    );
  }

  const canRenew = fd.status === 'Active';
  const canClose = fd.status === 'Active';

  return (
    <View style={[styles.flex, { backgroundColor: theme.bg }]}>
      <TopAppBar title={fd.fdNumber} showBack onBack={actions.back} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Avatar bg={fd.avatarBg} fg={fd.avatarFg} initials={fd.bankInitials} size={44} />
            <View>
              <Text style={[styles.bankName, { color: theme.text }]}>{fd.bankName}</Text>
              <Text style={[styles.meta, { color: theme.textFaint }]}>
                {fd.fdNumber} · {fd.branch}
              </Text>
            </View>
          </View>
          <StatusBadge bg={fd.statusBg} fg={fd.statusFg} label={fd.statusLabel} />
        </View>

        <Card style={styles.statGrid}>
          <View style={styles.statCol}>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Principal amount</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{formatINR(fd.principalAmount)}</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Interest rate</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{fd.rateLabel}</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Interest type</Text>
            <Text style={[styles.statValueSm, { color: theme.text }]}>
              {fd.interestType} · {fd.compoundingFrequency}
            </Text>
          </View>
          <View style={styles.statCol}>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Maturity value</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{formatINR(fd.maturityAmount)}</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Interest earned so far</Text>
            <Text style={[styles.statValue, { color: theme.success }]}>{formatINR(fd.interestEarnedSoFar)}</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Current value</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{formatINR(fd.currentValue)}</Text>
          </View>
        </Card>

        <View>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Timeline</Text>
          <Card>
            <ProgressBar progress={fd.progressPct} fill={fd.progressColor} height={4} />
            <View style={styles.timelineLabels}>
              <Text style={[styles.timelineLabel, { color: theme.textFaint }]}>Start{'\n'}{formatDate(fd.startDate, 'short')}</Text>
              <Text style={[styles.timelineLabel, styles.right, { color: theme.textFaint }]}>Maturity{'\n'}{formatDate(fd.maturityDate, 'short')}</Text>
            </View>
          </Card>
        </View>

        <View style={styles.tenureRow}>
          <Card style={styles.tenureCard}>
            <Text style={[styles.tenureValue, { color: theme.text }]}>{fd.tenureYears}</Text>
            <Text style={[styles.tenureLabel, { color: theme.textMuted }]}>Years</Text>
          </Card>
          <Card style={styles.tenureCard}>
            <Text style={[styles.tenureValue, { color: theme.text }]}>{fd.tenureMonths}</Text>
            <Text style={[styles.tenureLabel, { color: theme.textMuted }]}>Months</Text>
          </Card>
          <Card style={styles.tenureCard}>
            <Text style={[styles.tenureValue, { color: theme.text }]}>{fd.tenureDays}</Text>
            <Text style={[styles.tenureLabel, { color: theme.textMuted }]}>Days</Text>
          </Card>
        </View>

        <Pressable onPress={actions.toggleFdPayout}>
          <Card>
            <View style={styles.collapseHeader}>
              <Text style={[styles.collapseTitle, { color: theme.text }]}>Payout information</Text>
              <View style={{ transform: [{ rotate: state.fdPayoutOpen ? '180deg' : '0deg' }] }}>
                <IconChevronDown color={theme.textFaint} />
              </View>
            </View>
            {state.fdPayoutOpen && (
              <View style={styles.collapseBody}>
                <View style={styles.kvRow}>
                  <Text style={[styles.kvLabel, { color: theme.textMuted }]}>Payout frequency</Text>
                  <Text style={[styles.kvValue, { color: theme.text }]}>{fd.interestPayoutMode}</Text>
                </View>
                {fd.isPayoutFD && (
                  <>
                    <View style={styles.kvRow}>
                      <Text style={[styles.kvLabel, { color: theme.textMuted }]}>Next payout date</Text>
                      <Text style={[styles.kvValue, { color: theme.text }]}>{formatDate(fd.nextPayoutDate, 'short')}</Text>
                    </View>
                    <View style={styles.kvRow}>
                      <Text style={[styles.kvLabel, { color: theme.textMuted }]}>Expected payout amount</Text>
                      <Text style={[styles.kvValueAccent, { color: theme.success }]}>{formatINR(fd.nextPayoutAmount)}</Text>
                    </View>
                  </>
                )}
                <View style={styles.kvRow}>
                  <Text style={[styles.kvLabel, { color: theme.textMuted }]}>Credit method</Text>
                  <Text style={[styles.kvValue, { color: theme.text }]}>{fd.interestCreditMethod}</Text>
                </View>
              </View>
            )}
          </Card>
        </Pressable>

        <Pressable onPress={actions.toggleFdRenewal}>
          <Card>
            <View style={styles.collapseHeader}>
              <Text style={[styles.collapseTitle, { color: theme.text }]}>Renewal</Text>
              <View style={{ transform: [{ rotate: state.fdRenewalOpen ? '180deg' : '0deg' }] }}>
                <IconChevronDown color={theme.textFaint} />
              </View>
            </View>
            {state.fdRenewalOpen && (
              <View style={styles.collapseBody}>
                <View style={styles.kvRow}>
                  <Text style={[styles.kvLabel, { color: theme.textMuted }]}>Auto-renewal</Text>
                  <Text style={[styles.kvValue, { color: theme.text }]}>{fd.autoRenewal}</Text>
                </View>
                <View style={styles.kvRow}>
                  <Text style={[styles.kvLabel, { color: theme.textMuted }]}>Renewal instruction</Text>
                  <Text style={[styles.kvValue, styles.right, { color: theme.text }]}>{fd.renewalOption}</Text>
                </View>
              </View>
            )}
          </Card>
        </Pressable>

        <View style={styles.actionRow}>
          <Pressable style={styles.actionFlex} onPress={() => actions.openEditFD(fd.id)}>
            <LinearGradient colors={theme.gradientAccent.colors} start={GRADIENT_ANGLE.start} end={GRADIENT_ANGLE.end} style={styles.actionBtn}>
              <Text style={styles.actionTextLight}>Edit</Text>
            </LinearGradient>
          </Pressable>
          {canRenew && (
            <Pressable
              style={styles.actionFlex}
              onPress={() => actions.askConfirm('renew', 'FD', fd.id, 'Renew this FD?', 'The FD will be renewed for the same tenure from its maturity date.', 'Renew')}
            >
              <View style={[styles.actionBtnOutline, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.actionText, { color: theme.text }]}>Renew</Text>
              </View>
            </Pressable>
          )}
          {canClose && (
            <Pressable
              style={styles.actionFlex}
              onPress={() => actions.askConfirm('close', 'FD', fd.id, 'Mark FD as closed?', 'This marks the deposit as closed. This cannot be undone in this demo.', 'Mark Closed')}
            >
              <View style={[styles.actionBtnOutline, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.actionText, { color: theme.text }]}>Mark as Closed</Text>
              </View>
            </Pressable>
          )}
          {canClose && (
            <Pressable
              style={styles.actionFlex}
              onPress={() => actions.askConfirm('premature', 'FD', fd.id, 'Premature closure?', 'Closing before maturity may attract a penalty and lower interest rate.', 'Close Now')}
            >
              <View style={[styles.actionBtnOutline, { backgroundColor: theme.card, borderColor: 'rgba(248,113,113,0.25)' }]}>
                <Text style={[styles.actionText, { color: theme.danger }]}>Premature Closure</Text>
              </View>
            </Pressable>
          )}
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
  sectionLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 12,
  },
  timelineLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  timelineLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 10.5,
    lineHeight: 15,
  },
  right: {
    textAlign: 'right',
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
    fontSize: 18,
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
  kvValueAccent: {
    fontFamily: fontFamily.semibold,
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
