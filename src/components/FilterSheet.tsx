import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { useAppActions, useAppState } from '../state/AppContext';
import { chipStyle } from '../state/selectors';
import { GRADIENT_ANGLE } from '../theme/colors';
import { IconCheck } from './icons/Icons';
import BottomSheet from './BottomSheet';

const SORT_DEFS: { key: 'maturity' | 'amount' | 'rate'; label: string }[] = [
  { key: 'maturity', label: 'Maturity date (soonest first)' },
  { key: 'amount', label: 'Investment amount (highest first)' },
  { key: 'rate', label: 'Interest rate (highest first)' },
];

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const theme = useTheme();
  const style = chipStyle(theme, active);
  const bg = typeof style.bg === 'string' ? style.bg : undefined;
  const content = (
    <Text style={[styles.chipText, { color: style.fg }]}>{label}</Text>
  );
  if (bg === undefined) {
    return (
      <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress}>
        <LinearGradient colors={(style.bg as any).colors} start={GRADIENT_ANGLE.start} end={GRADIENT_ANGLE.end} style={[styles.chip, { borderColor: 'transparent' }]}>
          {content}
        </LinearGradient>
      </Pressable>
    );
  }
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.chip, { backgroundColor: bg, borderColor: style.border }]}>
      {content}
    </Pressable>
  );
}

export default function FilterSheet() {
  const theme = useTheme();
  const state = useAppState();
  const actions = useAppActions();

  const rawList = state.portfolioTab === 'FD' ? state.fdList : state.rdList;
  const banks = useMemo(() => ['All', ...new Set(rawList.map(i => i.bankName))], [rawList]);
  const types = useMemo(
    () => ['All', ...new Set(rawList.map((i: any) => (state.portfolioTab === 'FD' ? i.fdType : i.rdType)))],
    [rawList, state.portfolioTab],
  );
  const statuses = useMemo(() => ['All', ...new Set(rawList.map(i => i.status))], [rawList]);

  return (
    <BottomSheet visible={state.filterSheetOpen} onClose={actions.closeFilterSheet} sheetStyle={styles.sheet}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.text }]}>Filter &amp; sort</Text>

        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Bank</Text>
        <View style={styles.chipRow}>
          {banks.map(b => (
            <Chip key={b} label={b} active={state.filterBank === b} onPress={() => actions.setFilterBank(b)} />
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Type</Text>
        <View style={styles.chipRow}>
          {types.map(t => (
            <Chip key={t} label={t} active={state.filterType === t} onPress={() => actions.setFilterType(t)} />
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Status</Text>
        <View style={styles.chipRow}>
          {statuses.map(s => (
            <Chip key={s} label={s} active={state.filterStatus === s} onPress={() => actions.setFilterStatus(s)} />
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Sort by</Text>
        <View style={styles.sortList}>
          {SORT_DEFS.map(sd => {
            const active = state.sortBy === sd.key;
            return (
              <Pressable
                key={sd.key}
                onPress={() => actions.setSortBy(sd.key)}
                style={[
                  styles.sortRow,
                  { backgroundColor: active ? 'rgba(111,102,232,0.13)' : theme.card, borderColor: theme.border },
                ]}
              >
                <Text style={[styles.sortLabel, { color: theme.text }]}>{sd.key === 'amount' && state.portfolioTab === 'RD' ? 'Monthly installment (highest first)' : sd.label}</Text>
                {active && <IconCheck size={16} color={theme.accent} />}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.actionRow}>
          <Pressable onPress={actions.resetFilters} style={[styles.actionBtn, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}>
            <Text style={[styles.actionText, { color: theme.text }]}>Reset</Text>
          </Pressable>
          <Pressable onPress={actions.closeFilterSheet} style={styles.actionBtnFlex}>
            <LinearGradient colors={theme.gradientAccent.colors} start={GRADIENT_ANGLE.start} end={GRADIENT_ANGLE.end} style={styles.actionGradient}>
              <Text style={[styles.actionText, { color: '#fff' }]}>Apply</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheet: {
    paddingHorizontal: 18,
    paddingBottom: 26,
    maxHeight: '80%',
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    marginBottom: 16,
  },
  sectionLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  chip: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 100,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: fontFamily.medium,
    fontSize: 12.5,
  },
  sortList: {
    gap: 6,
    marginBottom: 20,
  },
  sortRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
  },
  sortLabel: {
    flexShrink: 1,
    fontFamily: fontFamily.medium,
    fontSize: 13.5,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    minHeight: 48,
    flex: 1,
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: 14,
  },
  actionBtnFlex: {
    flex: 1,
  },
  actionGradient: {
    minHeight: 48,
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: 14,
  },
  actionText: {
    fontFamily: fontFamily.semibold,
    fontSize: 14,
  },
});
