import React, { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { useAppActions, useAppState } from '../state/AppContext';
import { decorateFD, decorateRD, filteredSorted, DecoratedFD, DecoratedRD } from '../state/selectors';
import { GRADIENT_ANGLE } from '../theme/colors';
import Card from '../components/Card';
import Avatar from '../components/Avatar';
import StatusBadge from '../components/StatusBadge';
import ProgressBar from '../components/ProgressBar';
import SkeletonBlock from '../components/SkeletonBlock';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { IconSearch, IconFilter } from '../components/icons/Icons';

type DecoratedItem = DecoratedFD | DecoratedRD;

export default function PortfolioScreen() {
  const theme = useTheme();
  const state = useAppState();
  const actions = useAppActions();

  const kind = state.portfolioTab;
  const rawList = kind === 'FD' ? state.fdList : state.rdList;
  const filtered = useMemo(() => filteredSorted(rawList as any, kind, state), [rawList, kind, state]);
  const items: DecoratedItem[] = useMemo(
    () => (kind === 'FD' ? (filtered as any).map((f: any) => decorateFD(f, theme)) : (filtered as any).map((r: any) => decorateRD(r, theme))),
    [filtered, kind, theme],
  );
  const filtersActive = state.filterBank !== 'All' || state.filterType !== 'All' || state.filterStatus !== 'All';

  if (state.demoMode === 'error') {
    return (
      <View style={styles.container}>
        <ErrorState title="Couldn't load deposits" onRetry={actions.setDemoNormal} compact />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <View style={styles.controls}>
        <View style={styles.tabSwitch}>
          <Pressable onPress={actions.setPortfolioTabFD} style={styles.tabBtnWrap}>
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
          <Pressable onPress={actions.setPortfolioTabRD} style={styles.tabBtnWrap}>
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
            />
          </View>
          <Pressable onPress={actions.openFilterSheet} style={[styles.filterBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <IconFilter color={theme.text} />
            {filtersActive && <View style={styles.filterDotWrap}>
              <LinearGradient colors={theme.gradientAccent.colors} start={GRADIENT_ANGLE.start} end={GRADIENT_ANGLE.end} style={styles.filterDot} />
            </View>}
          </Pressable>
        </View>
      </View>

      {state.demoMode === 'loading' ? (
        <View style={styles.listPad}>
          <SkeletonBlock height={104} />
          <SkeletonBlock height={104} />
          <SkeletonBlock height={104} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listPad}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState onAction={actions.resetFilters} />}
          renderItem={({ item }) => (
            <Pressable onPress={() => (item.kind === 'FD' ? actions.openFDDetail(item.id) : actions.openRDDetail(item.id))}>
              <Card style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemHeaderLeft}>
                    <Avatar bg={item.avatarBg} fg={item.avatarFg} initials={item.bankInitials} />
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
