import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { useAppActions, useAppState } from '../state/AppContext';
import { timelineMonths } from '../state/selectors';
import Card from '../components/Card';
import TopAppBar from '../components/TopAppBar';

export default function MaturityTimelineScreen() {
  const theme = useTheme();
  const state = useAppState();
  const actions = useAppActions();
  const months = useMemo(() => timelineMonths(state, theme), [state, theme]);

  return (
    <View style={[styles.flex, { backgroundColor: theme.bg }]}>
      <TopAppBar title="Maturity Timeline" showBack onBack={actions.back} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {months.map(mo => (
          <View key={mo.label}>
            <Text style={[styles.monthLabel, { color: theme.text }]}>{mo.label}</Text>
            <View style={[styles.list, { borderLeftColor: theme.border }]}>
              {mo.items.map(it => (
                <Pressable
                  key={it.id}
                  onPress={() => (it.kind === 'FD' ? actions.openFDDetail(it.id) : actions.openRDDetail(it.id))}
                  style={styles.itemWrap}
                >
                  <View style={[styles.dot, { backgroundColor: it.dotColor, borderColor: theme.bg }]} />
                  <Card style={styles.itemCard}>
                    <View style={styles.itemRow}>
                      <View style={styles.flexShrink}>
                        <Text style={[styles.itemTitle, { color: theme.text }]}>
                          {it.bankName} · {it.number}
                        </Text>
                        <Text style={[styles.itemDate, { color: theme.textMuted }]}>{it.dateLabel}</Text>
                      </View>
                      <Text style={[styles.itemAmount, { color: theme.text }]}>{it.amountFmt}</Text>
                    </View>
                    {it.actionBadge && (
                      <View style={[styles.badge, { backgroundColor: it.actionBadgeBg }]}>
                        <Text style={[styles.badgeText, { color: it.actionBadgeFg }]}>{it.actionBadge}</Text>
                      </View>
                    )}
                  </Card>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  monthLabel: {
    fontFamily: fontFamily.bold,
    fontSize: 13,
    marginVertical: 14,
  },
  list: {
    gap: 8,
    paddingLeft: 14,
    borderLeftWidth: 2,
  },
  itemWrap: {
    marginLeft: 6,
    position: 'relative',
  },
  dot: {
    position: 'absolute',
    left: -22,
    top: 16,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    borderWidth: 2,
    zIndex: 1,
  },
  itemCard: {
    padding: 0,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  flexShrink: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: 13.5,
  },
  itemDate: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    marginTop: 2,
  },
  itemAmount: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    flexShrink: 0,
  },
  badge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    borderRadius: 100,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  badgeText: {
    fontFamily: fontFamily.semibold,
    fontSize: 10.5,
  },
});
