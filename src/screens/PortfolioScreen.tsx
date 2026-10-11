import React, { useMemo } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { useAppActions, useAppState } from '../state/AppContext';
import {
  decorateFD,
  decorateRD,
  filteredSorted,
  portfolioMetrics,
  DecoratedFD,
  DecoratedRD,
} from '../state/selectors';
import { formatINR } from '../data/portfolioData';
import { useRefresh } from '../hooks/useRefresh';
import Card from '../components/Card';
import BankBadge from '../components/BankBadge';
import StatusBadge from '../components/StatusBadge';
import ProgressBar from '../components/ProgressBar';
import SkeletonBlock from '../components/SkeletonBlock';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import {
  IconSearch,
  IconFilter,
  IconBank,
  IconRefresh,
  IconPlus,
} from '../components/icons/Icons';

type DecoratedItem = DecoratedFD | DecoratedRD;
const SORT_LABELS = {
  maturity: 'Maturity: soonest',
  amount: 'Amount: highest',
  rate: 'Rate: highest',
};

export default function PortfolioScreen() {
  const theme = useTheme();
  const state = useAppState();
  const actions = useAppActions();
  const { fontScale } = useWindowDimensions();
  const { refreshing, onRefresh } = useRefresh();
  const kind = state.portfolioTab;
  const rawList = kind === 'FD' ? state.fdList : state.rdList;
  const items: DecoratedItem[] = useMemo(
    () =>
      kind === 'FD'
        ? filteredSorted(state.fdList, 'FD', state).map(record =>
            decorateFD(record, theme),
          )
        : filteredSorted(state.rdList, 'RD', state).map(record =>
            decorateRD(record, theme),
          ),
    [kind, state, theme],
  );
  const metrics = useMemo(() => portfolioMetrics(state, kind), [state, kind]);
  const filters = [
    { label: state.filterBank, clear: () => actions.setFilterBank('All') },
    { label: state.filterType, clear: () => actions.setFilterType('All') },
    { label: state.filterStatus, clear: () => actions.setFilterStatus('All') },
  ].filter(filter => filter.label !== 'All');
  const add = kind === 'FD' ? actions.openAddFD : actions.openAddRD;
  const stack = fontScale > 1.25;

  if (state.loadError)
    return (
      <View style={styles.listPad}>
        <ErrorState
          title="Couldn't load deposits"
          subtitle="Something went wrong reading your saved data."
          onRetry={actions.retryLoad}
          compact
        />
      </View>
    );

  const filterChips =
    filters.length || state.search || state.sortBy !== 'maturity' ? (
      <View style={styles.chips}>
        {filters.map((filter, index) => (
          <Pressable
            key={index}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${filter.label} filter`}
            onPress={filter.clear}
            style={[
              styles.chip,
              { backgroundColor: theme.tint(theme.accent, 0.12) },
            ]}
          >
            <Text style={[styles.caption, { color: theme.accent }]}>
              {filter.label} ×
            </Text>
          </Pressable>
        ))}
        <Pressable
          accessibilityRole="button"
          onPress={actions.resetFilters}
          style={styles.textButton}
        >
          <Text style={[styles.caption, { color: theme.accent }]}>
            Clear all
          </Text>
        </Pressable>
      </View>
    ) : null;

  return (
    <View style={styles.flex}>
      <View style={styles.controls}>
        <View style={styles.searchRow}>
          <View
            style={[
              styles.searchBox,
              { backgroundColor: theme.card, borderColor: theme.borderStrong },
            ]}
          >
            <IconSearch color={theme.textMuted} />
            <TextInput
              value={state.search}
              onChangeText={actions.setSearch}
              placeholder="Search bank, number, holder"
              placeholderTextColor={theme.textMuted}
              style={[styles.searchInput, { color: theme.text }]}
              accessibilityLabel="Search bank, number, holder"
              autoCorrect={false}
            />
            {state.search ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                onPress={() => actions.setSearch('')}
                style={styles.textButton}
              >
                <Text style={[styles.caption, { color: theme.accent }]}>Clear</Text>
              </Pressable>
            ) : null}
          </View>
          <Pressable
            onPress={actions.openFilterSheet}
            style={[
              styles.filterButton,
              { backgroundColor: theme.card, borderColor: theme.borderStrong },
            ]}
            accessibilityRole="button"
            accessibilityLabel={
              filters.length
                ? `Filter and sort, ${filters.length} filters active`
                : 'Filter and sort'
            }
          >
            <IconFilter size={18} color={theme.accent} />
            <Text style={[styles.filterText, { color: theme.text }]}>
              Filter{filters.length ? ` (${filters.length})` : ''}
            </Text>
          </Pressable>
        </View>
      </View>
      {!state.hydrated ? (
        <View style={styles.listPad}>
          <SkeletonBlock height={90} />
          <SkeletonBlock height={180} />
          <SkeletonBlock height={180} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listPad}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.accent}
              colors={[theme.accent]}
              progressBackgroundColor={theme.card}
            />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <View
                style={[
                  styles.summary,
                  {
                    backgroundColor: theme.tint(theme.accent, 0.09),
                    borderColor: theme.tint(theme.accent, 0.2),
                  },
                ]}
              >
                <Text style={[styles.summaryHeading, { color: theme.accent }]}>
                  {metrics.activeCount} active {kind}
                  {metrics.activeCount === 1 ? '' : 's'} · All active totals
                </Text>
                <View style={[styles.metrics, stack && styles.stacked]}>
                  <View style={styles.metric}>
                    <Text style={[styles.caption, { color: theme.textMuted }]}>
                      Invested
                    </Text>
                    <Text style={[styles.metricValue, { color: theme.text }]}>
                      {metrics.investedFmt}
                    </Text>
                  </View>
                  <View style={styles.metric}>
                    <Text style={[styles.caption, { color: theme.textMuted }]}>
                      Estimated maturity
                    </Text>
                    <Text style={[styles.metricValue, { color: theme.text }]}>
                      {metrics.maturityFmt}
                    </Text>
                  </View>
                </View>
              </View>
              {filterChips}
              <View style={styles.results}>
                <Text
                  accessibilityLiveRegion="polite"
                  style={[styles.caption, { color: theme.textMuted }]}
                >
                  {items.length} of {rawList.length} deposits
                </Text>
                <Text style={[styles.caption, { color: theme.textMuted }]}>
                  {SORT_LABELS[state.sortBy]}
                </Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            rawList.length ? (
              <EmptyState onAction={actions.resetFilters} compact />
            ) : (
              <EmptyState
                title={`No ${kind}s yet`}
                subtitle={`Add your first ${kind} to track its growth and maturity.`}
                actionLabel={`Add ${kind}`}
                onAction={add}
                gradient={theme.gradientPortfolio}
                icon={
                  kind === 'FD' ? (
                    <IconBank size={30} color={theme.accent} />
                  ) : (
                    <IconRefresh size={30} color={theme.accent} />
                  )
                }
              />
            )
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${item.bankName}, ${item.number}, ${item.amountFmt}, ${item.statusLabel}. View deposit`}
              onPress={() =>
                item.kind === 'FD'
                  ? actions.openFDDetail(item.id)
                  : actions.openRDDetail(item.id)
              }
            >
              <Card style={styles.itemCard}>
                <View style={styles.bankRow}>
                  <BankBadge bankName={item.bankName} />
                  <View style={styles.bankText}>
                    <Text style={[styles.bankName, { color: theme.text }]}>
                      {item.bankName}
                    </Text>
                    <Text style={[styles.caption, { color: theme.textMuted }]}>
                      {item.number} · {item.typeLabel}
                    </Text>
                  </View>
                </View>
                <View style={styles.statusRow}>
                  <StatusBadge
                    bg={item.statusBg}
                    fg={item.statusFg}
                    label={item.statusLabel}
                  />
                  <Text style={[styles.caption, { color: theme.textMuted }]}>
                    {item.remainingLabel}
                  </Text>
                </View>
                <View style={[styles.metrics, stack && styles.stacked]}>
                  <View style={styles.metric}>
                    <Text style={[styles.caption, { color: theme.textMuted }]}>
                      {item.kind === 'FD' ? 'Principal' : 'Monthly installment'}
                    </Text>
                    <Text style={[styles.amount, { color: theme.text }]}>
                      {item.amountFmt}
                    </Text>
                  </View>
                  <View style={styles.metric}>
                    <Text style={[styles.caption, { color: theme.textMuted }]}>
                      Interest rate
                    </Text>
                    <Text
                      style={[
                        styles.rate,
                        {
                          color:
                            theme.mode === 'dark' ? theme.success : '#236747',
                        },
                      ]}
                    >
                      {item.rateLabel}
                    </Text>
                  </View>
                </View>
                <View
                  style={[styles.maturity, { borderTopColor: theme.divider }]}
                >
                  <Text style={[styles.caption, { color: theme.textMuted }]}>
                    {item.status === 'Closed' ||
                    item.status === 'Prematurely Closed'
                      ? 'Scheduled maturity value'
                      : 'Estimated maturity value'}
                  </Text>
                  <Text style={[styles.maturityValue, { color: theme.text }]}>
                    {formatINR(item.maturityAmount)}
                  </Text>
                  <Text style={[styles.caption, { color: theme.textMuted }]}>
                    {item.maturityLabel}
                  </Text>
                </View>
                <View style={styles.progress}>
                  <Text style={[styles.caption, { color: theme.textMuted }]}>
                    {item.progressLabel}
                  </Text>
                  <ProgressBar
                    progress={item.progressPct}
                    fill={item.progressColor}
                  />
                </View>
              </Card>
            </Pressable>
          )}
        />
      )}
      <Pressable
        onPress={add}
        accessibilityRole="button"
        accessibilityLabel={`Add ${kind}`}
        style={[styles.addFab, { backgroundColor: theme.accent, shadowColor: theme.mode === 'dark' ? '#000' : theme.text }]}
      >
        <IconPlus size={20} color={theme.mode === 'dark' ? theme.bg : '#fff'} />
        <Text style={[styles.buttonText, { color: theme.mode === 'dark' ? theme.bg : '#fff' }]}>Add {kind}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  controls: { paddingHorizontal: 16, paddingTop: 10, gap: 8 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    paddingVertical: 10,
    fontFamily: fontFamily.regular,
    fontSize: 14,
  },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterButton: {
    height: 48,
    minWidth: 88,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  filterText: { fontFamily: fontFamily.semibold, fontSize: 13 },
  addFab: {
    position: 'absolute',
    right: 20,
    bottom: 4,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    elevation: 6,
    shadowOpacity: 0.24,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  buttonText: { fontFamily: fontFamily.semibold, fontSize: 14, flexShrink: 1 },
  textButton: {
    minHeight: 48,
    minWidth: 48,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listPad: { padding: 16, paddingBottom: 96, gap: 12 },
  listHeader: { gap: 12 },
  summary: { padding: 16, borderRadius: 18, borderWidth: 1, gap: 12 },
  summaryHeading: { fontFamily: fontFamily.semibold, fontSize: 12 },
  metrics: { flexDirection: 'row', gap: 16 },
  stacked: { flexDirection: 'column' },
  metric: { flex: 1, gap: 4, minWidth: 0 },
  metricValue: {
    fontFamily: fontFamily.bold,
    fontSize: 17,
    fontVariant: ['tabular-nums'],
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'center',
    maxWidth: '100%',
  },
  results: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'space-between',
  },
  itemCard: { padding: 16, gap: 14, borderRadius: 20 },
  bankRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bankText: { flex: 1, gap: 4, minWidth: 0 },
  bankName: { fontFamily: fontFamily.semibold, fontSize: 15 },
  caption: { fontFamily: fontFamily.regular, fontSize: 12, flexShrink: 1 },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amount: {
    fontFamily: fontFamily.bold,
    fontSize: 21,
    fontVariant: ['tabular-nums'],
  },
  rate: {
    fontFamily: fontFamily.semibold,
    fontSize: 17,
    fontVariant: ['tabular-nums'],
  },
  maturity: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    gap: 4,
  },
  maturityValue: {
    fontFamily: fontFamily.semibold,
    fontSize: 17,
    fontVariant: ['tabular-nums'],
  },
  progress: { gap: 6 },
});
