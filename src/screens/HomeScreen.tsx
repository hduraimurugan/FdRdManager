import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { useAppActions, useAppState } from '../state/AppContext';
import { homeMetrics, urgentNotifications, bankDistribution, typeDistribution, projectedInterest } from '../state/selectors';
import { today } from '../data/derive';
import { GRADIENT_ANGLE } from '../theme/colors';
import Card from '../components/Card';
import StatPill from '../components/StatPill';
import DonutChart from '../components/DonutChart';
import BarChart from '../components/BarChart';
import SkeletonBlock from '../components/SkeletonBlock';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { IconRupeeTrend, IconCard, IconTrendUp, IconCalendar, IconChevronRight } from '../components/icons/Icons';

export default function HomeScreen() {
  const theme = useTheme();
  const state = useAppState();
  const actions = useAppActions();

  const todayLabel = useMemo(
    () => today().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    [],
  );
  const metrics = useMemo(() => homeMetrics(state), [state]);
  const urgent = useMemo(() => urgentNotifications(state, theme), [state, theme]);
  const banks = useMemo(() => bankDistribution(state), [state]);
  const types = useMemo(() => typeDistribution(state, theme), [state, theme]);
  const projection = useMemo(() => projectedInterest(state), [state]);
  const isEmpty = state.fdList.length === 0 && state.rdList.length === 0;

  if (state.loadError) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <ErrorState title="Couldn't load your portfolio" subtitle="Something went wrong reading your saved data." onRetry={actions.retryLoad} />
      </ScrollView>
    );
  }

  if (!state.hydrated) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <SkeletonBlock height={150} />
        <SkeletonBlock height={90} />
        <SkeletonBlock height={180} />
      </ScrollView>
    );
  }

  if (isEmpty) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <EmptyState
          title="No deposits yet"
          subtitle="Add your first FD or RD to see your portfolio here."
          actionLabel="Add a deposit"
          onAction={() => actions.setTab('portfolio')}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={theme.gradientHero.colors} locations={theme.gradientHero.locations} start={GRADIENT_ANGLE.start} end={GRADIENT_ANGLE.end} style={styles.hero}>
        <Text style={[styles.heroLabel, { color: theme.textMuted }]}>{todayLabel}</Text>
        <Text style={[styles.heroSub, { color: theme.textMuted }]}>Current value</Text>
        <Text style={[styles.heroValue, { color: theme.text }]}>{metrics.currentValueFmt}</Text>
        <View style={styles.heroRow}>
          <View>
            <Text style={[styles.heroItemLabel, { color: theme.textMuted }]}>Invested</Text>
            <Text style={[styles.heroItemValue, { color: theme.text }]}>{metrics.totalInvestedFmt}</Text>
          </View>
          <View>
            <Text style={[styles.heroItemLabel, { color: theme.textMuted }]}>Interest earned</Text>
            <Text style={[styles.heroItemValue, { color: theme.success }]}>{metrics.interestEarnedFmt}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(111,102,232,0.13)' }]}>
            <IconRupeeTrend color={theme.accent} />
          </View>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>Total invested</Text>
          <Text style={[styles.statValue, { color: theme.text }]}>{metrics.totalInvestedFmt}</Text>
        </Card>
        <Card style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(91,158,224,0.15)' }]}>
            <IconCard color="#5b9ee0" />
          </View>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>Current value</Text>
          <Text style={[styles.statValue, { color: theme.text }]}>{metrics.currentValueFmt}</Text>
        </Card>
        <Card style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(14,164,114,0.13)' }]}>
            <IconTrendUp color={theme.success} />
          </View>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>Interest earned</Text>
          <Text style={[styles.statValue, { color: theme.success }]}>{metrics.interestEarnedFmt}</Text>
        </Card>
        <Card style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(226,121,63,0.14)' }]}>
            <IconCalendar color={theme.orange} />
          </View>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>Maturity value</Text>
          <Text style={[styles.statValue, { color: theme.text }]}>{metrics.maturityValueFmt}</Text>
        </Card>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
        <StatPill value={metrics.activeCount} label="Active deposits" />
        <StatPill value={metrics.maturedCount} label="Matured" />
        <StatPill value={metrics.payoutsThisMonthFmt} label="Payouts this month" minWidth={118} />
        <StatPill value={metrics.maturitiesThisMonth} label="Maturities this month" minWidth={128} />
      </ScrollView>

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

      <View>
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Investment by bank</Text>
        <Card style={styles.gap12}>
          {banks.map(b => (
            <View key={b.bank}>
              <View style={styles.rowBetween}>
                <Text style={[styles.bankLabel, { color: theme.text }]}>{b.bank}</Text>
                <Text style={[styles.bankAmount, { color: theme.textMuted }]}>{b.amountFmt}</Text>
              </View>
              <View style={[styles.barTrack, { backgroundColor: theme.divider }]}>
                <LinearGradient colors={theme.gradientAccent.colors} start={GRADIENT_ANGLE.start} end={GRADIENT_ANGLE.end} style={[styles.barFill, { width: `${b.pct}%` }]} />
              </View>
            </View>
          ))}
        </Card>
      </View>

      <View>
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Investment by type</Text>
        <Card style={styles.typeCard}>
          <DonutChart entries={types.entries} centerLabel={types.totalCompact} />
          <View style={styles.typeList}>
            {types.entries.map(t => (
              <View key={t.type} style={styles.typeRow}>
                <View style={[styles.typeDot, { backgroundColor: t.color }]} />
                <Text style={[styles.typeLabel, { color: theme.text }]}>{t.type}</Text>
                <Text style={[styles.typePct, { color: theme.textFaint }]}>{t.pctLabel}</Text>
              </View>
            ))}
          </View>
        </Card>
      </View>

      <View>
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Projected interest — next 6 months</Text>
        <Card style={styles.chartCard}>
          <BarChart bars={projection} />
        </Card>
      </View>

      <Pressable onPress={actions.goMaturityTimeline}>
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
  hero: {
    borderRadius: 22,
    padding: 20,
    paddingHorizontal: 20,
  },
  heroLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: 12.5,
    letterSpacing: 0.2,
  },
  heroSub: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    marginTop: 8,
  },
  heroValue: {
    fontFamily: fontFamily.extrabold,
    fontSize: 32,
    letterSpacing: -0.4,
    marginTop: 2,
  },
  heroRow: {
    flexDirection: 'row',
    gap: 18,
    marginTop: 14,
  },
  heroItemLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
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
    width: '47.5%',
    padding: 14,
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
    fontSize: 20,
    letterSpacing: -0.2,
  },
  pillRow: {
    gap: 8,
    paddingVertical: 2,
  },
  sectionLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  gap8: {
    gap: 8,
  },
  gap12: {
    gap: 12,
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
    marginBottom: 5,
  },
  bankLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 12.5,
  },
  bankAmount: {
    fontFamily: fontFamily.regular,
    fontSize: 12.5,
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  typeList: {
    flex: 1,
    gap: 7,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  typeLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    flex: 1,
  },
  typePct: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
  },
  chartCard: {
    paddingBottom: 12,
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
});
