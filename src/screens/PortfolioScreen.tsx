import React, { useMemo } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { useAppActions, useAppState } from '../state/AppContext';
import { decorateFD, decorateRD, filteredSorted, DecoratedFD, DecoratedRD } from '../state/selectors';
import { GRADIENT_ANGLE } from '../theme/colors';
import { useRefresh } from '../hooks/useRefresh';
import Card from '../components/Card';
import BankLogo from '../components/BankLogo';
import StatusBadge from '../components/StatusBadge';
import ProgressBar from '../components/ProgressBar';
import SkeletonBlock from '../components/SkeletonBlock';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { IconSearch, IconFilter, IconBank, IconRefresh } from '../components/icons/Icons';

type DecoratedItem = DecoratedFD | DecoratedRD;

export default function PortfolioScreen() {
  const theme = useTheme();
  const state = useAppState();
  const actions = useAppActions();
  const { refreshing, onRefresh } = useRefresh();

  const kind = state.portfolioTab;
  const rawList = kind === 'FD' ? state.fdList : state.rdList;
  const filtered = useMemo(() => filteredSorted(rawList as any, kind, state), [rawList, kind, state]);
  const items: DecoratedItem[] = useMemo(
    () => (kind === 'FD' ? (filtered as any).map((f: any) => decorateFD(f, theme)) : (filtered as any).map((r: any) => decorateRD(r, theme))),
    [filtered, kind, theme],
  );
  const filtersActive = state.filterBank !== 'All' || state.filterType !== 'All' || state.filterStatus !== 'All';
  const hasAnyRecords = rawList.length > 0;

  if (state.loadError) {
    return (
      <View style={styles.container}>
        <ErrorState title="Couldn't load deposits" subtitle="Something went wrong reading your saved data." onRetry={actions.retryLoad} compact />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <View style={styles.controls}>
        <View style={styles.tabSwitch}>
          <Pressable
            onPress={actions.setPortfolioTabFD}
            style={styles.tabBtnWrap}
            accessibilityRole="tab"
            accessibilityState={{ selected: kind === 'FD' }}
            accessibilityLabel="Fixed Deposits"
          >
            {kind === 'FD' ? (
              <LinearGradient colors={theme.gradientAccent.colors} start={GRADIENT_ANGLE.start} end={GRADIENT_ANGLE.end} style={styles.tabBtn}>
                <Text style={[styles.tabText, { color: '#fff' }]}>FD</Text>
              </LinearGradient>
            ) : (
              <View style={styles.tabBtn}>
                <Text style={[styles.tabText, { color: theme.textMuted }]}>FD</Text>
              </View>
            )}
          </Pressable>
          <Pressable
            onPress={actions.setPortfolioTabRD}
            style={styles.tabBtnWrap}
            accessibilityRole="tab"
            accessibilityState={{ selected: kind === 'RD' }}
            accessibilityLabel="Recurring Deposits"
          >
            {kind === 'RD' ? (
              <LinearGradient colors={theme.gradientAccent.colors} start={GRADIENT_ANGLE.start} end={GRADIENT_ANGLE.end} style={styles.tabBtn}>
                <Text style={[styles.tabText, { color: '#fff' }]}>RD</Text>
              </LinearGradient>
            ) : (
              <View style={styles.tabBtn}>
                <Text style={[styles.tabText, { color: theme.textMuted }]}>RD</Text>
              </View>
            )}
          </Pressable>
        </View>

        <View style={styles.searchRow}>
          <View style={[styles.searchBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <IconSearch color={theme.textFaint} />
            <TextInput
              value={state.search}
              onChangeText={actions.setSearch}
              placeholder="Search bank, number, holder"
              placeholderTextColor={theme.textFaint}
              style={[styles.searchInput, { color: theme.text }]}
              accessibilityLabel="Search bank, number, holder"
            />
          </View>
          <Pressable
            onPress={actions.openFilterSheet}
            style={[styles.filterBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
            accessibilityRole="button"
            accessibilityLabel={filtersActive ? 'Filter and sort, filters active' : 'Filter and sort'}
          >
            <IconFilter color={theme.text} />
            {filtersActive && <View style={styles.filterDotWrap}>
              <LinearGradient colors={theme.gradientAccent.colors} start={GRADIENT_ANGLE.start} end={GRADIENT_ANGLE.end} style={styles.filterDot} />
            </View>}
          </Pressable>
        </View>
      </View>

      {!state.hydrated ? (
        <View style={styles.listPad}>
          <SkeletonBlock height={104} />
          <SkeletonBlock height={104} />
          <SkeletonBlock height={104} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          contentContainerStyle={items.length === 0 ? styles.emptyListPad : styles.listPad}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} colors={[theme.accent]} progressBackgroundColor={theme.card} />}
          ListEmptyComponent={
            hasAnyRecords ? (
              <EmptyState onAction={actions.resetFilters} compact />
            ) : (
              <EmptyState
                title={`No ${kind}s yet`}
                subtitle={`Tap the + button to add your first ${kind}.`}
                actionLabel={`Add ${kind}`}
                onAction={kind === 'FD' ? actions.openAddFD : actions.openAddRD}
                gradient={theme.gradientPortfolio}
                icon={kind === 'FD' ? <IconBank size={30} color="#fff" /> : <IconRefresh size={30} color="#fff" />}
              />
            )
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => (item.kind === 'FD' ? actions.openFDDetail(item.id) : actions.openRDDetail(item.id))}>
              <Card style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemHeaderLeft}>
                    <BankLogo bankName={item.bankName} />
                    <View style={styles.flexShrink}>
                      <Text style={[styles.itemBank, { color: theme.text }]}>{item.bankName}</Text>
                      <Text style={[styles.itemMeta, { color: theme.textFaint }]}>
                        {item.number} · {item.typeLabel}
                      </Text>
                    </View>
                  </View>
                  <StatusBadge bg={item.statusBg} fg={item.statusFg} label={item.statusLabel} />
                </View>
                <View style={styles.amountRow}>
                  <Text style={[styles.amount, { color: theme.text }]}>{item.amountFmt}</Text>
                  <Text style={[styles.rate, { color: theme.success }]}>{item.rateLabel}</Text>
                </View>
                <View style={styles.progressLabelRow}>
                  <Text style={[styles.progressLabel, { color: theme.textMuted }]}>{item.progressLabel}</Text>
                  <Text style={[styles.progressLabel, { color: theme.textMuted }]}>{item.maturityLabel}</Text>
                </View>
                <ProgressBar progress={item.progressPct} fill={item.progressColor} />
              </Card>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  controls: {
    paddingHorizontal: 16,
    gap: 14,
  },
  tabSwitch: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    gap: 3,
    backgroundColor: 'rgba(120,120,140,0.08)',
  },
  tabBtnWrap: {
    flex: 1,
  },
  tabBtn: {
    paddingVertical: 9,
    borderRadius: 9,
    alignItems: 'center',
  },
  tabText: {
    fontFamily: fontFamily.semibold,
    fontSize: 13.5,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: 13.5,
    padding: 0,
  },
  filterBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterDotWrap: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  filterDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  listPad: {
    padding: 16,
    paddingTop: 14,
    paddingBottom: 100,
    gap: 10,
  },
  emptyListPad: {
    padding: 16,
    paddingTop: 14,
    paddingBottom: 100,
    gap: 10,
    flexGrow: 1,
    justifyContent: 'center',
  },
  itemCard: {
    padding: 0,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  itemHeaderLeft: {
    flexDirection: 'row',
    gap: 10,
    minWidth: 0,
    flexShrink: 1,
  },
  flexShrink: {
    minWidth: 0,
    flexShrink: 1,
  },
  itemBank: {
    fontFamily: fontFamily.semibold,
    fontSize: 14.5,
  },
  itemMeta: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    marginTop: 1,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 12,
  },
  amount: {
    fontFamily: fontFamily.bold,
    fontSize: 19,
    letterSpacing: -0.2,
  },
  rate: {
    fontFamily: fontFamily.semibold,
    fontSize: 13,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 5,
  },
  progressLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 11.5,
  },
});
