import React, { useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { useAppActions, useAppState } from '../state/AppContext';
import { homeMetrics, urgentNotifications, bankDistribution, typeDistribution } from '../state/selectors';
import { today } from '../data/derive';
import { GRADIENT_ANGLE } from '../theme/colors';
import { useRefresh } from '../hooks/useRefresh';
import Card from '../components/Card';
import BankLogo from '../components/BankLogo';
import DonutChart from '../components/DonutChart';
import CashFlowCard from '../components/CashFlowCard';
import SkeletonBlock from '../components/SkeletonBlock';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { IconTrendUp, IconCalendar, IconChevronRight, IconWallet, IconBell } from '../components/icons/Icons';

export default function HomeScreen() {
  const theme = useTheme();
  const state = useAppState();
  const actions = useAppActions();
  const { refreshing, onRefresh } = useRefresh();

  const todayLabel = useMemo(
    () => today().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    [],
  );
  const metrics = useMemo(() => homeMetrics(state), [state]);
  const urgent = useMemo(() => urgentNotifications(state, theme), [state, theme]);
  const banks = useMemo(() => bankDistribution(state), [state]);
  const types = useMemo(() => typeDistribution(state, theme), [state, theme]);
  const isEmpty = state.fdList.length === 0 && state.rdList.length === 0;

  if (state.loadError) {
    return (
      <ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} colors={[theme.accent]} progressBackgroundColor={theme.card} />}>
        <ErrorState title="Couldn't load your portfolio" subtitle="Something went wrong reading your saved data." onRetry={actions.retryLoad} />
      </ScrollView>
    );
  }

  if (!state.hydrated) {
    return (
      <ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} colors={[theme.accent]} progressBackgroundColor={theme.card} />}>
        <SkeletonBlock height={150} />
        <SkeletonBlock height={90} />
        <SkeletonBlock height={180} />
      </ScrollView>
    );
  }

  if (isEmpty) {
    return (
      <ScrollView contentContainerStyle={styles.emptyContainer} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} colors={[theme.accent]} progressBackgroundColor={theme.card} />}>
        <EmptyState
          title="No deposits yet"
          subtitle="Add your first FD or RD to see your portfolio here."
          actionLabel="Add a deposit"
          onAction={() => actions.setTab('portfolio')}
          gradient={theme.gradientHero}
          icon={<IconWallet size={30} color="#fff" />}
          highlights={[
            { icon: <IconWallet size={16} color={theme.accent} />, label: 'Track FD & RD in one place' },
            { icon: <IconBell size={16} color={theme.accent} />, label: 'Get maturity & payout reminders' },
            { icon: <IconTrendUp size={16} color={theme.accent} />, label: 'See growth projections' },
          ]}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} colors={[theme.accent]} progressBackgroundColor={theme.card} />}
    >
      <LinearGradient colors={theme.gradientHero.colors} locations={theme.gradientHero.locations} start={GRADIENT_ANGLE.start} end={GRADIENT_ANGLE.end} style={styles.hero}>
        <Text style={[styles.heroLabel, { color: theme.textMuted }]}>{todayLabel}</Text>
        <View style={styles.heroHeading}>
          <Text style={[styles.heroSub, { color: theme.textMuted }]}>Portfolio balance</Text>
          <View style={[styles.liveBadge, { backgroundColor: theme.tint(theme.success, 0.12) }]}>
            <View style={[styles.liveDot, { backgroundColor: theme.success }]} />
            <Text style={[styles.badgeText, { color: theme.success }]}>{metrics.activeCount} active</Text>
          </View>
        </View>
        <Text adjustsFontSizeToFit numberOfLines={1} style={[styles.heroValue, { color: theme.text }]}>₹{metrics.currentValueFmt}</Text>
        <Text style={[styles.heroExact, { color: theme.textMuted }]}>{metrics.currentValueExact} across active deposits</Text>
        <View style={[styles.heroRow, { borderTopColor: theme.tint(theme.text, 0.1) }]}>
          <View style={styles.flexShrink}>
            <Text style={[styles.heroItemLabel, { color: theme.textMuted }]}>Invested (all)</Text>
            <Text style={[styles.heroItemValue, { color: theme.text }]}>₹{metrics.totalInvestedFmt}</Text>
          </View>
          <View style={styles.flexShrink}>
            <Text style={[styles.heroItemLabel, { color: theme.textMuted }]}>Avg. active rate</Text>
            <Text style={[styles.heroItemValue, { color: theme.text }]}>{metrics.weightedRateLabel} <Text style={styles.rateUnit}>p.a.</Text></Text>
          </View>
          <View style={styles.flexShrink}>
            <Text style={[styles.heroItemLabel, { color: theme.textMuted }]}>Banks</Text>
            <Text style={[styles.heroItemValue, { color: theme.text }]}>{banks.length}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: theme.tint(theme.success, 0.12) }]}>
            <IconTrendUp color={theme.success} size={18} />
          </View>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>Interest earned</Text>
          <Text style={[styles.statValue, { color: theme.success }]}>₹{metrics.interestEarnedFmt}</Text>
          <Text style={[styles.cardCaption, { color: theme.textMuted }]}>Earned across all deposits</Text>
        </Card>
        <Card style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: theme.tint(theme.orange, 0.12) }]}>
            <IconCalendar color={theme.orange} size={18} />
          </View>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>Maturity value</Text>
          <Text style={[styles.statValue, { color: theme.text }]}>₹{metrics.maturityValueFmt}</Text>
          <Text style={[styles.cardCaption, { color: theme.textMuted }]}>Active deposits at maturity</Text>
        </Card>
      </View>

      <Card style={styles.activityCard}>
        <Text style={[styles.sectionLabel, { color: theme.text }]}>This month</Text>
        <View style={styles.activityRow}>
          <View style={styles.flexShrink}><Text style={[styles.activityValue, { color: theme.accent }]}>{metrics.payoutsThisMonthFmt}</Text><Text style={[styles.cardCaption, { color: theme.textMuted }]}>Payouts & installments</Text></View>
          <View style={[styles.activityDivider, { backgroundColor: theme.borderStrong }]} />
          <View style={styles.flexShrink}><Text style={[styles.activityValue, { color: theme.text }]}>{metrics.maturitiesThisMonth}</Text><Text style={[styles.cardCaption, { color: theme.textMuted }]}>Maturities</Text></View>
          <View style={[styles.activityDivider, { backgroundColor: theme.borderStrong }]} />
          <View style={styles.flexShrink}><Text style={[styles.activityValue, { color: theme.text }]}>{metrics.maturedCount}</Text><Text style={[styles.cardCaption, { color: theme.textMuted }]}>Matured overall</Text></View>
        </View>
      </Card>

      {urgent.length > 0 && (
        <View>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Needs your attention</Text>
          <View style={styles.gap8}>
            {urgent.map(n => (
              <Pressable
                key={n.id}
                onPress={() => (n.recordType === 'FD' ? actions.openFDDetail(n.recordId) : actions.openRDDetail(n.recordId))}
                style={[styles.urgentRow, { backgroundColor: n.tintBg, borderLeftColor: n.accentColor }]}
              >
                <View style={styles.flexShrink}>
                  <Text style={[styles.urgentTitle, { color: theme.text }]}>{n.title}</Text>
                  <Text style={[styles.urgentSubtitle, { color: theme.textMuted }]}>{n.subtitle}</Text>
                </View>
                <IconChevronRight size={16} color={theme.textFaint} />
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <CashFlowCard />

      <View>
        <Text style={[styles.sectionLabel, { color: theme.text }]}>Bank allocation</Text>
        <Card style={styles.gap12}>
          <View style={styles.rowBetween}>
            <Text style={[styles.cardCaption, { color: theme.textMuted }]}>All recorded deposits · {banks.length} bank{banks.length === 1 ? '' : 's'}</Text>
            <Text style={[styles.badgeText, { color: theme.accent }]}>{metrics.totalInvestedCompact}</Text>
          </View>
          {banks.map(b => (
            <View key={b.bank}>
              <View style={styles.rowBetween}>
                <View style={styles.bankLabelRow}>
                  <BankLogo bankName={b.bank} size={28} />
                  <Text style={[styles.bankLabel, { color: theme.text }]}>{b.bank}</Text>
                </View>
                <Text style={[styles.bankAmount, { color: theme.text }]}>{b.amountFmt}</Text>
              </View>
              <View style={styles.allocationMeta}>
                <Text style={[styles.cardCaption, { color: theme.textMuted }]}>{b.count} deposit{b.count === 1 ? '' : 's'}</Text>
                <Text style={[styles.badgeText, { color: theme.accent }]}>{b.pct.toFixed(1)}% of invested</Text>
              </View>
              <View style={[styles.barTrack, { backgroundColor: theme.divider }]}>
                <LinearGradient colors={theme.gradientAccent.colors} start={GRADIENT_ANGLE.start} end={GRADIENT_ANGLE.end} style={[styles.barFill, { width: `${b.pct}%` }]} />
              </View>
            </View>
          ))}
        </Card>
      </View>

      <View>
        <Text style={[styles.sectionLabel, { color: theme.text }]}>Deposit mix</Text>
        <Card style={styles.typeCard}>
          <View style={styles.donutSummary}>
            <DonutChart entries={types.entries} centerLabel={types.totalCompact} />
            <Text style={[styles.cardCaption, { color: theme.textMuted }]}>All recorded deposits · {types.entries.length} type{types.entries.length === 1 ? '' : 's'}</Text>
          </View>
          <View style={styles.typeList}>
            {types.entries.map(t => (
              <View key={t.type} style={styles.typeRow}>
                <View style={[styles.typeDot, { backgroundColor: t.color }]} />
                <View style={styles.flexShrink}>
                  <Text style={[styles.typeLabel, { color: theme.text }]}>{t.type}</Text>
                  <Text style={[styles.cardCaption, { color: theme.textMuted }]}>{t.count} deposit{t.count === 1 ? '' : 's'} · {t.amountFmt}</Text>
                </View>
                <Text style={[styles.typePct, { color: theme.text }]}>{t.pctLabel}</Text>
              </View>
            ))}
          </View>
          <View style={[styles.productMix, { borderTopColor: theme.divider }]}>
            <Text style={[styles.bankLabel, { color: theme.text }]}>Fixed vs recurring</Text>
            <View style={[styles.productTrack, { backgroundColor: theme.divider }]}>
              <View style={{ width: `${metrics.fdShare}%`, backgroundColor: theme.accent }} />
              <View style={{ width: `${metrics.rdShare}%`, backgroundColor: theme.success }} />
            </View>
            <View style={styles.productRow}>
              <View style={styles.flexShrink}>
                <Text style={[styles.badgeText, { color: theme.accent }]}>FD · {metrics.fdShare.toFixed(1)}%</Text>
                <Text style={[styles.bankAmount, styles.productAmount, { color: theme.text }]}>{metrics.fdInvestedFmt}</Text>
                <Text style={[styles.cardCaption, { color: theme.textMuted }]}>{metrics.fdCount} fixed deposit{metrics.fdCount === 1 ? '' : 's'}</Text>
              </View>
              <View style={styles.flexShrink}>
                <Text style={[styles.badgeText, { color: theme.success }]}>RD · {metrics.rdShare.toFixed(1)}%</Text>
                <Text style={[styles.bankAmount, styles.productAmount, { color: theme.text }]}>{metrics.rdInvestedFmt}</Text>
                <Text style={[styles.cardCaption, { color: theme.textMuted }]}>{metrics.rdCount} recurring deposit{metrics.rdCount === 1 ? '' : 's'}</Text>
              </View>
            </View>
          </View>
        </Card>
      </View>

      <Pressable accessibilityRole="button" accessibilityLabel="View maturity timeline" onPress={actions.goMaturityTimeline}>
        <Card style={styles.timelineRow}>
          <LinearGradient colors={theme.gradientAccent.colors} start={GRADIENT_ANGLE.start} end={GRADIENT_ANGLE.end} style={styles.timelineIcon}>
            <IconCalendar color="#fff" size={19} />
          </LinearGradient>
          <View style={styles.flexShrink}>
            <Text style={[styles.timelineTitle, { color: theme.text }]}>Maturity timeline</Text>
            <Text style={[styles.timelineSubtitle, { color: theme.textMuted }]}>{metrics.upcomingMaturityCount} deposits mature in the next 12 months</Text>
          </View>
          <IconChevronRight size={17} color={theme.textFaint} />
        </Card>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 100,
    gap: 20,
  },
  emptyContainer: {
    padding: 16,
    paddingBottom: 100,
    gap: 20,
    flexGrow: 1,
    justifyContent: 'center',
  },
  hero: {
    borderRadius: 24,
    padding: 22,
  },
  heroLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: 10.5,
    letterSpacing: 0.2,
  },
  heroSub: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
  },
  heroValue: {
    fontFamily: fontFamily.extrabold,
    fontSize: 40,
    letterSpacing: -1.5,
    marginTop: 8,
    fontVariant: ['tabular-nums'],
  },
  heroRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  heroItemLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 10,
  },
  heroItemValue: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: 130,
    padding: 16,
    borderRadius: 20,
  },
  statIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
    letterSpacing: -0.2,
  },
  sectionLabel: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  gap8: {
    gap: 8,
  },
  gap12: {
    gap: 18,
    borderRadius: 22,
  },
  urgentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderLeftWidth: 3,
    borderRadius: 14,
    padding: 14,
  },
  flexShrink: {
    flex: 1,
    minWidth: 0,
  },
  urgentTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: 14,
  },
  urgentSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 12.5,
    marginTop: 2,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  bankLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  bankLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 12.5,
    flexShrink: 1,
  },
  bankAmount: {
    fontFamily: fontFamily.semibold,
    fontSize: 12,
    flexShrink: 1,
    marginLeft: 8,
    fontVariant: ['tabular-nums'],
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  typeCard: {
    gap: 20,
    borderRadius: 22,
  },
  typeList: {
    gap: 14,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  typeLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: 13,
  },
  typePct: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  timelineIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: 14,
  },
  timelineSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 12.5,
    marginTop: 2,
  },
  heroHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 18 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  liveDot: { width: 5, height: 5, borderRadius: 3 },
  badgeText: { fontFamily: fontFamily.semibold, fontSize: 10 },
  heroExact: { fontFamily: fontFamily.regular, fontSize: 11, marginTop: 4 },
  rateUnit: { fontFamily: fontFamily.regular, fontSize: 9 },
  cardCaption: { fontFamily: fontFamily.regular, fontSize: 10, lineHeight: 15, marginTop: 4 },
  activityCard: { borderRadius: 18, padding: 16 },
  activityRow: { flexDirection: 'row', gap: 12 },
  activityValue: { fontFamily: fontFamily.bold, fontSize: 18, fontVariant: ['tabular-nums'] },
  activityDivider: { width: 1 },
  allocationMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, gap: 8 },
  donutSummary: { alignItems: 'center', gap: 10 },
  productMix: { borderTopWidth: 1, paddingTop: 16, gap: 12 },
  productTrack: { height: 8, borderRadius: 4, overflow: 'hidden', flexDirection: 'row' },
  productRow: { flexDirection: 'row', gap: 16 },
  productAmount: { marginLeft: 0, marginTop: 6 },
});
